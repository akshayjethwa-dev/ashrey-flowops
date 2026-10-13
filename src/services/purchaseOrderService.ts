// src/services/purchaseOrderService.ts

import { db } from '../firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import {
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
  PoApprovalStatus,
  SupplierAckStatus,
  PoSourceTrigger,
  PoAutomationRule,
  PoApprovalAuditEntry,
  SupplierAcknowledgment
} from '../types/purchaseOrder';
import { multiLocationInventoryService } from './multiLocationInventoryService';
import { StockInboundOrder } from '../types/inventoryLocation';
import { MrpPurchaseRecommendation } from '../types/mrp';

export const DEFAULT_PO_AUTOMATION_RULE: PoAutomationRule = {
  id: 'rule-po-default',
  tenantId: 'tenant-default',
  enabled: true,
  autoApproveUnderAmount: 50000,   // ₹50,000 threshold
  managerApprovalLimit: 500000,    // ₹5,00,000
  autoNotifyVendorOnApproval: true,
  notifyChannel: 'both',
  safetyStockBufferMultiplier: 1.0
};

export const SEED_PURCHASE_ORDERS = (tenantId: string): PurchaseOrder[] => {
  const now = Date.now();
  return [
    {
      id: 'po-2026-902',
      tenantId,
      poNumber: 'PO-2026-902',
      sourceTrigger: 'mrp_engine',
      triggerReference: 'MRP Run MRP-2026-0038 • 30d Planning Horizon',
      plantId: 'plant-pune',
      plantName: 'Pune Heavy Forge Facility',
      shipToAddress: 'Gate #1 Inward Dock, Chakan Industrial Area Phase II, Pune 410501',
      billingAddress: 'Corporate Office, Pune Facility, Maharashtra',
      supplierId: 'sup-tata',
      supplierName: 'Tata Prime Steel Ltd.',
      supplierEmail: 'orders@tataprimesteel.com',
      supplierPhone: '+91 98230 11982',
      supplierGstin: '27AAACT2948K1ZP',
      supplierContactPerson: 'Rajesh Kulkarni (Zonal Sales Head)',
      paymentTerms: 'Net 30 Days • Freight Paid',
      deliveryTerms: 'FOR Destination (Plant Gate)',
      orderDate: new Date(now - 6 * 86400000).toISOString(),
      expectedDeliveryDate: new Date(now + 2 * 86400000).toISOString(),
      needByDate: new Date(now + 3 * 86400000).toISOString(),
      items: [
        {
          id: 'poi-1',
          stockItemId: 'stock-1',
          stockItemCode: 'WR-1002',
          stockItemName: 'Wire Rod — High Tensile Steel 8mm',
          category: 'raw_material',
          orderedQty: 15.0,
          receivedQty: 0,
          unit: 'tonnes',
          unitPrice: 68500,
          taxRatePct: 18,
          taxAmount: Math.round(15.0 * 68500 * 0.18),
          totalAmount: Math.round(15.0 * 68500 * 1.18),
          hsnCode: '7213.91.90',
          targetStoreId: 'store-pune-rm',
          targetStoreName: 'Main Raw Materials Store',
          targetBinId: 'bin-pune-rm-01',
          targetBinCode: 'BIN-RM-A01',
          needByDate: new Date(now + 3 * 86400000).toISOString().split('T')[0]
        }
      ],
      subtotal: 15.0 * 68500,
      totalTax: Math.round(15.0 * 68500 * 0.18),
      totalAmount: Math.round(15.0 * 68500 * 1.18),
      approvalStatus: 'approved',
      approvalRequired: true,
      approvalLimitTier: 'executive_level',
      approvalsHistory: [
        {
          id: 'appr-1',
          stepName: 'Procurement Manager Sign-off',
          approverId: 'usr-procurement',
          approverName: 'Sanjay Sharma',
          approverRole: 'Procurement Manager',
          action: 'approved',
          timestamp: new Date(now - 5 * 86400000).toISOString(),
          comments: 'Approved against high tensile forging schedule WO-2026-001.'
        },
        {
          id: 'appr-2',
          stepName: 'Finance VP Authorization (> ₹5L)',
          approverId: 'usr-finance',
          approverName: 'Anita Deshmukh',
          approverRole: 'VP Finance',
          action: 'approved',
          timestamp: new Date(now - 5 * 86400000 + 3600000).toISOString(),
          comments: 'Capex/Opex budget allocation verified.'
        }
      ],
      supplierAck: {
        status: 'acknowledged_on_time',
        acknowledgedAt: new Date(now - 4 * 86400000).toISOString(),
        acknowledgedByName: 'Rajesh Kulkarni',
        vendorConfirmationRef: 'TATA-SO-2026-8819',
        originalExpectedDate: new Date(now + 2 * 86400000).toISOString().split('T')[0],
        confirmedExpectedDate: new Date(now + 2 * 86400000).toISOString().split('T')[0],
        trackingCarrier: 'TCI Freight Logistics',
        lorryReceiptNumber: 'LR-TCI-PUN-8821',
        dispatchDate: new Date(now - 1 * 86400000).toISOString(),
        notes: 'Coil trailer departed Jamshedpur dispatch yard; on track for dock delivery.'
      },
      status: 'in_transit',
      createdById: 'usr-procurement',
      createdByName: 'Sanjay Sharma',
      createdAt: new Date(now - 6 * 86400000).toISOString(),
      updatedAt: new Date(now - 1 * 86400000).toISOString(),
      notes: 'Vendor delivery gate pass pre-cleared for Gate 1 dock arrival.'
    },
    {
      id: 'po-2026-881',
      tenantId,
      poNumber: 'PO-2026-881',
      sourceTrigger: 'reorder_level_breach',
      triggerReference: 'Stock fell below minimum reorder buffer (Current: 80L, Min: 200L)',
      plantId: 'plant-pune',
      plantName: 'Pune Heavy Forge Facility',
      shipToAddress: 'Gate #2 Maintenance Bay, Chakan Industrial Area Phase II, Pune',
      billingAddress: 'Corporate Office, Pune Facility, Maharashtra',
      supplierId: 'sup-castrol',
      supplierName: 'Castrol Industrial Lubricants',
      supplierEmail: 'orders@castrol-industrial.in',
      supplierPhone: '+91 97654 33210',
      supplierGstin: '27AAACC4918L1Z3',
      supplierContactPerson: 'Vikram Joshi (Industrial Account Lead)',
      paymentTerms: 'Net 15 Days • Drum Delivery',
      deliveryTerms: 'FOR Destination (Plant Gate)',
      orderDate: new Date(now - 3 * 86400000).toISOString(),
      expectedDeliveryDate: new Date(now + 1 * 86400000).toISOString(),
      needByDate: new Date(now + 2 * 86400000).toISOString(),
      items: [
        {
          id: 'poi-2',
          stockItemId: 'stock-2',
          stockItemCode: 'OIL-HYD68',
          stockItemName: 'Hydraulic Oil ISO VG 68 Premium',
          category: 'consumable',
          orderedQty: 200,
          receivedQty: 0,
          unit: 'litres',
          unitPrice: 340,
          taxRatePct: 18,
          taxAmount: Math.round(200 * 340 * 0.18),
          totalAmount: Math.round(200 * 340 * 1.18),
          hsnCode: '2710.19.80',
          targetStoreId: 'store-pune-cn',
          targetStoreName: 'Consumables & Lubricants Depot',
          targetBinId: 'bin-pune-cn-01',
          targetBinCode: 'BIN-CN-S01',
          needByDate: new Date(now + 2 * 86400000).toISOString().split('T')[0]
        }
      ],
      subtotal: 200 * 340,
      totalTax: Math.round(200 * 340 * 0.18),
      totalAmount: Math.round(200 * 340 * 1.18),
      approvalStatus: 'approved',
      approvalRequired: false,
      approvalLimitTier: 'auto_approved',
      approvalsHistory: [
        {
          id: 'appr-auto-1',
          stepName: 'System Auto-Approval (< ₹50,000 threshold)',
          approverId: 'system-auto',
          approverName: 'FlowOps Auto-Approval Rule',
          approverRole: 'System',
          action: 'approved',
          timestamp: new Date(now - 3 * 86400000).toISOString(),
          comments: 'Auto-approved; PO value ₹80,240 is below approval threshold limit.'
        }
      ],
      supplierAck: {
        status: 'acknowledged_on_time',
        acknowledgedAt: new Date(now - 2 * 86400000).toISOString(),
        acknowledgedByName: 'Vikram Joshi',
        vendorConfirmationRef: 'CAS-CONF-9921',
        originalExpectedDate: new Date(now + 1 * 86400000).toISOString().split('T')[0],
        confirmedExpectedDate: new Date(now + 1 * 86400000).toISOString().split('T')[0],
        notes: 'Barrels scheduled on morning delivery van from Pune depot.'
      },
      status: 'acknowledged',
      createdById: 'system-auto',
      createdByName: 'Reorder Level Monitor',
      createdAt: new Date(now - 3 * 86400000).toISOString(),
      updatedAt: new Date(now - 2 * 86400000).toISOString(),
      notes: 'Auto-generated upon sensor reorder level trigger in Press Cell #1.'
    },
    {
      id: 'po-2026-1048',
      tenantId,
      poNumber: 'PO-2026-1048',
      sourceTrigger: 'mrp_engine',
      triggerReference: 'MRP Recommendation rec-seed-02 • WO-2026-002 Drive Shaft',
      plantId: 'plant-pune',
      plantName: 'Pune Heavy Forge Facility',
      shipToAddress: 'Gate #1 Inward Dock, Chakan Industrial Area Phase II, Pune',
      billingAddress: 'Corporate Office, Pune Facility, Maharashtra',
      supplierId: 'sup-jindal',
      supplierName: 'Jindal Steel & Power Corp',
      supplierEmail: 'sales@jindalsteel.com',
      supplierPhone: '+91 98901 44556',
      supplierGstin: '27AAACJ8812M1Z8',
      supplierContactPerson: 'Prakash Rao (Regional GM)',
      paymentTerms: 'Net 45 Days • Ex-Works',
      deliveryTerms: 'FOR Destination (Plant Gate)',
      orderDate: new Date(now - 1 * 86400000).toISOString(),
      expectedDeliveryDate: new Date(now + 6 * 86400000).toISOString(),
      needByDate: new Date(now + 8 * 86400000).toISOString(),
      items: [
        {
          id: 'poi-3',
          stockItemId: 'stock-6',
          stockItemCode: 'RB-40CS',
          stockItemName: 'Round Bars - Carbon Steel CS45 40mm',
          category: 'raw_material',
          orderedQty: 5.5,
          receivedQty: 0,
          unit: 'tonnes',
          unitPrice: 62000,
          taxRatePct: 18,
          taxAmount: Math.round(5.5 * 62000 * 0.18),
          totalAmount: Math.round(5.5 * 62000 * 1.18),
          hsnCode: '7214.20.00',
          targetStoreId: 'store-pune-rm',
          targetStoreName: 'Main Raw Materials Store',
          targetBinId: 'bin-pune-rm-02',
          targetBinCode: 'BIN-RM-A02',
          needByDate: new Date(now + 8 * 86400000).toISOString().split('T')[0]
        }
      ],
      subtotal: 5.5 * 62000,
      totalTax: Math.round(5.5 * 62000 * 0.18),
      totalAmount: Math.round(5.5 * 62000 * 1.18),
      approvalStatus: 'pending',
      approvalRequired: true,
      approvalLimitTier: 'manager_level',
      approvalsHistory: [],
      currentPendingApproverRole: 'Procurement Manager',
      supplierAck: {
        status: 'pending',
        originalExpectedDate: new Date(now + 6 * 86400000).toISOString().split('T')[0],
        confirmedExpectedDate: new Date(now + 6 * 86400000).toISOString().split('T')[0]
      },
      status: 'pending_approval',
      createdById: 'usr-procurement',
      createdByName: 'Sanjay Sharma',
      createdAt: new Date(now - 1 * 86400000).toISOString(),
      updatedAt: new Date(now - 1 * 86400000).toISOString(),
      notes: 'Generated from Automated MRP Engine run. Awaiting manager approval before dispatch.'
    },
    {
      id: 'po-2026-1049',
      tenantId,
      poNumber: 'PO-2026-1049',
      sourceTrigger: 'reorder_level_breach',
      triggerReference: 'Stock fell below minimum safety stock (Current: 0.8T, Min: 1.2T)',
      plantId: 'plant-pune',
      plantName: 'Pune Heavy Forge Facility',
      shipToAddress: 'Gate #1 Inward Dock, Chakan Industrial Area Phase II, Pune',
      billingAddress: 'Corporate Office, Pune Facility, Maharashtra',
      supplierId: 'sup-bharat',
      supplierName: 'Bharat Forge Specialty Tooling',
      supplierEmail: 'tooling@bharatforge.com',
      supplierPhone: '+91 99220 88711',
      supplierGstin: '27AAACB1102K1ZQ',
      supplierContactPerson: 'Mahesh Hegde',
      paymentTerms: 'Advance 20% / Balance Net 30',
      deliveryTerms: 'Ex-Works Pune',
      orderDate: new Date().toISOString(),
      expectedDeliveryDate: new Date(now + 14 * 86400000).toISOString(),
      needByDate: new Date(now + 16 * 86400000).toISOString(),
      items: [
        {
          id: 'poi-4',
          stockItemId: 'stock-7',
          stockItemCode: 'DS-H13',
          stockItemName: 'Die Steel Blocks H13 Premium',
          category: 'raw_material',
          orderedQty: 1.6,
          receivedQty: 0,
          unit: 'tonnes',
          unitPrice: 385000,
          taxRatePct: 18,
          taxAmount: Math.round(1.6 * 385000 * 0.18),
          totalAmount: Math.round(1.6 * 385000 * 1.18),
          hsnCode: '7228.30.29',
          targetStoreId: 'store-pune-rm',
          targetStoreName: 'Main Raw Materials Store',
          targetBinId: 'bin-pune-rm-03',
          targetBinCode: 'BIN-RM-A03',
          needByDate: new Date(now + 16 * 86400000).toISOString().split('T')[0]
        }
      ],
      subtotal: 1.6 * 385000,
      totalTax: Math.round(1.6 * 385000 * 0.18),
      totalAmount: Math.round(1.6 * 385000 * 1.18),
      approvalStatus: 'pending',
      approvalRequired: true,
      approvalLimitTier: 'executive_level', // > ₹5,00,000 requires executive
      approvalsHistory: [],
      currentPendingApproverRole: 'VP Operations & Finance',
      supplierAck: {
        status: 'pending',
        originalExpectedDate: new Date(now + 14 * 86400000).toISOString().split('T')[0],
        confirmedExpectedDate: new Date(now + 14 * 86400000).toISOString().split('T')[0]
      },
      status: 'pending_approval',
      createdById: 'system-auto',
      createdByName: 'Reorder Level Monitor',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: 'Auto-triggered reorder breach: PO value ₹7,26,880 routed to VP Operations for approval.'
    }
  ];
};

