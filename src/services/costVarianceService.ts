// src/services/costVarianceService.ts

import { costRollupService } from './costRollupService';
import { WorkOrderCostRollup } from '../types/costRollup';
import {
  VarianceReportRow,
  VarianceThresholdSettings,
  VarianceSummaryMetrics,
  VarianceFilterOptions,
  JobProfitabilityStatus,
  VarianceSeverityLevel,
  PrimaryVarianceDriver,
  VarianceComponentDetail
} from '../types/costVariance';

const STORAGE_KEY_THRESHOLD_SETTINGS = 'flowops_cost_variance_threshold_settings';
const STORAGE_KEY_AUDIT_NOTES = 'flowops_cost_variance_audit_notes';

export const DEFAULT_THRESHOLD_SETTINGS: VarianceThresholdSettings = {
  costOverrunThresholdPct: 10,     // 10% overrun triggers alert
  materialThresholdPct: 8,
  laborThresholdPct: 10,
  overheadThresholdPct: 12,
  flagLossMakingJobs: true,
  highlightFavorableSavings: true
};

class CostVarianceService {
  // ── Threshold Settings Management ──────────────────────────────
  getThresholdSettings(): VarianceThresholdSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_THRESHOLD_SETTINGS);
      if (stored) {
        return { ...DEFAULT_THRESHOLD_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to read variance threshold settings:', e);
    }
    return DEFAULT_THRESHOLD_SETTINGS;
  }

  saveThresholdSettings(settings: VarianceThresholdSettings): void {
    localStorage.setItem(STORAGE_KEY_THRESHOLD_SETTINGS, JSON.stringify(settings));
  }

  // ── Audit Notes & Root Cause Annotations ───────────────────────
  getAuditNotes(): Record<string, { note: string; rootCause?: string; updatedAt: string }> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_AUDIT_NOTES);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to read audit notes:', e);
    }
    return {};
  }

  saveAuditNote(workOrderId: string, note: string, rootCause?: string): void {
    const current = this.getAuditNotes();
    current[workOrderId] = {
      note,
      rootCause,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY_AUDIT_NOTES, JSON.stringify(current));
  }

  // ── Build Component Detail ─────────────────────────────────────
  private buildComponentDetail(
    planned: number,
    actual: number,
    thresholdPct: number
  ): VarianceComponentDetail {
    const varianceCost = actual - planned;
    const variancePercent = planned > 0 ? (varianceCost / planned) * 100 : 0;
    const isUnfavorable = actual > planned;
    const isExceedingThreshold = Math.abs(variancePercent) > thresholdPct;

    return {
      plannedCost: Math.round(planned),
      actualCost: Math.round(actual),
      varianceCost: Math.round(varianceCost),
      variancePercent: Number(variancePercent.toFixed(1)),
      isUnfavorable,
      isExceedingThreshold
    };
  }

  // ── Transform WorkOrderCostRollup into VarianceReportRow ───────
  transformToVarianceRow(
    rollup: WorkOrderCostRollup,
    thresholds: VarianceThresholdSettings,
    auditNotes: Record<string, { note: string; rootCause?: any }>
  ): VarianceReportRow {
    const matDetail = this.buildComponentDetail(
      rollup.standardMaterialCost,
      rollup.actualMaterialCost,
      thresholds.materialThresholdPct
    );

    const laborDetail = this.buildComponentDetail(
      rollup.standardLaborCost,
      rollup.actualLaborCost,
      thresholds.laborThresholdPct
    );

    const machineDetail = this.buildComponentDetail(
      rollup.standardMachineCost,
      rollup.actualMachineCost,
      thresholds.laborThresholdPct
    );

    const overheadDetail = this.buildComponentDetail(
      rollup.standardOverheadCost,
      rollup.totalOverheadCost,
      thresholds.overheadThresholdPct
    );

    const subcontractDetail = this.buildComponentDetail(
      rollup.standardSubcontractCost,
      rollup.actualSubcontractCost,
      thresholds.materialThresholdPct
    );

    const totalPlannedCost = Math.round(rollup.standardTotalCost);
    const totalActualCost = Math.round(rollup.actualTotalCost);
    const totalVarianceCost = Math.round(totalActualCost - totalPlannedCost);
    const totalVariancePercent = totalPlannedCost > 0 
      ? Number(((totalVarianceCost / totalPlannedCost) * 100).toFixed(1))
      : 0;

    // Unit costs
    const totalUnitCostPlanned = Number((totalPlannedCost / (rollup.quantity || 1)).toFixed(2));
    const totalUnitCostActual = Number((totalActualCost / (rollup.quantity || 1)).toFixed(2));

    // Profitability
    const plannedGrossProfit = Math.round(rollup.standardGrossProfit);
    const actualGrossProfit = Math.round(rollup.actualGrossProfit);
    const profitVarianceCost = Math.round(actualGrossProfit - plannedGrossProfit);
    const plannedGrossMarginPercent = Number(rollup.standardGrossMarginPercent.toFixed(1));
    const actualGrossMarginPercent = Number(rollup.actualGrossMarginPercent.toFixed(1));
    const marginErosionPercent = Number((plannedGrossMarginPercent - actualGrossMarginPercent).toFixed(1));

    let profitabilityStatus: JobProfitabilityStatus = 'made_money';
    if (actualGrossProfit < 0) {
      profitabilityStatus = 'lost_money';
    } else if (actualGrossProfit === 0) {
      profitabilityStatus = 'breakeven';
    }

    // Severity & Threshold Alert
    const isOverrun = totalVariancePercent > 0;
    const isThresholdAlert = totalVariancePercent >= thresholds.costOverrunThresholdPct;
    let severityLevel: VarianceSeverityLevel = 'on_target';

    if (actualGrossProfit < 0) {
      severityLevel = 'critical_loss';
    } else if (isThresholdAlert) {
      severityLevel = 'alert_overrun';
    } else if (isOverrun) {
      severityLevel = 'minor_overrun';
    } else if (totalVariancePercent <= -thresholds.costOverrunThresholdPct) {
      severityLevel = 'favorable_saving';
    } else {
      severityLevel = 'on_target';
    }

    // Determine primary driver
    let primaryDriver: PrimaryVarianceDriver = 'None';
    const driverVariances = [
      { name: 'Material' as PrimaryVarianceDriver, variance: matDetail.varianceCost },
      { name: 'Labor' as PrimaryVarianceDriver, variance: laborDetail.varianceCost },
      { name: 'Machine' as PrimaryVarianceDriver, variance: machineDetail.varianceCost },
      { name: 'Overhead' as PrimaryVarianceDriver, variance: overheadDetail.varianceCost },
      { name: 'Subcontract' as PrimaryVarianceDriver, variance: subcontractDetail.varianceCost }
    ];

    // Find the positive overrun driver with highest impact
    const maxOverrun = [...driverVariances].sort((a, b) => b.variance - a.variance)[0];
    if (maxOverrun && maxOverrun.variance > 0) {
      primaryDriver = maxOverrun.name;
    } else {
      // If savings, find biggest saving
      const maxSaving = [...driverVariances].sort((a, b) => a.variance - b.variance)[0];
      if (maxSaving && maxSaving.variance < 0) {
        primaryDriver = maxSaving.name;
      }
    }

    const audit = auditNotes[rollup.workOrderId];

    return {
      workOrderId: rollup.workOrderId,
      workOrderNumber: rollup.workOrderNumber,
      salesOrderNumber: rollup.salesOrderNumber,
      quoteNumber: rollup.quoteNumber,
      customerPoNumber: rollup.customerPoNumber,
      customerName: rollup.customerName,
      partCode: rollup.partCode,
      partName: rollup.partName,
      quantity: rollup.quantity,
      orderStatus: rollup.orderStatus,
      dueDate: rollup.dueDate,
      plantName: rollup.plantName,

      contractPricePerUnit: rollup.contractPricePerUnit,
      totalRevenue: rollup.totalRevenue,

      material: matDetail,
      labor: laborDetail,
      machine: machineDetail,
      overhead: overheadDetail,
      subcontract: subcontractDetail,

      totalPlannedCost,
      totalActualCost,
      totalVarianceCost,
      totalVariancePercent,
      totalUnitCostPlanned,
      totalUnitCostActual,

      plannedGrossProfit,
      actualGrossProfit,
      profitVarianceCost,
      plannedGrossMarginPercent,
      actualGrossMarginPercent,
      marginErosionPercent,

      profitabilityStatus,
      severityLevel,
      primaryDriver,
      isThresholdAlert,
      hasMaterialOverrunAlert: matDetail.isExceedingThreshold && matDetail.isUnfavorable,
      hasLaborOverrunAlert: laborDetail.isExceedingThreshold && laborDetail.isUnfavorable,
      hasOverheadOverrunAlert: overheadDetail.isExceedingThreshold && overheadDetail.isUnfavorable,

      materialTransactions: rollup.materialItems,
      laborTransactions: rollup.laborLogs,
      machineTransactions: rollup.machineLogs,
      subcontractTransactions: rollup.subcontractItems,
      overheadConfig: rollup.overheadConfigApplied,

      accountantNotes: audit?.note,
      rootCauseCategory: audit?.rootCause
    };
  }

  // ── Get Full Variance Report ──────────────────────────────────
  getVarianceReport(
    customThresholds?: Partial<VarianceThresholdSettings>,
    filters?: Partial<VarianceFilterOptions>
  ): VarianceReportRow[] {
    const thresholds = {
      ...this.getThresholdSettings(),
      ...(customThresholds || {})
    };
    const auditNotes = this.getAuditNotes();

    // Pull real-time rolled up work orders
    const allRollups = costRollupService.getAllWorkOrderCostRollups();

    let rows = allRollups.map(r => this.transformToVarianceRow(r, thresholds, auditNotes));

    if (!filters) return rows;

    // Search query filter
    if (filters.searchQuery?.trim()) {
      const q = filters.searchQuery.toLowerCase();
      rows = rows.filter(r => 
        r.workOrderNumber.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.partName.toLowerCase().includes(q) ||
        r.partCode.toLowerCase().includes(q) ||
        (r.quoteNumber && r.quoteNumber.toLowerCase().includes(q))
      );
    }

    // Profitability filter
    if (filters.profitabilityFilter && filters.profitabilityFilter !== 'all') {
      rows = rows.filter(r => r.profitabilityStatus === filters.profitabilityFilter);
    }

    // Alert filter
    if (filters.alertFilter && filters.alertFilter !== 'all') {
      if (filters.alertFilter === 'exceeding_threshold') {
        rows = rows.filter(r => r.isThresholdAlert);
      } else if (filters.alertFilter === 'critical_loss') {
        rows = rows.filter(r => r.severityLevel === 'critical_loss');
      } else if (filters.alertFilter === 'favorable_savings') {
        rows = rows.filter(r => r.severityLevel === 'favorable_saving');
      }
    }

    // Driver filter
    if (filters.driverFilter && filters.driverFilter !== 'all') {
      rows = rows.filter(r => r.primaryDriver === filters.driverFilter);
    }

    // Sorting
    const sortBy = filters.sortBy || 'totalVarianceCost';
    const sortOrder = filters.sortOrder || 'desc';

    rows.sort((a, b) => {
      let valA = 0;
      let valB = 0;
      switch (sortBy) {
        case 'totalVarianceCost':
          valA = a.totalVarianceCost;
          valB = b.totalVarianceCost;
          break;
        case 'totalVariancePercent':
          valA = a.totalVariancePercent;
          valB = b.totalVariancePercent;
          break;
        case 'actualProfit':
          valA = a.actualGrossProfit;
          valB = b.actualGrossProfit;
          break;
        case 'revenue':
          valA = a.totalRevenue;
          valB = b.totalRevenue;
          break;
        case 'orderNumber':
          return sortOrder === 'asc' 
            ? a.workOrderNumber.localeCompare(b.workOrderNumber)
            : b.workOrderNumber.localeCompare(a.workOrderNumber);
        default:
          valA = a.totalVarianceCost;
          valB = b.totalVarianceCost;
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return rows;
  }

  // ── Summary Metrics for Cost Accountant Dashboard ────────────
  getSummaryMetrics(rows: VarianceReportRow[]): VarianceSummaryMetrics {
    const totalJobsAnalyzed = rows.length;
    let totalRevenue = 0;
    let totalPlannedCost = 0;
    let totalActualCost = 0;

    let jobsMadeMoneyCount = 0;
    let jobsLostMoneyCount = 0;
    let totalProfitFromWinners = 0;
    let totalLossFromLosers = 0;

    let alertThresholdExceededCount = 0;
    let criticalLossJobsCount = 0;

    let totalMaterialVariance = 0;
    let totalMaterialPlanned = 0;
    let totalLaborVariance = 0;
    let totalLaborPlanned = 0;
    let totalMachineVariance = 0;
    let totalMachinePlanned = 0;
    let totalOverheadVariance = 0;
    let totalOverheadPlanned = 0;

    rows.forEach(r => {
      totalRevenue += r.totalRevenue;
      totalPlannedCost += r.totalPlannedCost;
      totalActualCost += r.totalActualCost;

      if (r.actualGrossProfit >= 0) {
        jobsMadeMoneyCount++;
        totalProfitFromWinners += r.actualGrossProfit;
      } else {
        jobsLostMoneyCount++;
        totalLossFromLosers += Math.abs(r.actualGrossProfit);
      }

      if (r.isThresholdAlert) alertThresholdExceededCount++;
      if (r.severityLevel === 'critical_loss') criticalLossJobsCount++;

      totalMaterialVariance += r.material.varianceCost;
      totalMaterialPlanned += r.material.plannedCost;

      totalLaborVariance += r.labor.varianceCost;
      totalLaborPlanned += r.labor.plannedCost;

      totalMachineVariance += r.machine.varianceCost;
      totalMachinePlanned += r.machine.plannedCost;

      totalOverheadVariance += r.overhead.varianceCost;
      totalOverheadPlanned += r.overhead.plannedCost;
    });

    const netCostVariance = totalActualCost - totalPlannedCost;
    const netCostVariancePercent = totalPlannedCost > 0
      ? Number(((netCostVariance / totalPlannedCost) * 100).toFixed(1))
      : 0;

    const netRealizedProfit = totalRevenue - totalActualCost;
    const blendedActualMarginPercent = totalRevenue > 0
      ? Number(((netRealizedProfit / totalRevenue) * 100).toFixed(1))
      : 0;

    const totalPlannedProfit = totalRevenue - totalPlannedCost;
    const blendedPlannedMarginPercent = totalRevenue > 0
      ? Number(((totalPlannedProfit / totalRevenue) * 100).toFixed(1))
      : 0;

    return {
      totalJobsAnalyzed,
      totalRevenue,
      totalPlannedCost,
      totalActualCost,
      netCostVariance,
      netCostVariancePercent,
      isNetUnfavorable: netCostVariance > 0,

      jobsMadeMoneyCount,
      jobsLostMoneyCount,
      totalProfitFromWinners,
      totalLossFromLosers,
      netRealizedProfit,
      blendedActualMarginPercent,
      blendedPlannedMarginPercent,

      alertThresholdExceededCount,
      criticalLossJobsCount,

      totalMaterialVariance,
      totalMaterialVariancePct: totalMaterialPlanned > 0 ? Number(((totalMaterialVariance / totalMaterialPlanned) * 100).toFixed(1)) : 0,
      totalLaborVariance,
      totalLaborVariancePct: totalLaborPlanned > 0 ? Number(((totalLaborVariance / totalLaborPlanned) * 100).toFixed(1)) : 0,
      totalMachineVariance,
      totalMachineVariancePct: totalMachinePlanned > 0 ? Number(((totalMachineVariance / totalMachinePlanned) * 100).toFixed(1)) : 0,
      totalOverheadVariance,
      totalOverheadVariancePct: totalOverheadPlanned > 0 ? Number(((totalOverheadVariance / totalOverheadPlanned) * 100).toFixed(1)) : 0
    };
  }

  // ── Export CSV Variance Audit Ledger ───────────────────────────
  exportVarianceReportCsv(rows: VarianceReportRow[], thresholdPct: number): string {
    const headers = [
      'Work Order #',
      'Quote #',
      'Customer',
      'Part Code',
      'Part Name',
      'Quantity',
      'Revenue (INR)',
      'Planned Material (INR)',
      'Actual Material (INR)',
      'Material Variance (INR)',
      'Material Variance %',
      'Planned Labor (INR)',
      'Actual Labor (INR)',
      'Labor Variance (INR)',
      'Labor Variance %',
      'Planned Overhead (INR)',
      'Actual Overhead (INR)',
      'Overhead Variance (INR)',
      'Overhead Variance %',
      'Total Quoted Cost (INR)',
      'Total Actual Cost (INR)',
      'Net Cost Variance (INR)',
      'Net Variance %',
      'Threshold Alert (Overrun > ' + thresholdPct + '%)',
      'Profitability Status',
      'Actual Gross Profit (INR)',
      'Actual Gross Margin %',
      'Planned Margin %',
      'Primary Driver',
      'Accountant Notes'
    ];

    const lines = rows.map(r => {
      return [
        r.workOrderNumber,
        r.quoteNumber || '',
        `"${r.customerName.replace(/"/g, '""')}"`,
        r.partCode,
        `"${r.partName.replace(/"/g, '""')}"`,
        r.quantity,
        r.totalRevenue,
        r.material.plannedCost,
        r.material.actualCost,
        r.material.varianceCost,
        `${r.material.variancePercent}%`,
        r.labor.plannedCost,
        r.labor.actualCost,
        r.labor.varianceCost,
        `${r.labor.variancePercent}%`,
        r.overhead.plannedCost,
        r.overhead.actualCost,
        r.overhead.varianceCost,
        `${r.overhead.variancePercent}%`,
        r.totalPlannedCost,
        r.totalActualCost,
        r.totalVarianceCost,
        `${r.totalVariancePercent}%`,
        r.isThresholdAlert ? 'ALERT EXCEEDED' : 'Normal',
        r.profitabilityStatus === 'made_money' ? 'MADE MONEY' : 'LOST MONEY',
        r.actualGrossProfit,
        `${r.actualGrossMarginPercent}%`,
        `${r.plannedGrossMarginPercent}%`,
        r.primaryDriver,
        `"${(r.accountantNotes || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    return [headers.join(','), ...lines].join('\n');
  }
}

export const costVarianceService = new CostVarianceService();
