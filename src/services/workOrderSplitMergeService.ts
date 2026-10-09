// src/services/workOrderSplitMergeService.ts

import { db } from '../firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import {
  WorkOrder,
  WorkOrderOperation,
  ExplodedBomItem,
  SplitExecutionParams,
  MergeExecutionParams,
  WorkOrderGenealogyEvent,
  SplitChildDraft,
  ChildMaterialAllocation
} from '../types/workOrder';

export interface SplitValidationResult {
  valid: boolean;
  errors: string[];
  totalChildQuantity: number;
  parentAvailableQuantity: number;
  allocations: {
    childOrderNumber: string;
    quantity: number;
    bomItems: ExplodedBomItem[];
  }[];
}

export interface MergeValidationResult {
  valid: boolean;
  errors: string[];
  combinedQuantity: number;
  partName: string;
  partCode?: string;
  sourceOrders: WorkOrder[];
  consolidatedBom: ExplodedBomItem[];
  estimatedSetupSavingsMinutes: number;
}

export interface GenealogyNode {
  id: string;
  orderNumber: string;
  partName: string;
  quantity: number;
  status: string;
  relation: 'target' | 'parent' | 'child' | 'sibling' | 'merged_source' | 'merged_result';
  dueDate: string;
  splitReason?: string;
  mergedReason?: string;
}

class WorkOrderSplitMergeService {
  /**
   * Calculate proportional raw material requirements for a split child
   */
  public calculateChildMaterialAllocations(
    parentBom: ExplodedBomItem[] = [],
    parentTotalQty: number,
    childQty: number
  ): ExplodedBomItem[] {
    if (!parentBom || parentBom.length === 0) return [];

    const ratio = parentTotalQty > 0 ? childQty / parentTotalQty : 1;

    return parentBom.map((item, idx) => {
      // Calculate required quantity based on per unit quantity
      const requiredQty = item.quantityPerUnit
        ? parseFloat((item.quantityPerUnit * childQty).toFixed(2))
        : Math.ceil(item.totalRequiredQuantity * ratio);

      const available = item.stockAvailable ?? 0;
      let allocatedStatus: 'allocated' | 'partial' | 'shortage' | 'purchase_needed' = 'allocated';

      if (available <= 0) {
        allocatedStatus = 'shortage';
      } else if (available < requiredQty) {
        allocatedStatus = 'partial';
      } else {
        allocatedStatus = 'allocated';
      }

      return {
        ...item,
        id: `bom_child_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        totalRequiredQuantity: requiredQty,
        allocatedStatus
      };
    });
  }

  /**
   * Pre-validation for splitting a work order
   */
  public validateSplit(
    parent: WorkOrder,
    splits: SplitChildDraft[]
  ): SplitValidationResult {
    const errors: string[] = [];

    if (!parent) {
      return { valid: false, errors: ['Parent work order not found'], totalChildQuantity: 0, parentAvailableQuantity: 0, allocations: [] };
    }

    if (parent.status === 'completed' || parent.status === 'cancelled') {
      errors.push(`Cannot split work order in '${parent.status}' status`);
    }

    if (parent.isSplitParent) {
      errors.push(`Work order has already been split into child orders (${parent.childOrderNumbers?.join(', ') || ''})`);
    }

    if (!splits || splits.length < 2) {
      errors.push('Must split into at least 2 child work orders');
    }

    const completed = parent.quantityCompleted || 0;
    const parentAvailable = Math.max(0, parent.quantity - completed);

    let totalChildQuantity = 0;
    const usedOrderNumbers = new Set<string>();

    splits.forEach((s, i) => {
      if (!s.childOrderNumber || s.childOrderNumber.trim() === '') {
        errors.push(`Child #${i + 1} must have an order number`);
      } else {
        const normalized = s.childOrderNumber.trim().toUpperCase();
        if (usedOrderNumbers.has(normalized)) {
          errors.push(`Duplicate child order number: ${s.childOrderNumber}`);
        }
        usedOrderNumbers.add(normalized);
      }

      if (!s.quantity || s.quantity <= 0) {
        errors.push(`Child #${i + 1} quantity must be greater than zero`);
      } else {
        totalChildQuantity += Number(s.quantity);
      }
    });

    if (totalChildQuantity > parentAvailable && parentAvailable > 0) {
      errors.push(
        `Total child quantity (${totalChildQuantity}) exceeds available parent quantity (${parentAvailable})`
      );
    }

    // Material allocations preview
    const allocations = splits.map(s => ({
      childOrderNumber: s.childOrderNumber,
      quantity: s.quantity,
      bomItems: this.calculateChildMaterialAllocations(parent.bomItems, parent.quantity, s.quantity)
    }));

    return {
      valid: errors.length === 0,
      errors,
      totalChildQuantity,
      parentAvailableQuantity: parentAvailable,
      allocations
    };
  }

