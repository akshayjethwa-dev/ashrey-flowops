// src/types/routing.ts

export type OperationType =
  | 'cutting'
  | 'welding'
  | 'machining'
  | 'turning'
  | 'milling'
  | 'heat_treatment'
  | 'surface_treatment'
  | 'inspection'
  | 'assembly'
  | 'packing'
  | 'subcontract';

export type SkillLevel =
  | 'helper'
  | 'semi_skilled'
  | 'skilled_operator'
  | 'senior_technician'
  | 'certified_welder'
  | 'certified_inspector'
  | 'cnc_programmer';

export interface WorkCenter {
  id: string;
  code: string; // e.g. "WC-SAW-01", "WC-WLD-02", "WC-CNC-04"
  name: string; // e.g. "Kasto Automatic Cold Saw", "ESAB Multi-Process Welding Bay #2"
  department: string; // "Cutting", "Machine Shop", "Fabrication", "Quality Lab", "Assembly & Packing"
  hourlyMachineRate: number; // in INR / hr
  hourlyLaborRate: number; // in INR / hr
  capacityHoursPerDay: number; // standard e.g. 16 or 20 hrs
  status: 'active' | 'maintenance' | 'inactive';
  plantId?: string;
  notes?: string;
}

export interface SkillRequirement {
  level: SkillLevel;
  certifications?: string[]; // e.g. ["Fanuc CNC Turning Level II", "AWS D1.1 Structural Welding"]
  minCrewSize: number; // e.g. 1 operator, 1 helper
  requiredPpe?: string[]; // e.g. ["Safety Glasses", "Cut-Resistant Gloves", "Welding Mask", "Ear Plugs"]
}

export interface OperationMasterItem {
  id: string;
  operationCode: string; // e.g. "OP-CUT-01", "OP-WLD-02", "OP-CNC-01"
  name: string; // e.g. "Cold Band Saw Cut-off & Facing"
  operationType: OperationType;
  defaultWorkCenterId: string;
  defaultWorkCenterName: string;
  defaultSetupTimeMinutes: number;
  defaultCycleTimeMinutes: number; // per piece
  skillRequirement: SkillRequirement;
  standardInstructions: string;
  qualityCheckpoints: string[];
  safetyNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoutingOperation {
  id: string;
  sequenceNumber: number; // 10, 20, 30, 40, 50, 60...
  operationMasterId?: string;
  operationCode: string; // e.g. "OP-CUT-01"
  name: string;
  operationType: OperationType;
  workCenterId: string;
  workCenterName: string;
  workCenterCode: string;
  setupTimeMinutes: number; // machine setup & calibration
  cycleTimeMinutes: number; // run time per unit
  queueTimeHours?: number; // transit / cooling / buffer time
  scrapRatePercent?: number; // expected swarf or defect rate %
  skillLevel: SkillLevel;
  certificationsRequired?: string[];
  crewSize: number;
  instructions: string; // detailed SOP instructions for operators
  toolingFixtures?: string; // e.g. "Hydraulic chuck, Sandvik CNMG 120408, Bore Gauge 50mm"
  qualityInspectionCriteria?: string; // e.g. "Check OD 75.000 +0.020/-0.000 mm, Ra 1.6 surface finish"
  safetyPpe?: string[];
  isSubcontracted?: boolean;
  subcontractorName?: string;
  estimatedCostPerUnit?: number; // calculated machine + labor cost
}

export interface ProductRouting {
  id: string;
  tenantId: string;
  routingNumber: string; // e.g. "RT-GBX-500-01", "RT-CAR-FLG-01"
  partNumber: string; // linked part or assembly e.g. "ASM-GBX-500"
  partName: string;
  description: string;
  category?: string; // "Machined Parts", "Welded Assemblies", "Gearboxes"
  revision: string; // "Rev 1.0", "Rev 2.0"
  status: 'draft' | 'active' | 'obsolete' | 'under_review';
  targetBatchSize: number; // e.g. 100 pcs
  operations: RoutingOperation[];
  totalSetupTimeMinutes: number; // sum of all operations setup
  totalCycleTimeMinutes: number; // sum of all operations cycle time
  totalStandardCostPerUnit: number;
  drawingNumber?: string;
  drawingRevision?: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
}