class PurchaseOrderService {
  private getStorageKey(tenantId: string, entity: string): string {
    return `flowops_po_${entity}_${tenantId}`;
  }

  // ── 1. Fetch All Purchase Orders ─────────────────────────────
  async getPurchaseOrders(tenantId: string): Promise<PurchaseOrder[]> {
    const key = this.getStorageKey(tenantId, 'orders');
    const cached = localStorage.getItem(key);
    if (cached) return JSON.parse(cached);

    const isSandbox = localStorage.getItem('isSandboxMode') === 'true' || !db;
    if (!isSandbox && db) {
      try {
        const colRef = collection(db, 'tenants', tenantId, 'purchaseOrders');
        const snap = await getDocs(colRef);
        if (!snap.empty) {
          const list: PurchaseOrder[] = [];
          snap.forEach(d => list.push({ id: d.id, ...d.data() } as PurchaseOrder));
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          localStorage.setItem(key, JSON.stringify(list));
          return list;
        }
      } catch (err) {
        console.warn('Firestore getPurchaseOrders fallback to seeds', err);
      }
    }

    const seeds = SEED_PURCHASE_ORDERS(tenantId);
    localStorage.setItem(key, JSON.stringify(seeds));
    return seeds;
  }

  // ── 2. Automation Rules ──────────────────────────────────────
  async getAutomationRules(tenantId: string): Promise<PoAutomationRule> {
    const key = this.getStorageKey(tenantId, 'rules');
    const cached = localStorage.getItem(key);
    if (cached) return JSON.parse(cached);
    return { ...DEFAULT_PO_AUTOMATION_RULE, tenantId };
  }

