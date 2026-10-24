// src/types/qualityDashboard.ts

export interface QualityKpis {
  fpyPct: number;                    // e.g. 97.4%
  fpyTargetPct: number;              // e.g. 98.5%
  scrapRatePct: number;              // e.g. 1.48%
  scrapThresholdPct: number;         // e.g. 1.20%
  totalInspectedUnits: number;       // e.g. 4,820 pcs
  passedUnits: number;               // e.g. 4,695 pcs
  scrappedUnits: number;             // e.g. 71 pcs
  reworkedUnits: number;             // e.g. 54 pcs
  scrapCostValue: number;            // e.g. ₹ 84,250
  openCapaCount: number;             // e.g. 7 open CAPAs
  overdueCapaCount: number;          // e.g. 2 overdue (>30d)
  avgCapaClosureDays: number;        // e.g. 16.4 days
  activeQualityHoldsCount: number;   // e.g. 3 active holds
}

export interface FpyDayTrendPoint {
  dayLabel: string;                  // e.g. "Mon", "Tue", "14 Oct"
  date: string;
  inspected: number;
  firstPassYieldPct: number;
  scrapRatePct: number;
  reworkRatePct: number;
  fpyTargetPct: number;
}

export interface ParetoDefectItem {
  id: string;
  category: string;                  // e.g. "Dimensional Tolerance Runout"
  defectCode: string;                // e.g. "DEF-DIM-01"
  count: number;                     // e.g. 48
  frequencyPct: number;              // e.g. 38.4%
  cumulativePct: number;             // e.g. 38.4%
  financialLossInr: number;          // e.g. ₹ 42,000
  primaryMachine: string;            // e.g. "HAAS VF-4 (CNC-02)"
  primaryPart: string;               // e.g. "Camshaft Flange B-88"
  isVitalFew: boolean;               // True if within top 80% (Pareto rule)
}

export interface CapaAgingItem {
  id: string;
  capaNumber: string;                // e.g. "CAPA-2026-0018"
  title: string;
  ncrRef: string;                    // e.g. "NCR-2026-0042"
  partName: string;
  severity: 'critical' | 'major' | 'minor';
  status: 'containment' | 'root_cause' | 'action_plan' | 'verification' | 'closed';
  ownerName: string;
  ownerRole: string;
  ownerAvatar?: string;
  createdAt: string;
  targetClosureDate: string;
  agingDays: number;
  agingBracket: '<7d' | '8-15d' | '16-30d' | '>30d';
  isOverdue: boolean;
  rootCauseSummary: string;
  containmentAction: string;
  permanentAction: string;
  preventiveImpactInr: number;
}

export interface CapaAgingSummary {
  bracketUnder7: number;
  bracket8to15: number;
  bracket16to30: number;
  bracketOver30: number;
  totalOpen: number;
  totalOverdue: number;
}