  /**
   * Execute splitting of a work order
   */
  public async executeSplit(
    params: SplitExecutionParams,
    tenantId: string,
    isSandbox: boolean = false
  ): Promise<{ parent: WorkOrder; children: WorkOrder[] }> {
    const timestamp = new Date().toISOString();
    const cacheKey = `flowops_work_orders_${tenantId}`;

    // Load work orders list
    let allOrders: WorkOrder[] = [];
    if (isSandbox || !db) {
      const cached = localStorage.getItem(cacheKey);
      allOrders = cached ? JSON.parse(cached) : [];
    } else {
      const snap = await getDocs(collection(db, 'tenants', tenantId, 'workOrders'));
      allOrders = snap.docs.map(d => ({ id: d.id, ...d.data() } as WorkOrder));
    }

    const parentIdx = allOrders.findIndex(w => w.id === params.parentWorkOrderId);
    if (parentIdx === -1) {
      throw new Error(`Parent work order ${params.parentWorkOrderId} not found`);
    }

    const parent = allOrders[parentIdx];
    const validation = this.validateSplit(parent, params.splits);
    if (!validation.valid) {
      throw new Error(`Split validation failed: ${validation.errors.join('; ')}`);
    }

    const childIds: string[] = [];
    const childOrderNumbers: string[] = [];
    const generatedChildren: WorkOrder[] = [];

    // Create child orders
    params.splits.forEach((draft, idx) => {
      const childId = `wo_split_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
      const ratio = parent.quantity > 0 ? draft.quantity / parent.quantity : 1 / params.splits.length;

      // Proportional BOM materials allocation
      const childBom = this.calculateChildMaterialAllocations(parent.bomItems, parent.quantity, draft.quantity);

      // Scaled operations
      const childOperations: WorkOrderOperation[] = (parent.operations || []).map((op, opIdx) => {
        const scaledStdTime = op.standardTimeMinutes 
          ? Math.max(1, Math.round(op.standardTimeMinutes * ratio))
          : undefined;

        // If specific target machine provided for first op
        const targetWcName = (opIdx === 0 && draft.targetMachineName) 
          ? draft.targetMachineName 
          : op.workCenterName;
        const targetWcId = (opIdx === 0 && draft.targetMachineId) 
          ? draft.targetMachineId 
          : op.workCenterId;

        return {
          ...op,
          id: `op_split_${childId}_${opIdx + 1}`,
          status: 'ready',
          workCenterId: targetWcId,
          workCenterName: targetWcName,
          standardTimeMinutes: scaledStdTime,
          actualTimeMinutes: undefined,
          startedAt: undefined,
          completedAt: undefined,
          notes: draft.targetShiftName ? `Target Shift: ${draft.targetShiftName}` : op.notes
        };
      });

      const childGenealogyEvent: WorkOrderGenealogyEvent = {
        id: `gen_${Date.now()}_${idx}`,
        type: 'split',
        timestamp,
        userId: params.userId,
        userName: params.userName || 'Shop Supervisor',
        description: `Spawned as split batch from parent ${parent.orderNumber} (Qty: ${draft.quantity})`,
        relatedWorkOrderIds: [parent.id],
        relatedOrderNumbers: [parent.orderNumber],
        quantityBefore: parent.quantity,
        quantityAfter: draft.quantity,
        details: {
          splitReason: params.splitReason,
          targetMachine: draft.targetMachineName,
          targetShift: draft.targetShiftName
        }
      };

      const childOrder: WorkOrder = {
        id: childId,
        tenantId,
        plantId: parent.plantId,
        orderNumber: draft.childOrderNumber.trim(),
        salesOrderId: parent.salesOrderId,
        salesOrderNumber: parent.salesOrderNumber,
        salesOrderItemId: parent.salesOrderItemId,
        quoteNumber: parent.quoteNumber,
        customerPoNumber: parent.customerPoNumber,
        customerName: parent.customerName,
        partName: parent.partName,
        partCode: parent.partCode,
        quantity: draft.quantity,
        quantityCompleted: 0,
        quantityScrapped: 0,
        dueDate: draft.dueDate || parent.dueDate,
        priority: draft.priority || parent.priority,
        status: 'ready',
        operations: childOperations,
        bomItems: childBom,
        autoExploded: true,
        assignedOperatorIds: draft.assignedOperatorIds || parent.assignedOperatorIds,
        assignedOperatorNames: draft.assignedOperatorNames || parent.assignedOperatorNames,
        notes: draft.notes || `Split child from ${parent.orderNumber}. Reason: ${params.splitReason}`,
        // Parent-child tracking
        parentWorkOrderId: parent.id,
        parentOrderNumber: parent.orderNumber,
        isChild: true,
        splitRatio: parseFloat(ratio.toFixed(4)),
        splitFromQuantity: parent.quantity,
        splitReason: params.splitReason,
        splitAt: timestamp,
        splitByUserId: params.userId,
        splitByName: params.userName || 'Shop Supervisor',
        genealogyHistory: [childGenealogyEvent],
        createdAt: timestamp,
        updatedAt: timestamp,
        updatedBy: params.userId,
        updatedByName: params.userName
      };

      childIds.push(childId);
      childOrderNumbers.push(childOrder.orderNumber);
      generatedChildren.push(childOrder);
    });

    // Update parent work order
    const parentGenealogyEvent: WorkOrderGenealogyEvent = {
      id: `gen_p_${Date.now()}`,
      type: 'split',
      timestamp,
      userId: params.userId,
      userName: params.userName || 'Shop Supervisor',
      description: `Split into ${childOrderNumbers.length} child orders: ${childOrderNumbers.join(', ')}`,
      relatedWorkOrderIds: childIds,
      relatedOrderNumbers: childOrderNumbers,
      quantityBefore: parent.quantity,
      quantityAfter: 0,
      details: {
        splitReason: params.splitReason,
        children: childOrderNumbers
      }
    };

    const updatedParent: WorkOrder = {
      ...parent,
      status: params.archiveParent !== false ? 'split' : parent.status,
      isSplitParent: true,
      childWorkOrderIds: childIds,
      childOrderNumbers: childOrderNumbers,
      splitReason: params.splitReason,
      splitAt: timestamp,
      splitByUserId: params.userId,
      splitByName: params.userName,
      genealogyHistory: [...(parent.genealogyHistory || []), parentGenealogyEvent],
      updatedAt: timestamp,
      updatedBy: params.userId,
      updatedByName: params.userName
    };

    // Persistence
    if (isSandbox || !db) {
      allOrders[parentIdx] = updatedParent;
      const mergedList = [...allOrders, ...generatedChildren];
      localStorage.setItem(cacheKey, JSON.stringify(mergedList));
    } else {
      // Production Firestore
      const batch = writeBatch(db);
      // Update parent
      batch.update(doc(db, 'tenants', tenantId, 'workOrders', parent.id), {
        status: updatedParent.status,
        isSplitParent: true,
        childWorkOrderIds: childIds,
        childOrderNumbers: childOrderNumbers,
        splitReason: params.splitReason,
        splitAt: timestamp,
        splitByUserId: params.userId || null,
        splitByName: params.userName || null,
        genealogyHistory: updatedParent.genealogyHistory,
        updatedAt: serverTimestamp()
      });

      // Insert children
      generatedChildren.forEach(child => {
        batch.set(doc(db, 'tenants', tenantId, 'workOrders', child.id), child);
      });

      await batch.commit();
    }

    // Emit event so all hooks/views refresh
    window.dispatchEvent(new CustomEvent('flowops:workorders_updated'));

    return { parent: updatedParent, children: generatedChildren };
  }

  /**
   * Pre-validation for merging work orders
   */
  public validateMerge(sourceOrders: WorkOrder[]): MergeValidationResult {
    const errors: string[] = [];

    if (!sourceOrders || sourceOrders.length < 2) {
      return {
        valid: false,
        errors: ['Select at least 2 work orders to merge'],
        combinedQuantity: 0,
        partName: '',
        sourceOrders: [],
        consolidatedBom: [],
        estimatedSetupSavingsMinutes: 0
      };
    }

    // Check status
    const ineligible = sourceOrders.filter(w => w.status === 'completed' || w.status === 'cancelled' || w.status === 'merged');
    if (ineligible.length > 0) {
      errors.push(`Orders ${ineligible.map(o => o.orderNumber).join(', ')} cannot be merged (ineligible status)`);
    }

    // Check same part
    const firstPart = sourceOrders[0].partName;
    const firstPartCode = sourceOrders[0].partCode;
    const mismatchedParts = sourceOrders.filter(
      w => w.partName !== firstPart && (firstPartCode ? w.partCode !== firstPartCode : true)
    );
    if (mismatchedParts.length > 0) {
      errors.push(
        `Orders must be for the identical part. Found mismatch: '${firstPart}' vs '${mismatchedParts[0].partName}'`
      );
    }

    const combinedQuantity = sourceOrders.reduce((sum, o) => sum + (o.quantity || 0), 0);

    // Consolidate BOM materials
    const bomMap = new Map<string, ExplodedBomItem>();
    sourceOrders.forEach(wo => {
      (wo.bomItems || []).forEach(b => {
        const key = b.partNumber;
        if (bomMap.has(key)) {
          const existing = bomMap.get(key)!;
          existing.totalRequiredQuantity += b.totalRequiredQuantity;
        } else {
          bomMap.set(key, { ...b });
        }
      });
    });

    const consolidatedBom = Array.from(bomMap.values()).map(item => {
      const avail = item.stockAvailable ?? 0;
      let allocatedStatus: 'allocated' | 'partial' | 'shortage' | 'purchase_needed' = 'allocated';
      if (avail <= 0) allocatedStatus = 'shortage';
      else if (avail < item.totalRequiredQuantity) allocatedStatus = 'partial';
      return { ...item, allocatedStatus };
    });

    // Estimate setup savings (1 setup per machine instead of N setups)
    const setupSavingsPerOrder = 30; // approx 30 minutes saved per merged redundant order
    const estimatedSetupSavingsMinutes = (sourceOrders.length - 1) * setupSavingsPerOrder;

    return {
      valid: errors.length === 0,
      errors,
      combinedQuantity,
      partName: firstPart,
      partCode: firstPartCode,
      sourceOrders,
      consolidatedBom,
      estimatedSetupSavingsMinutes
    };
  }

  /**
   * Execute merging multiple work orders into a unified production run
   */
  public async executeMerge(
    params: MergeExecutionParams,
    tenantId: string,
    isSandbox: boolean = false
  ): Promise<{ mergedWorkOrder: WorkOrder; sourceOrders: WorkOrder[] }> {
    const timestamp = new Date().toISOString();
    const cacheKey = `flowops_work_orders_${tenantId}`;

    let allOrders: WorkOrder[] = [];
    if (isSandbox || !db) {
      const cached = localStorage.getItem(cacheKey);
      allOrders = cached ? JSON.parse(cached) : [];
    } else {
      const snap = await getDocs(collection(db, 'tenants', tenantId, 'workOrders'));
      allOrders = snap.docs.map(d => ({ id: d.id, ...d.data() } as WorkOrder));
    }

    const sourceOrders = allOrders.filter(w => params.sourceWorkOrderIds.includes(w.id));
    const validation = this.validateMerge(sourceOrders);
    if (!validation.valid) {
      throw new Error(`Merge validation failed: ${validation.errors.join('; ')}`);
    }

    const sourceOrderNumbers = sourceOrders.map(o => o.orderNumber);
    const combinedQuantity = params.mergedQuantity || validation.combinedQuantity;
    const baseOrder = sourceOrders[0];

    // Generate merged order number
    const targetOrderNumber = params.targetOrderNumber?.trim() || `${baseOrder.orderNumber}-M`;
    const mergedId = `wo_merge_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Consolidate operations with adjusted standard times for combined run
    const consolidatedOperations: WorkOrderOperation[] = (baseOrder.operations || []).map((op, idx) => {
      const baseStdTime = op.standardTimeMinutes || 60;
      // Setup time is fixed + run time scales with quantity
      const setupPart = 30;
      const runPart = Math.max(10, baseStdTime - setupPart);
      const ratio = baseOrder.quantity > 0 ? combinedQuantity / baseOrder.quantity : 1;
      const combinedStdTime = Math.round(setupPart + runPart * ratio);

      return {
        ...op,
        id: `op_merged_${mergedId}_${idx + 1}`,
        status: 'ready',
        standardTimeMinutes: combinedStdTime,
        actualTimeMinutes: undefined,
        startedAt: undefined,
        completedAt: undefined,
        notes: `Consolidated run of ${sourceOrderNumbers.join(', ')}`
      };
    });

    const genealogyEvent: WorkOrderGenealogyEvent = {
      id: `gen_m_${Date.now()}`,
      type: 'merged',
      timestamp,
      userId: params.userId,
      userName: params.userName || 'Shop Supervisor',
      description: `Created from merging ${sourceOrderNumbers.length} orders: ${sourceOrderNumbers.join(', ')} (Combined Qty: ${combinedQuantity})`,
      relatedWorkOrderIds: sourceOrders.map(o => o.id),
      relatedOrderNumbers: sourceOrderNumbers,
      quantityBefore: 0,
      quantityAfter: combinedQuantity,
      details: {
        mergedReason: params.mergedReason,
        sources: sourceOrderNumbers
      }
    };

    // Construct merged work order
    const mergedWorkOrder: WorkOrder = {
      id: mergedId,
      tenantId,
      plantId: baseOrder.plantId,
      orderNumber: targetOrderNumber,
      salesOrderId: sourceOrders.map(o => o.salesOrderNumber).join(', '),
      salesOrderNumber: sourceOrders.map(o => o.salesOrderNumber).join(', '),
      customerPoNumber: sourceOrders.map(o => o.customerPoNumber).filter(Boolean).join(', '),
      customerName: sourceOrders.length === 1 ? baseOrder.customerName : 'Multiple / Consolidated Run',
      partName: baseOrder.partName,
      partCode: baseOrder.partCode,
      quantity: combinedQuantity,
      quantityCompleted: 0,
      quantityScrapped: 0,
      dueDate: params.dueDate || baseOrder.dueDate,
      priority: params.priority || 'high',
      status: 'ready',
      operations: consolidatedOperations,
      bomItems: validation.consolidatedBom,
      autoExploded: true,
      notes: params.notes || `Merged from ${sourceOrderNumbers.join(', ')}. Reason: ${params.mergedReason}`,
      // Tracking
      isMerged: true,
      mergedFromWorkOrderIds: sourceOrders.map(o => o.id),
      mergedFromOrderNumbers: sourceOrderNumbers,
      mergedAt: timestamp,
      mergedReason: params.mergedReason,
      mergedByUserId: params.userId,
      mergedByName: params.userName || 'Shop Supervisor',
      genealogyHistory: [genealogyEvent],
      createdAt: timestamp,
      updatedAt: timestamp,
      updatedBy: params.userId,
      updatedByName: params.userName
    };

    // Update source orders
    const updatedSourceOrders: WorkOrder[] = sourceOrders.map(order => {
      const sourceGenEvent: WorkOrderGenealogyEvent = {
        id: `gen_s_${Date.now()}_${order.id}`,
        type: 'merged',
        timestamp,
        userId: params.userId,
        userName: params.userName || 'Shop Supervisor',
        description: `Merged into consolidated order ${targetOrderNumber}`,
        relatedWorkOrderIds: [mergedId],
        relatedOrderNumbers: [targetOrderNumber],
        quantityBefore: order.quantity,
        quantityAfter: 0,
        details: {
          mergedInto: targetOrderNumber,
          mergedReason: params.mergedReason
        }
      };

      return {
        ...order,
        status: 'merged',
        notes: `${order.notes || ''} [Merged into ${targetOrderNumber}]`.trim(),
        genealogyHistory: [...(order.genealogyHistory || []), sourceGenEvent],
        updatedAt: timestamp,
        updatedBy: params.userId,
        updatedByName: params.userName
      };
    });

    // Persistence
    if (isSandbox || !db) {
      const updatedMap = new Map<string, WorkOrder>();
      updatedSourceOrders.forEach(o => updatedMap.set(o.id, o));

      const updatedAll = allOrders.map(o => updatedMap.get(o.id) || o);
      updatedAll.push(mergedWorkOrder);
      localStorage.setItem(cacheKey, JSON.stringify(updatedAll));
    } else {
      const batch = writeBatch(db);
      // Create merged
      batch.set(doc(db, 'tenants', tenantId, 'workOrders', mergedWorkOrder.id), mergedWorkOrder);

      // Archive sources
      updatedSourceOrders.forEach(order => {
        batch.update(doc(db, 'tenants', tenantId, 'workOrders', order.id), {
          status: 'merged',
          notes: order.notes,
          genealogyHistory: order.genealogyHistory,
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
    }

    window.dispatchEvent(new CustomEvent('flowops:workorders_updated'));

    return { mergedWorkOrder, sourceOrders: updatedSourceOrders };
  }

  /**
   * Resolve complete family tree / genealogy nodes for any given work order
   */
  public getWorkOrderGenealogy(
    targetWoId: string,
    allOrders: WorkOrder[]
  ): { target: WorkOrder | null; nodes: GenealogyNode[]; events: WorkOrderGenealogyEvent[] } {
    const target = allOrders.find(w => w.id === targetWoId) || null;
    if (!target) {
      return { target: null, nodes: [], events: [] };
    }

    const nodes: GenealogyNode[] = [];
    const events: WorkOrderGenealogyEvent[] = [...(target.genealogyHistory || [])];

    // Target node
    nodes.push({
      id: target.id,
      orderNumber: target.orderNumber,
      partName: target.partName,
      quantity: target.quantity,
      status: target.status,
      relation: 'target',
      dueDate: target.dueDate,
      splitReason: target.splitReason,
      mergedReason: target.mergedReason
    });

    // Parent if target is child
    if (target.parentWorkOrderId) {
      const parent = allOrders.find(w => w.id === target.parentWorkOrderId);
      if (parent) {
        nodes.push({
          id: parent.id,
          orderNumber: parent.orderNumber,
          partName: parent.partName,
          quantity: parent.quantity,
          status: parent.status,
          relation: 'parent',
          dueDate: parent.dueDate,
          splitReason: parent.splitReason
        });
        if (parent.genealogyHistory) {
          events.push(...parent.genealogyHistory);
        }
      }

      // Siblings (other children of same parent)
      const siblings = allOrders.filter(
        w => w.parentWorkOrderId === target.parentWorkOrderId && w.id !== target.id
      );
      siblings.forEach(sib => {
        nodes.push({
          id: sib.id,
          orderNumber: sib.orderNumber,
          partName: sib.partName,
          quantity: sib.quantity,
          status: sib.status,
          relation: 'sibling',
          dueDate: sib.dueDate
        });
      });
    }

    // Children if target is split parent
    if (target.childWorkOrderIds && target.childWorkOrderIds.length > 0) {
      const children = allOrders.filter(w => target.childWorkOrderIds?.includes(w.id));
      children.forEach(child => {
        nodes.push({
          id: child.id,
          orderNumber: child.orderNumber,
          partName: child.partName,
          quantity: child.quantity,
          status: child.status,
          relation: 'child',
          dueDate: child.dueDate,
          splitReason: target.splitReason
        });
      });
    }

    // Merged sources if target is merged order
    if (target.mergedFromWorkOrderIds && target.mergedFromWorkOrderIds.length > 0) {
      const sources = allOrders.filter(w => target.mergedFromWorkOrderIds?.includes(w.id));
      sources.forEach(src => {
        nodes.push({
          id: src.id,
          orderNumber: src.orderNumber,
          partName: src.partName,
          quantity: src.quantity,
          status: src.status,
          relation: 'merged_source',
          dueDate: src.dueDate,
          mergedReason: target.mergedReason
        });
      });
    }

    // Sort events chronologically
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return { target, nodes, events };
  }
}

export const workOrderSplitMergeService = new WorkOrderSplitMergeService();