  async saveAutomationRules(tenantId: string, rule: PoAutomationRule): Promise<void> {
    const key = this.getStorageKey(tenantId, 'rules');
    localStorage.setItem(key, JSON.stringify(rule));
    window.dispatchEvent(new Event('flowops:po_updated'));
  }

  // ── 3. Scan & Generate POs for Reorder Level Breaches ────────
  async checkAndGenerateReorderPOs(
    tenantId: string,
    params: {
      plantId?: string;
      operatorId?: string;
      operatorName?: string;
    }
  ): Promise<{ generatedCount: number; newOrders: PurchaseOrder[] }> {
    const binRecords = await multiLocationInventoryService.getBinStockRecords(tenantId);
    const existingPOs = await this.getPurchaseOrders(tenantId);
    const rules = await this.getAutomationRules(tenantId);

    const targetPlantId = params.plantId || 'all';
    const newOrders: PurchaseOrder[] = [];

    // Group stock items and check if on-hand + on-order <= reorderLevel
    const stockAggregates: Record<
      string,
      {
        stockItemId: string;
        stockItemCode: string;
        stockItemName: string;
        category: any;
        unit: string;
        unitCost: number;
        plantId: string;
        plantName: string;
        storeId: string;
        storeName: string;
        binId: string;
        binCode: string;
        totalOnHand: number;
        totalOnOrder: number;
        reorderLevel: number;
      }
    > = {};

    for (const b of binRecords) {
      if (targetPlantId !== 'all' && b.plantId !== targetPlantId) continue;
      const key = `${b.stockItemId}_${b.plantId}`;
      if (!stockAggregates[key]) {
        stockAggregates[key] = {
          stockItemId: b.stockItemId,
          stockItemCode: b.stockItemCode,
          stockItemName: b.stockItemName,
          category: b.category,
          unit: b.unit,
          unitCost: b.unitCost,
          plantId: b.plantId,
          plantName: b.plantName,
          storeId: b.storeId,
          storeName: b.storeName,
          binId: b.binId,
          binCode: b.binCode,
          totalOnHand: 0,
          totalOnOrder: 0,
          reorderLevel: b.reorderLevel || 5.0
        };
      }
      stockAggregates[key].totalOnHand += b.onHandQty;
      stockAggregates[key].totalOnOrder += b.onOrderQty;
    }

    for (const agg of Object.values(stockAggregates)) {
      // Reorder breach condition: Physical On-Hand is less than or equal to reorderLevel
      const effectiveStock = agg.totalOnHand + agg.totalOnOrder;
      if (agg.totalOnHand <= agg.reorderLevel) {
        // Prevent duplicate open PO for this SKU if an active PO is already in pending/approved/issued
        const hasOpenPo = existingPOs.some(
          po =>
            ['draft', 'pending_approval', 'approved', 'issued', 'acknowledged'].includes(po.status) &&
            po.items.some(i => i.stockItemId === agg.stockItemId && po.plantId === agg.plantId)
        );

        if (hasOpenPo) continue;

        // Calculate replenishment order quantity (aim for reorderLevel * 2 or standard batch)
        const shortage = Math.max(1, (agg.reorderLevel * 2) - effectiveStock);
        const orderQty = Math.max(shortage, agg.reorderLevel * 1.5);
        const roundedQty = Number(orderQty.toFixed(1));

        const supplier = this.getSupplierForMaterial(agg.stockItemCode);
        const unitCost = agg.unitCost || 65000;
        const subtotal = Math.round(roundedQty * unitCost);
        const taxRate = 18;
        const totalTax = Math.round(subtotal * 0.18);
        const totalAmount = subtotal + totalTax;

        // Determine approval tier
        let approvalStatus: PoApprovalStatus = 'pending';
        let status: PurchaseOrderStatus = 'pending_approval';
        let approvalLimitTier: 'auto_approved' | 'manager_level' | 'executive_level' = 'manager_level';

        if (totalAmount <= rules.autoApproveUnderAmount) {
          approvalStatus = 'approved';
          status = 'approved';
          approvalLimitTier = 'auto_approved';
        } else if (totalAmount > rules.managerApprovalLimit) {
          approvalLimitTier = 'executive_level';
        }

        const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const nowMs = Date.now();
        const leadDays = supplier.leadTimeDays || 5;

        const newPo: PurchaseOrder = {
          id: `po-${nowMs}-${Math.floor(Math.random() * 1000)}`,
          tenantId,
          poNumber,
          sourceTrigger: 'reorder_level_breach',
          triggerReference: `Stock level ${agg.totalOnHand} ${agg.unit} breached reorder point of ${agg.reorderLevel} ${agg.unit}`,
          plantId: agg.plantId,
          plantName: agg.plantName,
          shipToAddress: `${agg.plantName} Receiving Dock`,
          billingAddress: `${agg.plantName} Corporate Finance`,
          supplierId: supplier.id,
          supplierName: supplier.name,
          supplierEmail: supplier.email,
          supplierPhone: supplier.phone,
          supplierGstin: supplier.gstin,
          supplierContactPerson: supplier.contact,
          paymentTerms: supplier.terms,
          deliveryTerms: 'FOR Destination (Plant Gate)',
          orderDate: new Date().toISOString(),
          expectedDeliveryDate: new Date(nowMs + leadDays * 86400000).toISOString(),
          needByDate: new Date(nowMs + (leadDays + 1) * 86400000).toISOString(),
          items: [
            {
              id: `item-${nowMs}`,
              stockItemId: agg.stockItemId,
              stockItemCode: agg.stockItemCode,
              stockItemName: agg.stockItemName,
              category: agg.category,
              orderedQty: roundedQty,
              receivedQty: 0,
              unit: agg.unit,
              unitPrice: unitCost,
              taxRatePct: taxRate,
              taxAmount: totalTax,
              totalAmount,
              hsnCode: supplier.hsnCode,
              targetStoreId: agg.storeId,
              targetStoreName: agg.storeName,
              targetBinId: agg.binId,
              targetBinCode: agg.binCode,
              needByDate: new Date(nowMs + (leadDays + 1) * 86400000).toISOString().split('T')[0]
            }
          ],
          subtotal,
          totalTax,
          totalAmount,
          approvalStatus,
          approvalRequired: approvalStatus !== 'approved',
          approvalLimitTier,
          approvalsHistory: approvalStatus === 'approved' ? [
            {
              id: `appr-${nowMs}`,
              stepName: 'System Auto-Approval (< ₹50,000 threshold)',
              approverId: 'system-auto',
              approverName: 'FlowOps Auto-Reorder Engine',
              approverRole: 'System Automation',
              action: 'approved',
              timestamp: new Date().toISOString(),
              comments: `Auto-approved: PO amount ₹${totalAmount.toLocaleString('en-IN')} is within pre-cleared limit.`
            }
          ] : [],
          currentPendingApproverRole: approvalStatus === 'approved' ? undefined : (approvalLimitTier === 'executive_level' ? 'VP Operations / Finance' : 'Procurement Manager'),
          supplierAck: {
            status: 'pending',
            originalExpectedDate: new Date(nowMs + leadDays * 86400000).toISOString().split('T')[0],
            confirmedExpectedDate: new Date(nowMs + leadDays * 86400000).toISOString().split('T')[0]
          },
          status,
          createdById: params.operatorId || 'system-auto',
          createdByName: params.operatorName || 'FlowOps Reorder Monitor',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          notes: `Auto-generated when on-hand stock hit reorder level. Replenishing ${roundedQty} ${agg.unit}.`
        };

        newOrders.push(newPo);
        existingPOs.unshift(newPo);

        // If auto-approved, register inbound order immediately to bump on-order stock
        if (approvalStatus === 'approved') {
          await this.syncApprovedPoToInbound(tenantId, newPo);
        }
      }
    }

    if (newOrders.length > 0) {
      localStorage.setItem(this.getStorageKey(tenantId, 'orders'), JSON.stringify(existingPOs));
      window.dispatchEvent(new CustomEvent('flowops:po_updated', { detail: { generatedOrders: newOrders } }));
      window.dispatchEvent(new Event('flowops:inventory_updated'));
    }

    return { generatedCount: newOrders.length, newOrders };
  }

