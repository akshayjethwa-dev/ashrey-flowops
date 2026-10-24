// src/services/qualityDashboardService.ts

import {
  QualityKpis,
  FpyDayTrendPoint,
  ParetoDefectItem,
  CapaAgingItem,
  CapaAgingSummary
} from '../types/qualityDashboard';

const CAPA_ESCALATION_KEY = 'flowops_quality_capa_escalations';

class QualityDashboardService {
  /**
   * Get overarching Quality KPIs
   */
  getQualityKpis(): QualityKpis {
    return {
      fpyPct: 97.4,
      fpyTargetPct: 98.5,
      scrapRatePct: 1.48,
      scrapThresholdPct: 1.20,
      totalInspectedUnits: 4820,
      passedUnits: 4695,
      scrappedUnits: 71,
      reworkedUnits: 54,
      scrapCostValue: 84250,
      openCapaCount: 7,
      overdueCapaCount: 2,
      avgCapaClosureDays: 16.4,
      activeQualityHoldsCount: 3
    };
  }

  /**
   * Get 7-Day Rolling Trend of First Pass Yield vs Scrap Rate
   */
  getFpyTrend(): FpyDayTrendPoint[] {
    return [
      {
        dayLabel: '15 Oct (Thu)',
        date: '2026-10-15',
        inspected: 680,
        firstPassYieldPct: 98.2,
        scrapRatePct: 1.05,
        reworkRatePct: 0.75,
        fpyTargetPct: 98.5
      },
      {
        dayLabel: '16 Oct (Fri)',
        date: '2026-10-16',
        inspected: 710,
        firstPassYieldPct: 98.6,
        scrapRatePct: 0.95,
        reworkRatePct: 0.45,
        fpyTargetPct: 98.5
      },
      {
        dayLabel: '17 Oct (Sat)',
        date: '2026-10-17',
        inspected: 640,
        firstPassYieldPct: 97.8,
        scrapRatePct: 1.25,
        reworkRatePct: 0.95,
        fpyTargetPct: 98.5
      },
      {
        dayLabel: '18 Oct (Sun)',
        date: '2026-10-18',
        inspected: 320,
        firstPassYieldPct: 96.9,
        scrapRatePct: 1.85,
        reworkRatePct: 1.25,
        fpyTargetPct: 98.5
      },
      {
        dayLabel: '19 Oct (Mon)',
        date: '2026-10-19',
        inspected: 790,
        firstPassYieldPct: 96.4,
        scrapRatePct: 2.15,
        reworkRatePct: 1.45,
        fpyTargetPct: 98.5
      },
      {
        dayLabel: '20 Oct (Tue)',
        date: '2026-10-20',
        inspected: 820,
        firstPassYieldPct: 97.2,
        scrapRatePct: 1.60,
        reworkRatePct: 1.20,
        fpyTargetPct: 98.5
      },
      {
        dayLabel: '21 Oct (Today)',
        date: '2026-10-21',
        inspected: 860,
        firstPassYieldPct: 97.4,
        scrapRatePct: 1.48,
        reworkRatePct: 1.12,
        fpyTargetPct: 98.5
      }
    ];
  }

  /**
   * Get Defect Pareto Records sorted by frequency with cumulative percentages
   */
  getDefectPareto(): ParetoDefectItem[] {
    const rawDefects = [
      {
        id: 'par-01',
        category: 'Dimensional Tolerance Runout',
        defectCode: 'DEF-DIM-01',
        count: 52,
        financialLossInr: 39500,
        primaryMachine: 'WC-CNC-02 (HAAS VF-4)',
        primaryPart: 'Precision Flange Hub B-40'
      },
      {
        id: 'par-02',
        category: 'Surface Porosity & Blowholes',
        defectCode: 'DEF-SURF-04',
        count: 31,
        financialLossInr: 21700,
        primaryMachine: 'WC-CAST-01 (Induction Furnace)',
        primaryPart: 'Pump Casing Grade FG-260'
      },
      {
        id: 'par-03',
        category: 'Thread Pitch Stripping / Cross-Thread',
        defectCode: 'DEF-THRD-02',
        count: 18,
        financialLossInr: 10800,
        primaryMachine: 'WC-LATH-03 (Mazak QTN-200)',
        primaryPart: 'Coupling Adapter M24x1.5'
      },
      {
        id: 'par-04',
        category: 'Burrs & Excessive Parting Line Flash',
        defectCode: 'DEF-BURR-01',
        count: 12,
        financialLossInr: 4800,
        primaryMachine: 'WC-CUT-01 (Laser 4kW)',
        primaryPart: 'Chassis Mounting Gusset'
      },
      {
        id: 'par-05',
        category: 'Hardness Deviation (< 56 HRC)',
        defectCode: 'DEF-HT-03',
        count: 7,
        financialLossInr: 5250,
        primaryMachine: 'WC-HT-01 (Quench Pit)',
        primaryPart: 'Output Pinion Shaft EN-353'
      },
      {
        id: 'par-06',
        category: 'Surface Chatter Marks (Ra > 0.8µm)',
        defectCode: 'DEF-SURF-08',
        count: 5,
        financialLossInr: 2200,
        primaryMachine: 'WC-GRND-01 (Studer S33)',
        primaryPart: 'Bearing Bushing Hardened'
      }
    ];

    const totalDefectCount = rawDefects.reduce((acc, item) => acc + item.count, 0);
    let runningCumulative = 0;

    return rawDefects.map(item => {
      const freqPct = Number(((item.count / totalDefectCount) * 100).toFixed(1));
      runningCumulative += freqPct;
      const cumulativePct = Math.min(100, Number(runningCumulative.toFixed(1)));
      return {
        ...item,
        frequencyPct: freqPct,
        cumulativePct,
        isVitalFew: cumulativePct <= 85.0
      };
    });
  }

