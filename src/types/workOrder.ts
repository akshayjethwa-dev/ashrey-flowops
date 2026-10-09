// src/types/workOrder.ts

export type WorkOrderStatus =
  | 'draft'
  | 'pending'
  | 'ready'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'split'
  | 'merged';

export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface WorkOrderOperation {
  id: string;
  name: string;
  workCenterId?: string;
  workCenterName?: string;
  sequence: number; // 10, 20, 30...
  status: WorkOrderStatus;
  standardTimeMinutes?: number;
  actualTimeMinutes?: number;
  startedAt?: string;
  completedAt?: string;
  startedByUserId?: string;
  startedByName?: string;
  isSubcontracted?: boolean;
  subcontractorName?: string;
  subcontractRfqId?: string;
  notes?: string;
}

export type BomItemType = 'manufactured' | 'raw_material' | 'bought_out' | 'sub_assembly';

export interface ExplodedBomItem {
  id: string;
  partNumber: string;
  description: string;
  level: number; // 1 = direct component, 2 = sub-tier part
  itemType: BomItemType;
  quantityPerUnit: number;
  totalRequiredQuantity: number;
  unit: string;
  materialGrade?: string;
  stockAvailable?: number;
  allocatedStatus?: 'allocated' | 'partial' | 'shortage' | 'purchase_needed';
  leadTimeDays?: number;
  workOrderId?: string; // if a separate WO is spawned for a manufactured sub-assembly
}

export interface WorkOrder {
  id: string;
  tenantId: string;
  plantId?: string;
  orderNumber: string; // e.g. WO-2026-0001
  salesOrderId: string; // Linking SO
  salesOrderNumber: string; // e.g. SO-2026-0012
  salesOrderItemId?: string;
  quoteNumber?: string;
  customerPoNumber?: string;
  customerName: string;
  partName: string;
  partCode?: string;
  quantity: number;
  quantityCompleted?: number;
  quantityScrapped?: number;
  dueDate: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  currentOperationId?: string;
  currentOperationName?: string;
  operations: WorkOrderOperation[]; // Linking WO -> Operations
  bomItems: ExplodedBomItem[];       // Auto-BOM explosion
  autoExploded?: boolean;
  assignedOperatorIds?: string[];
  assignedOperatorNames?: string[];
  notes?: string;
  // Splitting & Merging Genealogy Tracking
  parentWorkOrderId?: string;
  parentOrderNumber?: string;
  childWorkOrderIds?: string[];
  childOrderNumbers?: string[];
  isSplitParent?: boolean;
  isChild?: boolean;
  splitRatio?: number;
  splitFromQuantity?: number;
  splitReason?: string;
  splitAt?: string;
  splitByUserId?: string;
  splitByName?: string;
  
  mergedFromWorkOrderIds?: string[];
  mergedFromOrderNumbers?: string[];
  isMerged?: boolean;
  mergedAt?: string;
  mergedReason?: string;
  mergedByUserId?: string;
  mergedByName?: string;

  genealogyHistory?: WorkOrderGenealogyEvent[];
  createdAt: any;
  updatedAt: any;
  updatedBy?: string;
  updatedByName?: string;
}

export type GenealogyEventType = 'created' | 'split' | 'merged' | 'material_reallocated';

export interface WorkOrderGenealogyEvent {
  id: string;
  type: GenealogyEventType;
  timestamp: string;
  userId?: string;
  userName?: string;
  description: string;
  relatedWorkOrderIds: string[];
  relatedOrderNumbers: string[];
  quantityBefore?: number;
  quantityAfter?: number;
  details?: Record<string, any>;
}

export interface SplitChildDraft {
  childOrderNumber: string;
  quantity: number;
  dueDate: string;
  targetMachineId?: string;
  targetMachineName?: string;
  targetShiftId?: string;
  targetShiftName?: string;
  priority?: WorkOrderPriority;
  notes?: string;
  assignedOperatorIds?: string[];
  assignedOperatorNames?: string[];
}

export interface ChildMaterialAllocation {
  bomItemId: string;
  partNumber: string;
  description: string;
  itemType: BomItemType;
  unit: string;
  quantityPerUnit: number;
  parentTotalRequired: number;
  childAllocatedQuantity: number;
  stockAvailable?: number;
  allocatedStatus: 'allocated' | 'partial' | 'shortage' | 'purchase_needed';
}

export interface SplitExecutionParams {
  parentWorkOrderId: string;
  splitReason: string;
  splits: SplitChildDraft[];
  userId?: string;
  userName?: string;
  archiveParent?: boolean;
}

export interface MergeExecutionParams {
  sourceWorkOrderIds: string[];
  targetOrderNumber?: string;
  mergedQuantity?: number;
  dueDate: string;
  priority: WorkOrderPriority;
  mergedReason: string;
  notes?: string;
  userId?: string;
  userName?: string;
}

export interface WorkOrderGenerationPlan {
  salesOrderId: string;
  salesOrderNumber: string;
  customerName: string;
  customerPoNumber?: string;
  plantId?: string;
  dueDate: string;
  priority: WorkOrderPriority;
  items: {
    salesOrderItemId: string;
    partName: string;
    partCode?: string;
    quantity: number;
    unitPrice?: number;
    selected: boolean;
    explodedBom: ExplodedBomItem[];
    routing: WorkOrderOperation[];
  }[];
}