  // ── 4. Create PO from MRP Recommendation ─────────────────────
  async createPoFromMrp(
    tenantId: string,
    rec: MrpPurchaseRecommendation,
    creatorProfile?: { uid?: string; name?: string }
  ): Promise<PurchaseOrder> {
    const existingPOs = await this.getPurchaseOrders(tenantId);
    const rules = await this.getAutomationRules(tenantId);
    const nowMs = Date.now();

    const poNumber = rec.poNumber || `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const subtotal = Math.round(rec.totalEstimatedCost);
    const taxRate = 18;
    const totalTax = Math.round(subtotal * 0.18);
    const totalAmount = subtotal + totalTax;

    let approvalStatus: PoApprovalStatus = 'pending';
    let status: PurchaseOrderStatus = 'pending_approval';
    let approvalLimitTier: 'auto_approved' | 'manager_level' | 'executive_level' = 'manager_level';

    if (totalAmount <= rules.autoApproveUnderAmount) {
      approvalStatus = 'approved';
      status = 'approved';
      approvalLimitTier = 'auto_approved';
    } else if (totalAmount > rules.managerApprovalLimit) {
      approvalLimitTier = 'executive_level';
    }

    const supplier = this.getSupplierForMaterial(rec.stockItemCode);

    const newPo: PurchaseOrder = {
      id: `po-${nowMs}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      poNumber,
      sourceTrigger: 'mrp_engine',
      triggerReference: `MRP Run #${rec.runId} • Need Date: ${rec.needByDate}`,
      plantId: rec.plantId,
      plantName: rec.plantName,
      shipToAddress: `${rec.plantName} Receiving Dock`,
      billingAddress: `${rec.plantName} Accounts Desk`,
      supplierId: rec.preferredSupplierId || supplier.id,
      supplierName: rec.preferredSupplierName || supplier.name,
      supplierEmail: supplier.email,
      supplierPhone: supplier.phone,
      supplierGstin: supplier.gstin,
      supplierContactPerson: supplier.contact,
      paymentTerms: rec.vendorPaymentTerms || supplier.terms,
      deliveryTerms: 'FOR Destination (Plant Gate)',
      orderDate: new Date().toISOString(),
      expectedDeliveryDate: rec.expectedDeliveryDate,
      needByDate: rec.needByDate,
      items: [
        {
          id: `item-${nowMs}`,
          stockItemId: rec.stockItemId,
          stockItemCode: rec.stockItemCode,
          stockItemName: rec.stockItemName,
          category: rec.category,
          orderedQty: rec.recommendedOrderQty,
          receivedQty: 0,
          unit: rec.unit,
          unitPrice: rec.unitCost,
          taxRatePct: taxRate,
          taxAmount: totalTax,
          totalAmount,
          hsnCode: supplier.hsnCode,
          needByDate: rec.needByDate
        }
      ],
      subtotal,
      totalTax,
      totalAmount,
      approvalStatus,
      approvalRequired: approvalStatus !== 'approved',
      approvalLimitTier,
      approvalsHistory: approvalStatus === 'approved' ? [
        {
          id: `appr-${nowMs}`,
          stepName: 'System Auto-Approval (< ₹50,000 threshold)',
          approverId: 'system-auto',
          approverName: 'FlowOps Auto-Approval Rule',
          approverRole: 'System Automation',
          action: 'approved',
          timestamp: new Date().toISOString(),
          comments: 'Auto-approved against MRP demand calculation.'
        }
      ] : [],
      currentPendingApproverRole: approvalStatus === 'approved' ? undefined : (approvalLimitTier === 'executive_level' ? 'VP Operations / Finance' : 'Procurement Manager'),
      supplierAck: {
        status: 'pending',
        originalExpectedDate: rec.expectedDeliveryDate,
        confirmedExpectedDate: rec.expectedDeliveryDate
      },
      status,
      createdById: creatorProfile?.uid || 'usr-procurement',
      createdByName: creatorProfile?.name || 'Procurement Manager',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: rec.notes
    };