  /**
   * Get Active CAPA Records categorized into Aging Brackets
   */
  getCapaAgingList(): CapaAgingItem[] {
    return [
      {
        id: 'capa-001',
        capaNumber: 'CAPA-2026-0018',
        title: 'CNC HAAS-04 Tool Holder Thermal Drift Over-tolerance',
        ncrRef: 'NCR-2026-0042',
        partName: 'Camshaft Flange B-88',
        severity: 'critical',
        status: 'root_cause',
        ownerName: 'Vikas Sharma',
        ownerRole: 'Sr. Quality Engineer',
        createdAt: '2026-09-18T10:00:00Z',
        targetClosureDate: '2026-10-10T18:00:00Z',
        agingDays: 33,
        agingBracket: '>30d',
        isOverdue: true,
        rootCauseSummary: 'Thermal expansion of spindle cartridge after 4 continuous operating hours causes +0.028mm tool tip deviation. Spindle chiller fluid flow was 40% clogged.',
        containmentAction: '100% CMM measurement after shift break; added 10-minute idle spindle warm-up routine.',
        permanentAction: 'Flush and replace chiller heat exchanger; implement automatic spindle temperature compensation macro in G-code.',
        preventiveImpactInr: 145000
      },
      {
        id: 'capa-002',
        capaNumber: 'CAPA-2026-0019',
        title: 'Cast Iron Porosity Clusters in Heavy Valve Body',
        ncrRef: 'NCR-2026-0045',
        partName: 'Cast Iron FG-260 Valve Body',
        severity: 'critical',
        status: 'action_plan',
        ownerName: 'Sunil Rao',
        ownerRole: 'Foundry Metallurgist',
        createdAt: '2026-09-20T08:30:00Z',
        targetClosureDate: '2026-10-15T18:00:00Z',
        agingDays: 31,
        agingBracket: '>30d',
        isOverdue: true,
        rootCauseSummary: 'Inadequate degassing of melt before pouring in secondary ladle. Inoculant addition timing exceeded 8 minutes from tap.',
        containmentAction: 'Radiographic X-ray testing made mandatory for 100% of Lot 44 batches prior to machining dispatch.',
        permanentAction: 'Install automated ladle rotary argon degassing lance and auto-pyrometer interlock.',
        preventiveImpactInr: 220000
      },
      {
        id: 'capa-003',
        capaNumber: 'CAPA-2026-0021',
        title: 'M24 Internal Thread Gauging No-Go Pass on Lathe-03',
        ncrRef: 'NCR-2026-0051',
        partName: 'Flange Coupling Ring',
        severity: 'major',
        status: 'action_plan',
        ownerName: 'Anita Deshmukh',
        ownerRole: 'Machining QC Lead',
        createdAt: '2026-10-02T11:15:00Z',
        targetClosureDate: '2026-10-25T18:00:00Z',
        agingDays: 19,
        agingBracket: '16-30d',
        isOverdue: false,
        rootCauseSummary: 'Thread tap holder collet experienced angular micro-slip under high feed torque, widening pitch diameter by 0.04mm.',
        containmentAction: 'Replaced tap collet with hydraulic lock holder; calibrated thread plug gauge #G-104.',
        permanentAction: 'Mandate periodic torque check on tapping heads at the start of each operator shift handover.',
        preventiveImpactInr: 68000
      },
      {
        id: 'capa-004',
        capaNumber: 'CAPA-2026-0022',
        title: 'Laser Cutting Dross & Burr Formation on 6mm SS-304 Plates',
        ncrRef: 'NCR-2026-0056',
        partName: 'Mounting Bracket Gusset',
        severity: 'major',
        status: 'root_cause',
        ownerName: 'Prakash Nair',
        ownerRole: 'Fabrication Lead',
        createdAt: '2026-10-08T14:00:00Z',
        targetClosureDate: '2026-10-28T18:00:00Z',
        agingDays: 13,
        agingBracket: '8-15d',
        isOverdue: false,
        rootCauseSummary: 'Assist nitrogen gas purity dropped to 98.2% from bulk cryogenic tank vapor leak, inducing micro-oxidation and sluggish dross blow-off.',
        containmentAction: 'Switched cutting gas to secondary high-purity cylinder bank (99.999% N2).',
        permanentAction: 'Install online gas purity monitor with low-purity interlock alarm.',
        preventiveImpactInr: 54000
      },
      {
        id: 'capa-005',
        capaNumber: 'CAPA-2026-0023',
        title: 'Quenching Distortion on Long Drive Shafts (>450mm)',
        ncrRef: 'NCR-2026-0059',
        partName: 'Splined Drive Shaft 485mm',
        severity: 'major',
        status: 'root_cause',
        ownerName: 'Vikas Sharma',
        ownerRole: 'Sr. Quality Engineer',
        createdAt: '2026-10-11T09:40:00Z',
        targetClosureDate: '2026-10-31T18:00:00Z',
        agingDays: 10,
        agingBracket: '8-15d',
        isOverdue: false,
        rootCauseSummary: 'Horizontal quenching into agitated oil bath produced uneven cooling gradient across bottom vs top circumference.',
        containmentAction: '100% dial-indicator runout inspection; cold-straightening hydraulic press utilized.',
        permanentAction: 'Fabricate vertical hanging quench fixture for vertical submersion into oil tank.',
        preventiveImpactInr: 92000
      },
      {
        id: 'capa-006',
        capaNumber: 'CAPA-2026-0024',
        title: 'Missing Chamfer on Lubrication Oil Transfer Port',
        ncrRef: 'NCR-2026-0062',
        partName: 'Gearbox Housing Base',
        severity: 'minor',
        status: 'containment',
        ownerName: 'Anita Deshmukh',
        ownerRole: 'Machining QC Lead',
        createdAt: '2026-10-17T16:20:00Z',
        targetClosureDate: '2026-11-05T18:00:00Z',
        agingDays: 4,
        agingBracket: '<7d',
        isOverdue: false,
        rootCauseSummary: 'Tool wear on 90-degree spot drill broke carbide tip during unattended night shift cycle; lack of automated tool breakage sensor.',
        containmentAction: 'Deburred and chamfered 18 units manually using pneumatic micro-grinder. Verified with contour gauge.',
        permanentAction: 'Program optical tool breakage laser scan after tool #06 completion.',
        preventiveImpactInr: 18000
      },
      {
        id: 'capa-007',
        capaNumber: 'CAPA-2026-0025',
        title: 'VCI Poly-wrap Packaging Tears during Forklift Staging',
        ncrRef: 'NCR-2026-0064',
        partName: 'Machined Rotor Core Assemblies',
        severity: 'minor',
        status: 'containment',
        ownerName: 'Ramesh Patil',
        ownerRole: 'Dispatch & Store QC',
        createdAt: '2026-10-19T11:00:00Z',
        targetClosureDate: '2026-11-08T18:00:00Z',
        agingDays: 2,
        agingBracket: '<7d',
        isOverdue: false,
        rootCauseSummary: 'Sharp wooden pallet corner nails protruding through thin 50-micron poly-wrap.',
        containmentAction: 'Re-wrapped 3 palletized crates with double 120-micron heavy-duty film; silica gel bags inserted.',
        permanentAction: 'Issue incoming pallet quality standard inspection SOP; require plastic corner guards.',
        preventiveImpactInr: 12000
      }
    ];
  }

