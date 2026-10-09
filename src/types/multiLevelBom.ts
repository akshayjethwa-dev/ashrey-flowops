// src/types/multiLevelBom.ts

export type BomItemType = 
  | 'assembly' 
  | 'sub_assembly' 
  | 'manufactured' 
  | 'raw_material' 
  | 'bought_out' 
  | 'hardware';

export type BomRevisionStatus = 
  | 'draft' 
  | 'in_review' 
  | 'approved' 
  | 'released' 
  | 'superseded' 
  | 'obsolete';

export type EcoReason = 
  | 'cost_reduction' 
  | 'quality_improvement' 
  | 'obsolescence' 
  | 'customer_request' 
  | 'design_fix'
  | 'standardization';

export type EcoSeverity = 'low' | 'medium' | 'high' | 'critical';

export type EcoStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'implemented';

export interface MultiLevelBomNode {
  id: string;
  partNumber: string;
  partName: string;
  description: string;
  level: number; // 0 = root assembly, 1 = sub-assembly, 2 = sub-tier module, 3 = component/raw material
  itemType: BomItemType;
  quantityPerParent: number;
  unit: string; // pcs, kg, m, set, ltr
  materialGrade?: string;
  scrapFactorPercent?: number; // e.g. 2% cutting / swarf allowance
  unitCost: number; // in INR
  extendedCost?: number; // quantity * unitCost (calculated)
  rolledUpCost?: number; // includes sum of child components if subassembly
  leadTimeDays?: number;
  workCenterOrSupplier?: string; // e.g. "Doosan CNC Lathe #02" or "Tata Steel"
  drawingNumber?: string;
  drawingRevision?: string;
  isSubcontracted?: boolean;
  subcontractorName?: string;
  notes?: string;
  effectiveFrom?: string; // YYYY-MM-DD
  effectiveTo?: string;   // YYYY-MM-DD or null
  children?: MultiLevelBomNode[];
}

export interface BomRevision {
  id: string;
  bomId: string;
  revision: string; // e.g. "Rev A.0", "Rev B.1"
  status: BomRevisionStatus;
  effectiveFrom: string; // YYYY-MM-DD
  effectiveTo?: string;   // YYYY-MM-DD
  changeReason?: string;
  ecoNumber?: string;
  ecoId?: string;
  rootNode: MultiLevelBomNode;
  rolledUpCost: number;
  totalComponentCount: number;
  maxLevelDepth: number;
  createdAt: string;
  createdBy: string;
  createdByName: string;
  approvedAt?: string;
  approvedBy?: string;
  approvedByName?: string;
  releaseNotes?: string;
}

export interface MultiLevelBom {
  id: string;
  tenantId: string;
  assemblyPartNumber: string;
  assemblyName: string;
  description: string;
  category: string; // e.g. "Gearboxes", "Pumps", "Fabrications", "Special Machinery"
  currentRevisionId: string;
  activeRevisionCode: string; // e.g. "Rev B.0"
  status: BomRevisionStatus;
  revisions: BomRevision[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdByName: string;
}

export interface EcoReviewer {
  userId: string;
  name: string;
  role: string; // "Engineering Manager", "Quality Head", "Production Lead", "Cost Estimator"
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  reviewedAt?: string;
}

export interface EcoImpactAnalysis {
  costDelta: number; // positive = cost increase, negative = savings
  partsAdded: number;
  partsRemoved: number;
  partsModified: number;
  scrapRiskNotes: string;
  leadTimeImpactDays?: number;
  affectedAssemblies: string[];
}

export interface EngineeringChangeOrder {
  id: string;
  tenantId: string;
  ecoNumber: string; // e.g. "ECO-2026-0012"
  title: string;
  description: string;
  reason: EcoReason;
  severity: EcoSeverity;
  bomId: string;
  assemblyPartNumber: string;
  assemblyName: string;
  currentRevision: string;
  targetRevision: string;
  proposedEffectiveDate: string;
  status: EcoStatus;
  reviewers: EcoReviewer[];
  impactSummary: EcoImpactAnalysis;
  requestedBy: string;
  requestedByName: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedByName?: string;
  rejectionReason?: string;
  implementationNotes?: string;
}

export interface WhereUsedItem {
  bomId: string;
  topAssemblyPartNumber: string;
  topAssemblyName: string;
  parentPartNumber: string;
  parentPartName: string;
  level: number;
  quantityUsed: number;
  unit: string;
  revision: string;
  revisionStatus: BomRevisionStatus;
  isDirectParent: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  isActiveNow: boolean;
}

export interface WhereUsedResult {
  searchedPartNumber: string;
  totalUsages: number;
  topAssembliesCount: number;
  usages: WhereUsedItem[];
}

export interface BomRevisionDiffItem {
  id: string;
  partNumber: string;
  partName: string;
  level: number;
  changeType: 'added' | 'removed' | 'modified' | 'unchanged';
  oldQty?: number;
  newQty?: number;
  oldCost?: number;
  newCost?: number;
  oldMaterial?: string;
  newMaterial?: string;
  notes?: string;
}

export interface BomRevisionDiff {
  oldRevision: string;
  newRevision: string;
  diffItems: BomRevisionDiffItem[];
  costDifference: number;
  componentsAddedCount: number;
  componentsRemovedCount: number;
  componentsModifiedCount: number;
}