    existingPOs.unshift(newPo);
    localStorage.setItem(this.getStorageKey(tenantId, 'orders'), JSON.stringify(existingPOs));

    if (approvalStatus === 'approved') {
      await this.syncApprovedPoToInbound(tenantId, newPo);
    }

    window.dispatchEvent(new CustomEvent('flowops:po_updated', { detail: { poCreated: newPo } }));
    return newPo;
  }

  // ── 5. Approval Workflow Actions ─────────────────────────────
  async approvePurchaseOrder(
    tenantId: string,
    poId: string,
    approverProfile: { uid?: string; name?: string; role?: string },
    comments?: string
  ): Promise<PurchaseOrder> {
    const orders = await this.getPurchaseOrders(tenantId);
    const po = orders.find(o => o.id === poId || o.poNumber === poId);
    if (!po) throw new Error('Purchase order not found.');

    const auditEntry: PoApprovalAuditEntry = {
      id: `audit-${Date.now()}`,
      stepName: `${approverProfile.role || 'Procurement Authority'} Approval`,
      approverId: approverProfile.uid || 'usr-approver',
      approverName: approverProfile.name || 'Authorized Approver',
      approverRole: approverProfile.role || 'Manager',
      action: 'approved',
      timestamp: new Date().toISOString(),
      comments: comments || 'Approved for supplier dispatch.'
    };

    po.approvalsHistory.push(auditEntry);
    po.approvalStatus = 'approved';
    po.status = 'approved';
    po.updatedAt = new Date().toISOString();

    // Sync to inbound on-order pipeline immediately
    await this.syncApprovedPoToInbound(tenantId, po);

    localStorage.setItem(this.getStorageKey(tenantId, 'orders'), JSON.stringify(orders));
    window.dispatchEvent(new CustomEvent('flowops:po_updated', { detail: { approved: po } }));
    window.dispatchEvent(new Event('flowops:inventory_updated'));

    return po;
  }

  async rejectPurchaseOrder(
    tenantId: string,
    poId: string,
    approverProfile: { uid?: string; name?: string; role?: string },
    rejectionReason: string
  ): Promise<PurchaseOrder> {
    if (!rejectionReason.trim()) throw new Error('Rejection reason is required.');
    const orders = await this.getPurchaseOrders(tenantId);
    const po = orders.find(o => o.id === poId || o.poNumber === poId);
    if (!po) throw new Error('Purchase order not found.');

    const auditEntry: PoApprovalAuditEntry = {
      id: `audit-${Date.now()}`,
      stepName: `${approverProfile.role || 'Approver'} Review`,
      approverId: approverProfile.uid || 'usr-approver',
      approverName: approverProfile.name || 'Authorized Approver',
      approverRole: approverProfile.role || 'Manager',
      action: 'rejected',
      timestamp: new Date().toISOString(),
      comments: rejectionReason
    };

    po.approvalsHistory.push(auditEntry);
    po.approvalStatus = 'rejected';
    po.status = 'rejected';
    po.notes = `${po.notes || ''} • REJECTED: ${rejectionReason}`;
    po.updatedAt = new Date().toISOString();

    localStorage.setItem(this.getStorageKey(tenantId, 'orders'), JSON.stringify(orders));
    window.dispatchEvent(new CustomEvent('flowops:po_updated', { detail: { rejected: po } }));
    return po;
  }

  // ── 6. Issue PO to Supplier ──────────────────────────────────
  async issuePoToSupplier(
    tenantId: string,
    poId: string,
    channel: 'whatsapp' | 'email' | 'both' = 'whatsapp'
  ): Promise<PurchaseOrder> {
    const orders = await this.getPurchaseOrders(tenantId);
    const po = orders.find(o => o.id === poId || o.poNumber === poId);
    if (!po) throw new Error('Purchase order not found.');
    if (po.approvalStatus !== 'approved') {
      throw new Error('PO cannot be issued to vendor until approved.');
    }

    po.status = 'issued';
    po.supplierAck.status = 'pending';
    po.updatedAt = new Date().toISOString();

    localStorage.setItem(this.getStorageKey(tenantId, 'orders'), JSON.stringify(orders));
    window.dispatchEvent(new CustomEvent('flowops:po_updated', { detail: { issued: po } }));
    return po;
  }

  // ── 7. Supplier Acknowledgment Tracking ──────────────────────
  async recordSupplierAcknowledgment(
    tenantId: string,
    poId: string,
    params: {
      status: SupplierAckStatus;
      confirmedDeliveryDate: string;
      vendorConfirmationRef?: string;
      acknowledgedByName?: string;
      notes?: string;
    }
  ): Promise<PurchaseOrder> {
    const orders = await this.getPurchaseOrders(tenantId);
    const po = orders.find(o => o.id === poId || o.poNumber === poId);
    if (!po) throw new Error('Purchase order not found.');

    po.supplierAck.status = params.status;
    po.supplierAck.acknowledgedAt = new Date().toISOString();
    po.supplierAck.acknowledgedByName = params.acknowledgedByName || po.supplierContactPerson || 'Vendor Rep';
    po.supplierAck.vendorConfirmationRef = params.vendorConfirmationRef;
    po.supplierAck.confirmedExpectedDate = params.confirmedDeliveryDate;
    po.expectedDeliveryDate = params.confirmedDeliveryDate;
    if (params.notes) po.supplierAck.notes = params.notes;

    if (params.status === 'acknowledged_on_time' || params.status === 'counter_proposed_date') {
      po.status = 'acknowledged';
    } else if (params.status === 'rejected_by_supplier') {
      po.status = 'rejected';
    }

    po.updatedAt = new Date().toISOString();

    // Update expected arrival in inbound pipeline records
    const inbounds = await multiLocationInventoryService.getInboundOrders(tenantId);
    for (const inb of inbounds) {
      if (inb.poNumber === po.poNumber) {
        inb.expectedDeliveryDate = params.confirmedDeliveryDate;
        inb.status = 'confirmed';
      }
    }
    localStorage.setItem(`flowops_ml_inbound_orders_${tenantId}`, JSON.stringify(inbounds));

    localStorage.setItem(this.getStorageKey(tenantId, 'orders'), JSON.stringify(orders));
    window.dispatchEvent(new CustomEvent('flowops:po_updated', { detail: { acknowledged: po } }));
    return po;
  }

  // ── 8. Supplier Dispatch & In-Transit Tracking ───────────────
  async recordSupplierDispatch(
    tenantId: string,
    poId: string,
    params: {
      trackingCarrier: string;
      lorryReceiptNumber: string;
      dispatchDate: string;
      expectedDeliveryDate?: string;
      notes?: string;
    }
  ): Promise<PurchaseOrder> {
    const orders = await this.getPurchaseOrders(tenantId);
    const po = orders.find(o => o.id === poId || o.poNumber === poId);
    if (!po) throw new Error('Purchase order not found.');

    po.supplierAck.trackingCarrier = params.trackingCarrier;
    po.supplierAck.lorryReceiptNumber = params.lorryReceiptNumber;
    po.supplierAck.dispatchDate = params.dispatchDate;
    if (params.expectedDeliveryDate) {
      po.expectedDeliveryDate = params.expectedDeliveryDate;
      po.supplierAck.confirmedExpectedDate = params.expectedDeliveryDate;
    }
    if (params.notes) po.supplierAck.notes = params.notes;
    po.status = 'in_transit';
    po.updatedAt = new Date().toISOString();

    // Update inbounds
    const inbounds = await multiLocationInventoryService.getInboundOrders(tenantId);
    for (const inb of inbounds) {
      if (inb.poNumber === po.poNumber) {
        inb.status = 'in_transit';
        if (params.expectedDeliveryDate) inb.expectedDeliveryDate = params.expectedDeliveryDate;
      }
    }
    localStorage.setItem(`flowops_ml_inbound_orders_${tenantId}`, JSON.stringify(inbounds));

    localStorage.setItem(this.getStorageKey(tenantId, 'orders'), JSON.stringify(orders));
    window.dispatchEvent(new CustomEvent('flowops:po_updated', { detail: { dispatched: po } }));
    return po;
  }

  // ── Helper: Sync Approved PO to Inbound Inventory Pipeline ───
  private async syncApprovedPoToInbound(tenantId: string, po: PurchaseOrder): Promise<void> {
    const inbounds = await multiLocationInventoryService.getInboundOrders(tenantId);
    const binRecords = await multiLocationInventoryService.getBinStockRecords(tenantId);

    for (const item of po.items) {
      const existingInbound = inbounds.find(
        i => i.poNumber === po.poNumber && i.stockItemId === item.stockItemId
      );

      if (!existingInbound) {
        const inb: StockInboundOrder = {
          id: `inb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          tenantId,
          stockItemId: item.stockItemId,
          stockItemCode: item.stockItemCode,
          stockItemName: item.stockItemName,
          poNumber: po.poNumber,
          supplierName: po.supplierName,
          orderedQty: item.orderedQty,
          unit: item.unit,
          unitCost: item.unitPrice,
          targetPlantId: po.plantId,
          targetPlantName: po.plantName,
          targetStoreId: item.targetStoreId || 'store-pune-rm',
          targetStoreName: item.targetStoreName || 'Main Raw Materials Store',
          targetBinId: item.targetBinId,
          targetBinCode: item.targetBinCode,
          expectedDeliveryDate: po.expectedDeliveryDate,
          createdDate: po.orderDate,
          status: 'confirmed'
        };
        inbounds.unshift(inb);
      }

      // Bump on-order quantity on bin stock records
      for (const b of binRecords) {
        if (b.stockItemId === item.stockItemId && b.plantId === po.plantId) {
          b.onOrderQty = Number((b.onOrderQty + item.orderedQty).toFixed(3));
          b.onOrderValue = b.onOrderQty * b.unitCost;
          b.updatedAt = new Date().toISOString();
        }
      }
    }

    localStorage.setItem(`flowops_ml_inbound_orders_${tenantId}`, JSON.stringify(inbounds));
    localStorage.setItem(`flowops_ml_bin_stock_${tenantId}`, JSON.stringify(binRecords));
  }

  // ── Helper: Supplier Directory ───────────────────────────────
  private getSupplierForMaterial(code: string): {
    id: string;
    name: string;
    email: string;
    phone: string;
    gstin: string;
    contact: string;
    terms: string;
    leadTimeDays: number;
    hsnCode: string;
  } {
    const c = code.toUpperCase();
    if (c.includes('WR-') || c.includes('WIRE')) {
      return {
        id: 'sup-tata',
        name: 'Tata Prime Steel Ltd.',
        email: 'orders@tataprimesteel.com',
        phone: '+91 98230 11982',
        gstin: '27AAACT2948K1ZP',
        contact: 'Rajesh Kulkarni (Zonal Sales Head)',
        terms: 'Net 30 Days • Freight Paid',
        leadTimeDays: 7,
        hsnCode: '7213.91.90'
      };
    }
    if (c.includes('RB-') || c.includes('ROUND')) {
      return {
        id: 'sup-jindal',
        name: 'Jindal Steel & Power Corp',
        email: 'sales@jindalsteel.com',
        phone: '+91 98901 44556',
        gstin: '27AAACJ8812M1Z8',
        contact: 'Prakash Rao (Regional GM)',
        terms: 'Net 45 Days • Ex-Works',
        leadTimeDays: 5,
        hsnCode: '7214.20.00'
      };
    }
    if (c.includes('DS-') || c.includes('DIE') || c.includes('H13')) {
      return {
        id: 'sup-bharat',
        name: 'Bharat Forge Specialty Tooling',
        email: 'tooling@bharatforge.com',
        phone: '+91 99220 88711',
        gstin: '27AAACB1102K1ZQ',
        contact: 'Mahesh Hegde',
        terms: 'Advance 20% / Balance Net 30',
        leadTimeDays: 14,
        hsnCode: '7228.30.29'
      };
    }
    if (c.includes('OIL') || c.includes('HYD')) {
      return {
        id: 'sup-castrol',
        name: 'Castrol Industrial Lubricants',
        email: 'orders@castrol-industrial.in',
        phone: '+91 97654 33210',
        gstin: '27AAACC4918L1Z3',
        contact: 'Vikram Joshi',
        terms: 'Net 15 Days • Drum Delivery',
        leadTimeDays: 3,
        hsnCode: '2710.19.80'
      };
    }
    if (c.includes('FAST') || c.includes('BOLT')) {
      return {
        id: 'sup-unbrako',
        name: 'Unbrako Fasteners India',
        email: 'sales@unbrakofasteners.com',
        phone: '+91 98110 55432',
        gstin: '27AAACU1902P1ZT',
        contact: 'Sunil Mehta',
        terms: 'Net 30 Days',
        leadTimeDays: 4,
        hsnCode: '7318.15.00'
      };
    }
    return {
      id: 'sup-general',
      name: 'National Industrial Supplies',
      email: 'sales@nationalindustrial.in',
      phone: '+91 98221 00998',
      gstin: '27AAACN0021A1ZB',
      contact: 'General Accounts Desk',
      terms: 'Net 30 Days',
      leadTimeDays: 5,
      hsnCode: '8483.90.00'
    };
  }
}

export const purchaseOrderService = new PurchaseOrderService();