  /**
   * Get CAPA Aging Summary Metrics by Bracket
   */
  getCapaAgingSummary(): CapaAgingSummary {
    const list = this.getCapaAgingList();
    return {
      bracketUnder7: list.filter(c => c.agingBracket === '<7d').length,
      bracket8to15: list.filter(c => c.agingBracket === '8-15d').length,
      bracket16to30: list.filter(c => c.agingBracket === '16-30d').length,
      bracketOver30: list.filter(c => c.agingBracket === '>30d').length,
      totalOpen: list.length,
      totalOverdue: list.filter(c => c.isOverdue).length
    };
  }

  /**
   * Trigger WhatsApp Escalation Broadcast for Overdue CAPAs
   */
  triggerCapaEscalation(capaId: string, recipientRole: string): { success: boolean; message: string; timestamp: string } {
    const capa = this.getCapaAgingList().find(c => c.id === capaId);
    const timestamp = new Date().toISOString();
    
    // Save to local storage for audit
    const saved = localStorage.getItem(CAPA_ESCALATION_KEY);
    const escalations = saved ? JSON.parse(saved) : [];
    escalations.push({
      capaId,
      capaNumber: capa?.capaNumber,
      recipientRole,
      timestamp
    });
    localStorage.setItem(CAPA_ESCALATION_KEY, JSON.stringify(escalations));

    return {
      success: true,
      message: `WhatsApp Escalation dispatched for ${capa?.capaNumber || 'CAPA'} to ${recipientRole} (+91 98201 44820). Target action required within 24h.`,
      timestamp
    };
  }
}

export const qualityDashboardService = new QualityDashboardService();
