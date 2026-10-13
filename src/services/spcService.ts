// src/services/spcService.ts

import {
  SpcStudy,
  SubgroupSample,
  ControlLimits,
  ProcessCapabilityIndices,
  HistogramDistribution,
  HistogramBin,
  SpcOocAlert,
  SpcKpiSummary,
  WesternElectricRuleId,
  RuleViolation,
  AlertSeverity
} from '../types/spc';

const SPC_STUDIES_STORAGE_KEY = 'mes_spc_studies_v1';
const SPC_ALERTS_STORAGE_KEY = 'mes_spc_alerts_v1';

// Standard SPC Factor Constants for sample size n = 2..25
const SPC_FACTORS: Record<number, { A2: number; d2: number; D3: number; D4: number; c4: number; A3: number; B3: number; B4: number }> = {
  2:  { A2: 1.880, d2: 1.128, D3: 0.000, D4: 3.267, c4: 0.7979, A3: 2.659, B3: 0.000, B4: 3.267 },
  3:  { A2: 1.023, d2: 1.693, D3: 0.000, D4: 2.574, c4: 0.8862, A3: 1.954, B3: 0.000, B4: 2.568 },
  4:  { A2: 0.729, d2: 2.059, D3: 0.000, D4: 2.282, c4: 0.9213, A3: 1.628, B3: 0.000, B4: 2.266 },
  5:  { A2: 0.577, d2: 2.326, D3: 0.000, D4: 2.114, c4: 0.9400, A3: 1.427, B3: 0.000, B4: 2.089 },
  6:  { A2: 0.483, d2: 2.534, D3: 0.000, D4: 2.004, c4: 0.9515, A3: 1.287, B3: 0.030, B4: 1.970 },
  7:  { A2: 0.419, d2: 2.704, D3: 0.076, D4: 1.924, c4: 0.9594, A3: 1.182, B3: 0.118, B4: 1.882 },
  8:  { A2: 0.373, d2: 2.847, D3: 0.136, D4: 1.864, c4: 0.9650, A3: 1.099, B3: 0.185, B4: 1.815 },
  9:  { A2: 0.337, d2: 2.970, D3: 0.184, D4: 1.816, c4: 0.9693, A3: 1.032, B3: 0.239, B4: 1.761 },
  10: { A2: 0.308, d2: 3.078, D3: 0.223, D4: 1.777, c4: 0.9727, A3: 0.975, B3: 0.284, B4: 1.716 },
  12: { A2: 0.266, d2: 3.258, D3: 0.283, D4: 1.717, c4: 0.9776, A3: 0.886, B3: 0.354, B4: 1.646 },
  15: { A2: 0.223, d2: 3.472, D3: 0.347, D4: 1.653, c4: 0.9823, A3: 0.789, B3: 0.428, B4: 1.572 },
  20: { A2: 0.180, d2: 3.735, D3: 0.415, D4: 1.585, c4: 0.9869, A3: 0.680, B3: 0.510, B4: 1.490 },
  25: { A2: 0.153, d2: 3.931, D3: 0.459, D4: 1.541, c4: 0.9896, A3: 0.606, B3: 0.565, B4: 1.435 }
};

export const getSpcFactors = (n: number) => {
  if (SPC_FACTORS[n]) return SPC_FACTORS[n];
  if (n <= 2) return SPC_FACTORS[2];
  if (n >= 25) return SPC_FACTORS[25];
  // Fallback linear interpolation or closest
  const keys = Object.keys(SPC_FACTORS).map(Number).sort((a, b) => a - b);
  const closest = keys.reduce((prev, curr) => Math.abs(curr - n) < Math.abs(prev - n) ? curr : prev);
  return SPC_FACTORS[closest];
};

// Error function approximation for normal CDF
function erf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return sign * y;
}

// Standard normal cumulative distribution function Φ(z)
export function standardNormalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

// ==========================================
// CONTROL LIMITS COMPUTATION
// ==========================================

export function calculateControlLimits(
  study: Pick<SpcStudy, 'chartType' | 'subgroupSize' | 'subgroups' | 'usl' | 'lsl'>
): ControlLimits {
  const { chartType, subgroupSize, subgroups } = study;
  const n = Math.max(1, subgroupSize || 5);
  const factors = getSpcFactors(n);

  if (!subgroups || subgroups.length === 0) {
    // Return empty defaults
    return {
      chartType,
      subgroupSize: n,
      centerLine: 0,
      ucl: 0,
      lcl: 0,
      plus2Sigma: 0,
      plus1Sigma: 0,
      minus1Sigma: 0,
      minus2Sigma: 0,
      sigma: 0,
      secondaryCenterLine: 0,
      secondaryUcl: 0,
      secondaryLcl: 0
    };
  }

  // 1. X-bar and R Chart
  if (chartType === 'XBar_R') {
    const validSubgroups = subgroups.filter(s => s.measurements && s.measurements.length > 0);
    const k = validSubgroups.length || 1;
    const xDoubleBar = validSubgroups.reduce((acc, s) => acc + s.mean, 0) / k;
    const rBar = validSubgroups.reduce((acc, s) => acc + s.range, 0) / k;

    const uclX = xDoubleBar + factors.A2 * rBar;
    const lclX = xDoubleBar - factors.A2 * rBar;
    const sigmaX = (uclX - xDoubleBar) / 3; // 1-sigma for subgroup averages = sigma / sqrt(n)
    const sigmaEst = rBar / factors.d2;     // Estimated process sigma for individual items

    const uclR = factors.D4 * rBar;
    const lclR = factors.D3 * rBar;

    return {
      chartType,
      subgroupSize: n,
      centerLine: Number(xDoubleBar.toFixed(4)),
      ucl: Number(uclX.toFixed(4)),
      lcl: Number(lclX.toFixed(4)),
      plus2Sigma: Number((xDoubleBar + 2 * sigmaX).toFixed(4)),
      plus1Sigma: Number((xDoubleBar + 1 * sigmaX).toFixed(4)),
      minus1Sigma: Number((xDoubleBar - 1 * sigmaX).toFixed(4)),
      minus2Sigma: Number((xDoubleBar - 2 * sigmaX).toFixed(4)),
      sigma: Number(sigmaEst.toFixed(4)),
      secondaryCenterLine: Number(rBar.toFixed(4)),
      secondaryUcl: Number(uclR.toFixed(4)),
      secondaryLcl: Number(lclR.toFixed(4))
    };
  }

  // 2. Individuals and Moving Range (I-MR) Chart (n = 1)
  if (chartType === 'I_MR') {
    const k = subgroups.length;
    const iValues = subgroups.map(s => s.measurements[0] ?? s.mean);
    const xBar = iValues.reduce((a, b) => a + b, 0) / k;

    // Calculate moving ranges
    const movingRanges: number[] = [];
    for (let i = 1; i < k; i++) {
      movingRanges.push(Math.abs(iValues[i] - iValues[i - 1]));
    }
    const mrBar = movingRanges.length > 0 ? movingRanges.reduce((a, b) => a + b, 0) / movingRanges.length : 0;
    const d2_2 = 1.128; // d2 for n=2
    const sigmaEst = mrBar > 0 ? mrBar / d2_2 : 0.001;

    const uclX = xBar + 3 * sigmaEst;
    const lclX = xBar - 3 * sigmaEst;
    const uclMR = 3.267 * mrBar;
    const lclMR = 0;

    return {
      chartType,
      subgroupSize: 1,
      centerLine: Number(xBar.toFixed(4)),
      ucl: Number(uclX.toFixed(4)),
      lcl: Number(lclX.toFixed(4)),
      plus2Sigma: Number((xBar + 2 * sigmaEst).toFixed(4)),
      plus1Sigma: Number((xBar + 1 * sigmaEst).toFixed(4)),
      minus1Sigma: Number((xBar - 1 * sigmaEst).toFixed(4)),
      minus2Sigma: Number((xBar - 2 * sigmaEst).toFixed(4)),
      sigma: Number(sigmaEst.toFixed(4)),
      secondaryCenterLine: Number(mrBar.toFixed(4)),
      secondaryUcl: Number(uclMR.toFixed(4)),
      secondaryLcl: Number(lclMR.toFixed(4))
    };
  }

  // 3. X-bar and S Chart
  if (chartType === 'XBar_S') {
    const valid = subgroups.filter(s => s.measurements && s.measurements.length > 0);
    const k = valid.length || 1;
    const xDoubleBar = valid.reduce((acc, s) => acc + s.mean, 0) / k;
    const sBar = valid.reduce((acc, s) => acc + s.stdDev, 0) / k;

    const uclX = xDoubleBar + factors.A3 * sBar;
    const lclX = xDoubleBar - factors.A3 * sBar;
    const sigmaX = (uclX - xDoubleBar) / 3;
    const sigmaEst = sBar / factors.c4;

    const uclS = factors.B4 * sBar;
    const lclS = factors.B3 * sBar;

    return {
      chartType,
      subgroupSize: n,
      centerLine: Number(xDoubleBar.toFixed(4)),
      ucl: Number(uclX.toFixed(4)),
      lcl: Number(lclX.toFixed(4)),
      plus2Sigma: Number((xDoubleBar + 2 * sigmaX).toFixed(4)),
      plus1Sigma: Number((xDoubleBar + 1 * sigmaX).toFixed(4)),
      minus1Sigma: Number((xDoubleBar - 1 * sigmaX).toFixed(4)),
      minus2Sigma: Number((xDoubleBar - 2 * sigmaX).toFixed(4)),
      sigma: Number(sigmaEst.toFixed(4)),
      secondaryCenterLine: Number(sBar.toFixed(4)),
      secondaryUcl: Number(uclS.toFixed(4)),
      secondaryLcl: Number(lclS.toFixed(4))
    };
  }

  // 4. Attribute: p Chart (Fraction Nonconforming)
  if (chartType === 'p_chart') {
    const totalDefectives = subgroups.reduce((acc, s) => acc + (s.defectivesCount ?? 0), 0);
    const totalInspected = subgroups.reduce((acc, s) => acc + (s.totalInspected ?? n), 0);
    const pBar = totalInspected > 0 ? totalDefectives / totalInspected : 0.05;
    const avgN = totalInspected / (subgroups.length || 1);

    const sigmaP = Math.sqrt((pBar * (1 - pBar)) / avgN);
    const ucl = Math.min(1, pBar + 3 * sigmaP);
    const lcl = Math.max(0, pBar - 3 * sigmaP);

    return {
      chartType,
      subgroupSize: avgN,
      centerLine: Number(pBar.toFixed(4)),
      ucl: Number(ucl.toFixed(4)),
      lcl: Number(lcl.toFixed(4)),
      plus2Sigma: Number(Math.min(1, pBar + 2 * sigmaP).toFixed(4)),
      plus1Sigma: Number(Math.min(1, pBar + 1 * sigmaP).toFixed(4)),
      minus1Sigma: Number(Math.max(0, pBar - 1 * sigmaP).toFixed(4)),
      minus2Sigma: Number(Math.max(0, pBar - 2 * sigmaP).toFixed(4)),
      sigma: Number(sigmaP.toFixed(4))
    };
  }

  // 5. Attribute: c Chart (Count of Defects per fixed lot)
  if (chartType === 'c_chart') {
    const totalDefects = subgroups.reduce((acc, s) => acc + (s.defectsCount ?? 0), 0);
    const cBar = totalDefects / (subgroups.length || 1);
    const sigmaC = Math.sqrt(cBar);

    const ucl = cBar + 3 * sigmaC;
    const lcl = Math.max(0, cBar - 3 * sigmaC);

    return {
      chartType,
      subgroupSize: n,
      centerLine: Number(cBar.toFixed(4)),
      ucl: Number(ucl.toFixed(4)),
      lcl: Number(lcl.toFixed(4)),
      plus2Sigma: Number((cBar + 2 * sigmaC).toFixed(4)),
      plus1Sigma: Number((cBar + 1 * sigmaC).toFixed(4)),
      minus1Sigma: Number(Math.max(0, cBar - 1 * sigmaC).toFixed(4)),
      minus2Sigma: Number(Math.max(0, cBar - 2 * sigmaC).toFixed(4)),
      sigma: Number(sigmaC.toFixed(4))
    };
  }

  // 6. Attribute: u Chart (Defects per Unit)
  if (chartType === 'u_chart') {
    const totalDefects = subgroups.reduce((acc, s) => acc + (s.defectsCount ?? 0), 0);
    const totalUnits = subgroups.reduce((acc, s) => acc + (s.totalInspected ?? n), 0);
    const uBar = totalUnits > 0 ? totalDefects / totalUnits : 1;
    const avgUnits = totalUnits / (subgroups.length || 1);

    const sigmaU = Math.sqrt(uBar / avgUnits);
    const ucl = uBar + 3 * sigmaU;
    const lcl = Math.max(0, uBar - 3 * sigmaU);

    return {
      chartType,
      subgroupSize: avgUnits,
      centerLine: Number(uBar.toFixed(4)),
      ucl: Number(ucl.toFixed(4)),
      lcl: Number(lcl.toFixed(4)),
      plus2Sigma: Number((uBar + 2 * sigmaU).toFixed(4)),
      plus1Sigma: Number((uBar + 1 * sigmaU).toFixed(4)),
      minus1Sigma: Number(Math.max(0, uBar - 1 * sigmaU).toFixed(4)),
      minus2Sigma: Number(Math.max(0, uBar - 2 * sigmaU).toFixed(4)),
      sigma: Number(sigmaU.toFixed(4))
    };
  }

  // Fallback
  return {
    chartType,
    subgroupSize: n,
    centerLine: 0,
    ucl: 0,
    lcl: 0,
    plus2Sigma: 0,
    plus1Sigma: 0,
    minus1Sigma: 0,
    minus2Sigma: 0,
    sigma: 0
  };
}

// ==========================================
// WESTERN ELECTRIC & NELSON RULES ENGINE
// ==========================================

export function evaluateWesternElectricRules(
  subgroups: SubgroupSample[],
  limits: ControlLimits,
  activeRules: WesternElectricRuleId[]
): SubgroupSample[] {
  const { centerLine, ucl, lcl, plus2Sigma, plus1Sigma, minus1Sigma, minus2Sigma } = limits;
  if (!subgroups || subgroups.length === 0 || ucl === lcl) return subgroups;

  const sigmaStat = (ucl - centerLine) / 3 || 1;

  // Determine which value to inspect per point
  const points = subgroups.map((s, idx) => {
    let val = s.mean;
    if (limits.chartType === 'I_MR') {
      val = s.measurements[0] ?? s.mean;
    } else if (limits.chartType === 'p_chart') {
      val = s.fractionDefective ?? (s.defectivesCount ?? 0) / (s.totalInspected || 1);
    } else if (limits.chartType === 'c_chart') {
      val = s.defectsCount ?? 0;
    } else if (limits.chartType === 'u_chart') {
      val = s.defectsPerUnit ?? (s.defectsCount ?? 0) / (s.totalInspected || 1);
    }
    return {
      idx,
      subgroupNumber: s.subgroupNumber,
      val
    };
  });

  const ruleMap: Record<number, RuleViolation[]> = {};
  points.forEach(p => { ruleMap[p.idx] = []; });

  const isEnabled = (r: WesternElectricRuleId) => activeRules.includes(r);

  // RULE 1: Any single point outside 3-sigma control limits (> UCL or < LCL)
  if (isEnabled('WE_RULE_1')) {
    points.forEach(p => {
      if (p.val > ucl || p.val < lcl) {
        ruleMap[p.idx].push({
          ruleId: 'WE_RULE_1',
          ruleName: 'Rule 1: Point Beyond 3σ',
          description: `Point ${p.subgroupNumber} (${p.val.toFixed(4)}) breached ${p.val > ucl ? 'UCL' : 'LCL'} (${p.val > ucl ? ucl : lcl})`,
          severity: 'critical',
          zone: 'Beyond 3σ',
          pointIndex: p.idx,
          subgroupNumber: p.subgroupNumber,
          value: p.val,
          limitBreached: p.val > ucl ? ucl : lcl
        });
      }
    });
  }

  // RULE 2: 2 out of 3 consecutive points in Zone A or beyond (> 2-sigma on same side)
  if (isEnabled('WE_RULE_2')) {
    for (let i = 2; i < points.length; i++) {
      const window = [points[i - 2], points[i - 1], points[i]];
      // Check upper Zone A or beyond (> plus2Sigma)
      const countUpperZoneA = window.filter(pt => pt.val > plus2Sigma).length;
      if (countUpperZoneA >= 2) {
        ruleMap[points[i].idx].push({
          ruleId: 'WE_RULE_2',
          ruleName: 'Rule 2: Zone A (2 of 3 > 2σ)',
          description: `2 of 3 consecutive points fall in upper Zone A (> +2σ: ${plus2Sigma})`,
          severity: 'warning',
          zone: 'Zone A',
          pointIndex: points[i].idx,
          subgroupNumber: points[i].subgroupNumber,
          value: points[i].val
        });
      }
      // Check lower Zone A or beyond (< minus2Sigma)
      const countLowerZoneA = window.filter(pt => pt.val < minus2Sigma).length;
      if (countLowerZoneA >= 2) {
        ruleMap[points[i].idx].push({
          ruleId: 'WE_RULE_2',
          ruleName: 'Rule 2: Zone A (2 of 3 < -2σ)',
          description: `2 of 3 consecutive points fall in lower Zone A (< -2σ: ${minus2Sigma})`,
          severity: 'warning',
          zone: 'Zone A',
          pointIndex: points[i].idx,
          subgroupNumber: points[i].subgroupNumber,
          value: points[i].val
        });
      }
    }
  }

  // RULE 3: 4 out of 5 consecutive points in Zone B or beyond (> 1-sigma on same side)
  if (isEnabled('WE_RULE_3')) {
    for (let i = 4; i < points.length; i++) {
      const window = [points[i - 4], points[i - 3], points[i - 2], points[i - 1], points[i]];
      const countUpperZoneB = window.filter(pt => pt.val > plus1Sigma).length;
      if (countUpperZoneB >= 4) {
        ruleMap[points[i].idx].push({
          ruleId: 'WE_RULE_3',
          ruleName: 'Rule 3: Zone B (4 of 5 > 1σ)',
          description: `4 of 5 consecutive points fall beyond +1σ (${plus1Sigma}) on same side of center line`,
          severity: 'warning',
          zone: 'Zone B',
          pointIndex: points[i].idx,
          subgroupNumber: points[i].subgroupNumber,
          value: points[i].val
        });
      }
      const countLowerZoneB = window.filter(pt => pt.val < minus1Sigma).length;
      if (countLowerZoneB >= 4) {
        ruleMap[points[i].idx].push({
          ruleId: 'WE_RULE_3',
          ruleName: 'Rule 3: Zone B (4 of 5 < -1σ)',
          description: `4 of 5 consecutive points fall below -1σ (${minus1Sigma}) on same side of center line`,
          severity: 'warning',
          zone: 'Zone B',
          pointIndex: points[i].idx,
          subgroupNumber: points[i].subgroupNumber,
          value: points[i].val
        });
      }
    }
  }

  // RULE 4: 8 or 9 consecutive points on same side of Center Line (Process Mean Shift)
  if (isEnabled('WE_RULE_4')) {
    const RUN_LENGTH = 8;
    for (let i = RUN_LENGTH - 1; i < points.length; i++) {
      const window = points.slice(i - RUN_LENGTH + 1, i + 1);
      const allAbove = window.every(pt => pt.val > centerLine);
      const allBelow = window.every(pt => pt.val < centerLine);
      if (allAbove || allBelow) {
        ruleMap[points[i].idx].push({
          ruleId: 'WE_RULE_4',
          ruleName: 'Rule 4: Centerline Run (8 in a row)',
          description: `8 consecutive points fall on ${allAbove ? 'upper' : 'lower'} side of Centerline (${centerLine}), indicating process mean shift`,
          severity: 'warning',
          zone: 'Centerline Run',
          pointIndex: points[i].idx,
          subgroupNumber: points[i].subgroupNumber,
          value: points[i].val
        });
      }
    }
  }

  // NELSON RULE 5: 6 consecutive points steadily increasing or steadily decreasing (Trend)
  if (isEnabled('NELSON_5')) {
    const TREND_LENGTH = 6;
    for (let i = TREND_LENGTH - 1; i < points.length; i++) {
      let isIncreasing = true;
      let isDecreasing = true;
      for (let j = i - TREND_LENGTH + 1; j < i; j++) {
        if (points[j + 1].val <= points[j].val) isIncreasing = false;
        if (points[j + 1].val >= points[j].val) isDecreasing = false;
      }
      if (isIncreasing || isDecreasing) {
        ruleMap[points[i].idx].push({
          ruleId: 'NELSON_5',
          ruleName: 'Nelson 5: Trend (6 increasing/decreasing)',
          description: `6 consecutive points steadily ${isIncreasing ? 'increasing' : 'decreasing'} (detecting tool wear or thermal drift)`,
          severity: 'warning',
          zone: 'Trend',
          pointIndex: points[i].idx,
          subgroupNumber: points[i].subgroupNumber,
          value: points[i].val
        });
      }
    }
  }

  // NELSON RULE 6: 14 consecutive points alternating up and down (Systematic oscillation)
  if (isEnabled('NELSON_6')) {
    const OSC_LENGTH = 14;
    for (let i = OSC_LENGTH - 1; i < points.length; i++) {
      let alternates = true;
      for (let j = i - OSC_LENGTH + 1; j < i - 1; j++) {
        const diff1 = points[j + 1].val - points[j].val;
        const diff2 = points[j + 2].val - points[j + 1].val;
        if ((diff1 > 0 && diff2 > 0) || (diff1 < 0 && diff2 < 0) || diff1 === 0 || diff2 === 0) {
          alternates = false;
          break;
        }
      }
      if (alternates) {
        ruleMap[points[i].idx].push({
          ruleId: 'NELSON_6',
          ruleName: 'Nelson 6: Systematic Oscillation (14 alternating)',
          description: '14 consecutive points alternating direction up and down (potential two-operator or dual-fixture variation)',
          severity: 'advisory',
          pointIndex: points[i].idx,
          subgroupNumber: points[i].subgroupNumber,
          value: points[i].val
        });
      }
    }
  }

  // NELSON RULE 7: 15 consecutive points in Zone C (Stratification / Hugging Center Line)
  if (isEnabled('NELSON_7')) {
    const STRAT_LENGTH = 15;
    for (let i = STRAT_LENGTH - 1; i < points.length; i++) {
      const window = points.slice(i - STRAT_LENGTH + 1, i + 1);
      const allInZoneC = window.every(pt => Math.abs(pt.val - centerLine) <= sigmaStat);
      if (allInZoneC) {
        ruleMap[points[i].idx].push({
          ruleId: 'NELSON_7',
          ruleName: 'Nelson 7: Stratification (15 in Zone C)',
          description: '15 consecutive points within ±1σ of centerline (overly small subgroup variation or miscalculated limits)',
          severity: 'advisory',
          zone: 'Zone C',
          pointIndex: points[i].idx,
          subgroupNumber: points[i].subgroupNumber,
          value: points[i].val
        });
      }
    }
  }

  // Return updated subgroups with attached violations
  return subgroups.map((s, idx) => ({
    ...s,
    violations: ruleMap[idx] || []
  }));
}

// ==========================================
// PROCESS CAPABILITY (Cp / Cpk / Pp / Ppk)
// ==========================================

export function calculateCapabilityIndices(
  study: Pick<SpcStudy, 'usl' | 'lsl' | 'nominalValue' | 'subgroupSize' | 'subgroups'>,
  limits: ControlLimits
): ProcessCapabilityIndices {
  const { usl, lsl, nominalValue, subgroups } = study;
  const allMeasurements: number[] = [];
  subgroups.forEach(s => {
    if (s.measurements && s.measurements.length > 0) {
      allMeasurements.push(...s.measurements);
    } else {
      allMeasurements.push(s.mean);
    }
  });

  const totalN = allMeasurements.length || 1;
  const overallMean = allMeasurements.reduce((a, b) => a + b, 0) / totalN;

  // Overall sample standard deviation (s)
  const sumSqDiff = allMeasurements.reduce((acc, x) => acc + Math.pow(x - overallMean, 2), 0);
  const sigmaOverall = Math.sqrt(sumSqDiff / (totalN > 1 ? totalN - 1 : 1)) || 0.001;

  // Short term within sigma from control limits
  const sigmaWithin = limits.sigma > 0 ? limits.sigma : sigmaOverall;

  const tolerance = usl - lsl;
  const cp = tolerance > 0 ? tolerance / (6 * sigmaWithin) : 0;
  const cpu = (usl - overallMean) / (3 * sigmaWithin);
  const cpl = (overallMean - lsl) / (3 * sigmaWithin);
  const cpk = Math.max(0, Math.min(cpu, cpl));

  // Performance indices
  const pp = tolerance > 0 ? tolerance / (6 * sigmaOverall) : 0;
  const ppu = (usl - overallMean) / (3 * sigmaOverall);
  const ppl = (overallMean - lsl) / (3 * sigmaOverall);
  const ppk = Math.max(0, Math.min(ppu, ppl));

  // Centering index k: 0 = centered, 1 = mean at spec limit
  const specMid = (usl + lsl) / 2;
  const halfTolerance = tolerance / 2;
  const centeringK = halfTolerance > 0 ? Math.abs(overallMean - specMid) / halfTolerance : 0;

  // Sigma Level: ~ 3 * Cpk
  const sigmaLevel = Math.max(0, cpk * 3);

  // Estimated defect rate PPM (parts per million) outside specification
  const zUpper = (usl - overallMean) / sigmaOverall;
  const zLower = (overallMean - lsl) / sigmaOverall;
  const probUpperDefect = 1 - standardNormalCdf(zUpper);
  const probLowerDefect = 1 - standardNormalCdf(zLower);
  const totalProbDefect = Math.max(0, Math.min(1, probUpperDefect + probLowerDefect));
  const ppmDefectiveEst = Math.round(totalProbDefect * 1_000_000);

  let status: 'six_sigma' | 'capable' | 'marginally_capable' | 'incapable' = 'capable';
  if (cpk >= 1.67) {
    status = 'six_sigma';
  } else if (cpk >= 1.33) {
    status = 'capable';
  } else if (cpk >= 1.0) {
    status = 'marginally_capable';
  } else {
    status = 'incapable';
  }

  return {
    sampleCount: subgroups.length,
    totalMeasurements: totalN,
    mean: Number(overallMean.toFixed(4)),
    sigmaWithin: Number(sigmaWithin.toFixed(4)),
    sigmaOverall: Number(sigmaOverall.toFixed(4)),
    usl,
    lsl,
    nominal: nominalValue,
    cp: Number(cp.toFixed(2)),
    cpk: Number(cpk.toFixed(2)),
    cpu: Number(cpu.toFixed(2)),
    cpl: Number(cpl.toFixed(2)),
    pp: Number(pp.toFixed(2)),
    ppk: Number(ppk.toFixed(2)),
    ppu: Number(ppu.toFixed(2)),
    ppl: Number(ppl.toFixed(2)),
    centeringK: Number(centeringK.toFixed(3)),
    sigmaLevel: Number(sigmaLevel.toFixed(1)),
    ppmDefectiveEst,
    status
  };
}

// ==========================================
// HISTOGRAM & GAUSSIAN BELL CURVE GENERATOR
// ==========================================

export function generateHistogramDistribution(
  subgroups: SubgroupSample[],
  usl: number,
  lsl: number,
  binCount: number = 14
): HistogramDistribution {
  const allValues: number[] = [];
  subgroups.forEach(s => {
    if (s.measurements && s.measurements.length > 0) {
      allValues.push(...s.measurements);
    } else {
      allValues.push(s.mean);
    }
  });

  if (allValues.length === 0) {
    return {
      bins: [],
      minVal: lsl,
      maxVal: usl,
      binWidth: 0,
      normalCurvePoints: []
    };
  }

  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(...allValues);
  const minVal = Math.min(dataMin, lsl) - (usl - lsl) * 0.05;
  const maxVal = Math.max(dataMax, usl) + (usl - lsl) * 0.05;
  const range = maxVal - minVal;
  const binWidth = range / binCount;

  const mean = allValues.reduce((a, b) => a + b, 0) / allValues.length;
  const sumSq = allValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
  const std = Math.sqrt(sumSq / (allValues.length > 1 ? allValues.length - 1 : 1)) || 0.001;

  const bins: HistogramBin[] = [];
  for (let i = 0; i < binCount; i++) {
    const binStart = minVal + i * binWidth;
    const binEnd = binStart + binWidth;
    const binCenter = (binStart + binEnd) / 2;
    const actualCount = allValues.filter(v => v >= binStart && (i === binCount - 1 ? v <= binEnd : v < binEnd)).length;

    // Normal probability in this bin
    const z1 = (binStart - mean) / std;
    const z2 = (binEnd - mean) / std;
    const prob = Math.max(0, standardNormalCdf(z2) - standardNormalCdf(z1));
    const expectedCount = Math.round(prob * allValues.length * 10) / 10;

    bins.push({
      binStart,
      binEnd,
      binCenter,
      actualCount,
      expectedCount
    });
  }

  // Smooth Gaussian bell-curve 50 points
  const normalCurvePoints: { x: number; y: number }[] = [];
  const maxBinCount = Math.max(...bins.map(b => b.actualCount), 1);
  const peakNormalHeight = (1 / (std * Math.sqrt(2 * Math.PI))) * binWidth * allValues.length;

  for (let step = 0; step <= 50; step++) {
    const x = minVal + (step / 50) * range;
    const z = (x - mean) / std;
    const height = Math.exp(-0.5 * z * z) * peakNormalHeight;
    normalCurvePoints.push({ x, y: height });
  }

  return {
    bins,
    minVal,
    maxVal,
    binWidth,
    normalCurvePoints
  };
}

// ==========================================
// PRE-SEEDED INDUSTRIAL SPC STUDIES
// ==========================================

const INITIAL_SPC_STUDIES: SpcStudy[] = [
  {
    id: 'spc-study-001',
    studyName: 'CNC Turning Dia 180mm (X-bar & R)',
    partNumber: 'PART-FLG-750',
    partName: 'Precision Valve Flange Dia 180mm',
    operationCode: 'OP-CNC-02',
    operationName: 'CNC Turning & Finish Facing',
    characteristicName: 'Turned Outer Flange Diameter',
    unit: 'mm',
    chartType: 'XBar_R',
    subgroupSize: 5,
    nominalValue: 180.00,
    usl: 180.05,
    lsl: 179.95,
    activeRules: ['WE_RULE_1', 'WE_RULE_2', 'WE_RULE_3', 'WE_RULE_4', 'NELSON_5'],
    isLockedForBaseline: true,
    baselineSubgroupsCount: 20,
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-12T03:00:00Z',
    subgroups: [
      {
        id: 'sg-1',
        subgroupNumber: 1,
        timestamp: '2026-10-11T08:00:00Z',
        batchOrLotNumber: 'LOT-2026-1001',
        operatorName: 'Alex Rivera (Sr. CNC Machinist)',
        machineId: 'CNC-HAAS-01',
        measurements: [179.998, 180.002, 180.001, 179.996, 180.003],
        sampleSize: 5,
        mean: 180.000,
        range: 0.007,
        stdDev: 0.0028,
        violations: []
      },
      {
        id: 'sg-2',
        subgroupNumber: 2,
        timestamp: '2026-10-11T09:00:00Z',
        batchOrLotNumber: 'LOT-2026-1001',
        operatorName: 'Alex Rivera',
        machineId: 'CNC-HAAS-01',
        measurements: [180.004, 180.001, 179.998, 180.002, 180.005],
        sampleSize: 5,
        mean: 180.002,
        range: 0.007,
        stdDev: 0.0027,
        violations: []
      },
      {
        id: 'sg-3',
        subgroupNumber: 3,
        timestamp: '2026-10-11T10:00:00Z',
        batchOrLotNumber: 'LOT-2026-1001',
        operatorName: 'Alex Rivera',
        machineId: 'CNC-HAAS-01',
        measurements: [179.997, 180.000, 180.003, 179.999, 180.001],
        sampleSize: 5,
        mean: 180.000,
        range: 0.006,
        stdDev: 0.0022,
        violations: []
      },
      {
        id: 'sg-4',
        subgroupNumber: 4,
        timestamp: '2026-10-11T11:00:00Z',
        batchOrLotNumber: 'LOT-2026-1001',
        operatorName: 'Alex Rivera',
        machineId: 'CNC-HAAS-01',
        measurements: [180.002, 180.006, 180.001, 180.003, 180.003],
        sampleSize: 5,
        mean: 180.003,
        range: 0.005,
        stdDev: 0.0019,
        violations: []
      },
      {
        id: 'sg-5',
        subgroupNumber: 5,
        timestamp: '2026-10-11T12:00:00Z',
        batchOrLotNumber: 'LOT-2026-1001',
        operatorName: 'Alex Rivera',
        machineId: 'CNC-HAAS-01',
        measurements: [179.995, 179.999, 180.002, 179.998, 180.001],
        sampleSize: 5,
        mean: 179.999,
        range: 0.007,
        stdDev: 0.0027,
        violations: []
      },
      {
        id: 'sg-6',
        subgroupNumber: 6,
        timestamp: '2026-10-11T13:00:00Z',
        batchOrLotNumber: 'LOT-2026-1002',
        operatorName: 'Elena Rostova',
        machineId: 'CNC-HAAS-01',
        measurements: [180.001, 180.003, 180.005, 180.000, 180.001],
        sampleSize: 5,
        mean: 180.002,
        range: 0.005,
        stdDev: 0.0019,
        violations: []
      },
      {
        id: 'sg-7',
        subgroupNumber: 7,
        timestamp: '2026-10-11T14:00:00Z',
        batchOrLotNumber: 'LOT-2026-1002',
        operatorName: 'Elena Rostova',
        machineId: 'CNC-HAAS-01',
        measurements: [180.003, 180.005, 180.004, 180.006, 180.002],
        sampleSize: 5,
        mean: 180.004,
        range: 0.004,
        stdDev: 0.0015,
        violations: []
      },
      {
        id: 'sg-8',
        subgroupNumber: 8,
        timestamp: '2026-10-11T15:00:00Z',
        batchOrLotNumber: 'LOT-2026-1002',
        operatorName: 'Elena Rostova',
        machineId: 'CNC-HAAS-01',
        measurements: [180.006, 180.008, 180.007, 180.005, 180.009],
        sampleSize: 5,
        mean: 180.007,
        range: 0.004,
        stdDev: 0.0015,
        violations: []
      },
      {
        id: 'sg-9',
        subgroupNumber: 9,
        timestamp: '2026-10-11T16:00:00Z',
        batchOrLotNumber: 'LOT-2026-1002',
        operatorName: 'Elena Rostova',
        machineId: 'CNC-HAAS-01',
        measurements: [180.009, 180.011, 180.012, 180.008, 180.010],
        sampleSize: 5,
        mean: 180.010,
        range: 0.004,
        stdDev: 0.0016,
        violations: []
      },
      {
        id: 'sg-10',
        subgroupNumber: 10,
        timestamp: '2026-10-11T17:00:00Z',
        batchOrLotNumber: 'LOT-2026-1002',
        operatorName: 'Elena Rostova',
        machineId: 'CNC-HAAS-01',
        measurements: [180.012, 180.014, 180.015, 180.013, 180.016],
        sampleSize: 5,
        mean: 180.014,
        range: 0.004,
        stdDev: 0.0015,
        violations: []
      },
      {
        id: 'sg-11',
        subgroupNumber: 11,
        timestamp: '2026-10-11T18:00:00Z',
        batchOrLotNumber: 'LOT-2026-1003',
        operatorName: 'Elena Rostova',
        machineId: 'CNC-HAAS-01',
        measurements: [180.015, 180.018, 180.016, 180.019, 180.017],
        sampleSize: 5,
        mean: 180.017,
        range: 0.004,
        stdDev: 0.0015,
        violations: []
      },
      {
        id: 'sg-12',
        subgroupNumber: 12,
        timestamp: '2026-10-11T19:00:00Z',
        batchOrLotNumber: 'LOT-2026-1003',
        operatorName: 'Elena Rostova',
        machineId: 'CNC-HAAS-01',
        measurements: [180.021, 180.024, 180.022, 180.020, 180.023],
        sampleSize: 5,
        mean: 180.022,
        range: 0.004,
        stdDev: 0.0015,
        violations: []
      },
      {
        id: 'sg-13',
        subgroupNumber: 13,
        timestamp: '2026-10-11T20:00:00Z',
        batchOrLotNumber: 'LOT-2026-1003',
        operatorName: 'Marcus Vance',
        machineId: 'CNC-HAAS-01',
        measurements: [180.024, 180.028, 180.026, 180.025, 180.027],
        sampleSize: 5,
        mean: 180.026,
        range: 0.004,
        stdDev: 0.0015,
        violations: []
      },
      {
        id: 'sg-14',
        subgroupNumber: 14,
        timestamp: '2026-10-11T21:00:00Z',
        batchOrLotNumber: 'LOT-2026-1003',
        operatorName: 'Marcus Vance',
        machineId: 'CNC-HAAS-01',
        // Notice tool offset reset after alert!
        measurements: [180.002, 179.999, 180.001, 180.003, 180.000],
        sampleSize: 5,
        mean: 180.001,
        range: 0.004,
        stdDev: 0.0015,
        violations: []
      },
      {
        id: 'sg-15',
        subgroupNumber: 15,
        timestamp: '2026-10-11T22:00:00Z',
        batchOrLotNumber: 'LOT-2026-1004',
        operatorName: 'Marcus Vance',
        machineId: 'CNC-HAAS-01',
        measurements: [180.001, 180.003, 179.998, 180.002, 180.001],
        sampleSize: 5,
        mean: 180.001,
        range: 0.005,
        stdDev: 0.0019,
        violations: []
      },
      {
        id: 'sg-16',
        subgroupNumber: 16,
        timestamp: '2026-10-11T23:00:00Z',
        batchOrLotNumber: 'LOT-2026-1004',
        operatorName: 'Marcus Vance',
        machineId: 'CNC-HAAS-01',
        measurements: [179.998, 180.001, 180.002, 179.997, 180.002],
        sampleSize: 5,
        mean: 180.000,
        range: 0.005,
        stdDev: 0.0021,
        violations: []
      },
      {
        id: 'sg-17',
        subgroupNumber: 17,
        timestamp: '2026-10-12T00:00:00Z',
        batchOrLotNumber: 'LOT-2026-1004',
        operatorName: 'Marcus Vance',
        machineId: 'CNC-HAAS-01',
        measurements: [180.002, 180.004, 180.001, 180.000, 180.003],
        sampleSize: 5,
        mean: 180.002,
        range: 0.004,
        stdDev: 0.0016,
        violations: []
      },
      {
        id: 'sg-18',
        subgroupNumber: 18,
        timestamp: '2026-10-12T01:00:00Z',
        batchOrLotNumber: 'LOT-2026-1005',
        operatorName: 'Marcus Vance',
        machineId: 'CNC-HAAS-01',
        measurements: [180.003, 180.001, 180.000, 180.002, 180.004],
        sampleSize: 5,
        mean: 180.002,
        range: 0.004,
        stdDev: 0.0016,
        violations: []
      }
    ]
  },
  {
    id: 'spc-study-002',
    studyName: 'H7 Internal Bore ID 75mm (I-MR)',
    partNumber: 'PART-FLG-750',
    partName: 'Precision Valve Flange Dia 180mm',
    operationCode: 'OP-CNC-02',
    operationName: 'Precision Internal Bore Boring',
    characteristicName: 'Internal Bore ID (H7 +0.025/-0.000)',
    unit: 'mm',
    chartType: 'I_MR',
    subgroupSize: 1,
    nominalValue: 75.0125,
    usl: 75.025,
    lsl: 75.000,
    activeRules: ['WE_RULE_1', 'WE_RULE_2', 'WE_RULE_3', 'WE_RULE_4'],
    createdAt: '2026-10-02T08:00:00Z',
    updatedAt: '2026-10-12T02:30:00Z',
    subgroups: [
      { id: 'imr-1', subgroupNumber: 1, timestamp: '2026-10-11T08:00:00Z', batchOrLotNumber: 'LOT-1001', operatorName: 'Alex Rivera', machineId: 'BOR-01', measurements: [75.011], sampleSize: 1, mean: 75.011, range: 0, stdDev: 0, movingRange: 0, violations: [] },
      { id: 'imr-2', subgroupNumber: 2, timestamp: '2026-10-11T09:00:00Z', batchOrLotNumber: 'LOT-1001', operatorName: 'Alex Rivera', machineId: 'BOR-01', measurements: [75.013], sampleSize: 1, mean: 75.013, range: 0, stdDev: 0, movingRange: 0.002, violations: [] },
      { id: 'imr-3', subgroupNumber: 3, timestamp: '2026-10-11T10:00:00Z', batchOrLotNumber: 'LOT-1001', operatorName: 'Alex Rivera', machineId: 'BOR-01', measurements: [75.010], sampleSize: 1, mean: 75.010, range: 0, stdDev: 0, movingRange: 0.003, violations: [] },
      { id: 'imr-4', subgroupNumber: 4, timestamp: '2026-10-11T11:00:00Z', batchOrLotNumber: 'LOT-1001', operatorName: 'Alex Rivera', machineId: 'BOR-01', measurements: [75.014], sampleSize: 1, mean: 75.014, range: 0, stdDev: 0, movingRange: 0.004, violations: [] },
      { id: 'imr-5', subgroupNumber: 5, timestamp: '2026-10-11T12:00:00Z', batchOrLotNumber: 'LOT-1001', operatorName: 'Alex Rivera', machineId: 'BOR-01', measurements: [75.012], sampleSize: 1, mean: 75.012, range: 0, stdDev: 0, movingRange: 0.002, violations: [] },
      { id: 'imr-6', subgroupNumber: 6, timestamp: '2026-10-11T13:00:00Z', batchOrLotNumber: 'LOT-1002', operatorName: 'Elena Rostova', machineId: 'BOR-01', measurements: [75.015], sampleSize: 1, mean: 75.015, range: 0, stdDev: 0, movingRange: 0.003, violations: [] },
      { id: 'imr-7', subgroupNumber: 7, timestamp: '2026-10-11T14:00:00Z', batchOrLotNumber: 'LOT-1002', operatorName: 'Elena Rostova', machineId: 'BOR-01', measurements: [75.013], sampleSize: 1, mean: 75.013, range: 0, stdDev: 0, movingRange: 0.002, violations: [] },
      { id: 'imr-8', subgroupNumber: 8, timestamp: '2026-10-11T15:00:00Z', batchOrLotNumber: 'LOT-1002', operatorName: 'Elena Rostova', machineId: 'BOR-01', measurements: [75.016], sampleSize: 1, mean: 75.016, range: 0, stdDev: 0, movingRange: 0.003, violations: [] },
      { id: 'imr-9', subgroupNumber: 9, timestamp: '2026-10-11T16:00:00Z', batchOrLotNumber: 'LOT-1002', operatorName: 'Elena Rostova', machineId: 'BOR-01', measurements: [75.018], sampleSize: 1, mean: 75.018, range: 0, stdDev: 0, movingRange: 0.002, violations: [] },
      { id: 'imr-10', subgroupNumber: 10, timestamp: '2026-10-11T17:00:00Z', batchOrLotNumber: 'LOT-1002', operatorName: 'Elena Rostova', machineId: 'BOR-01', measurements: [75.019], sampleSize: 1, mean: 75.019, range: 0, stdDev: 0, movingRange: 0.001, violations: [] },
      { id: 'imr-11', subgroupNumber: 11, timestamp: '2026-10-11T18:00:00Z', batchOrLotNumber: 'LOT-1003', operatorName: 'Elena Rostova', machineId: 'BOR-01', measurements: [75.021], sampleSize: 1, mean: 75.021, range: 0, stdDev: 0, movingRange: 0.002, violations: [] },
      { id: 'imr-12', subgroupNumber: 12, timestamp: '2026-10-11T19:00:00Z', batchOrLotNumber: 'LOT-1003', operatorName: 'Elena Rostova', machineId: 'BOR-01', measurements: [75.023], sampleSize: 1, mean: 75.023, range: 0, stdDev: 0, movingRange: 0.002, violations: [] }
    ]
  },
  {
    id: 'spc-study-003',
    studyName: 'Bracket Stamping Defect Rate (p-Chart)',
    partNumber: 'PART-BRK-400',
    partName: 'Galvanized Structural Mounting Bracket',
    operationCode: 'OP-STMP-01',
    operationName: 'Progressive Stamping & Deburring',
    characteristicName: 'Fraction Defective Units (Burrs / Edge Tears)',
    unit: 'Fraction',
    chartType: 'p_chart',
    subgroupSize: 200,
    nominalValue: 0.02,
    usl: 0.05,
    lsl: 0.00,
    activeRules: ['WE_RULE_1', 'WE_RULE_2', 'WE_RULE_4'],
    createdAt: '2026-10-04T08:00:00Z',
    updatedAt: '2026-10-12T01:15:00Z',
    subgroups: [
      { id: 'p-1', subgroupNumber: 1, timestamp: '2026-10-08T08:00:00Z', batchOrLotNumber: 'LOT-B-01', operatorName: 'Vikram Patel', machineId: 'PRS-250T', defectivesCount: 4, totalInspected: 200, fractionDefective: 0.020, measurements: [], sampleSize: 200, mean: 0.020, range: 0, stdDev: 0, violations: [] },
      { id: 'p-2', subgroupNumber: 2, timestamp: '2026-10-08T12:00:00Z', batchOrLotNumber: 'LOT-B-01', operatorName: 'Vikram Patel', machineId: 'PRS-250T', defectivesCount: 3, totalInspected: 200, fractionDefective: 0.015, measurements: [], sampleSize: 200, mean: 0.015, range: 0, stdDev: 0, violations: [] },
      { id: 'p-3', subgroupNumber: 3, timestamp: '2026-10-08T16:00:00Z', batchOrLotNumber: 'LOT-B-01', operatorName: 'Vikram Patel', machineId: 'PRS-250T', defectivesCount: 5, totalInspected: 200, fractionDefective: 0.025, measurements: [], sampleSize: 200, mean: 0.025, range: 0, stdDev: 0, violations: [] },
      { id: 'p-4', subgroupNumber: 4, timestamp: '2026-10-09T08:00:00Z', batchOrLotNumber: 'LOT-B-02', operatorName: 'Vikram Patel', machineId: 'PRS-250T', defectivesCount: 6, totalInspected: 200, fractionDefective: 0.030, measurements: [], sampleSize: 200, mean: 0.030, range: 0, stdDev: 0, violations: [] },
      { id: 'p-5', subgroupNumber: 5, timestamp: '2026-10-09T12:00:00Z', batchOrLotNumber: 'LOT-B-02', operatorName: 'Vikram Patel', machineId: 'PRS-250T', defectivesCount: 4, totalInspected: 200, fractionDefective: 0.020, measurements: [], sampleSize: 200, mean: 0.020, range: 0, stdDev: 0, violations: [] },
      { id: 'p-6', subgroupNumber: 6, timestamp: '2026-10-09T16:00:00Z', batchOrLotNumber: 'LOT-B-02', operatorName: 'Vikram Patel', machineId: 'PRS-250T', defectivesCount: 5, totalInspected: 200, fractionDefective: 0.025, measurements: [], sampleSize: 200, mean: 0.025, range: 0, stdDev: 0, violations: [] },
      { id: 'p-7', subgroupNumber: 7, timestamp: '2026-10-10T08:00:00Z', batchOrLotNumber: 'LOT-B-03', operatorName: 'Vikram Patel', machineId: 'PRS-250T', defectivesCount: 14, totalInspected: 200, fractionDefective: 0.070, measurements: [], sampleSize: 200, mean: 0.070, range: 0, stdDev: 0, violations: [] },
      { id: 'p-8', subgroupNumber: 8, timestamp: '2026-10-10T12:00:00Z', batchOrLotNumber: 'LOT-B-03', operatorName: 'Vikram Patel', machineId: 'PRS-250T', defectivesCount: 5, totalInspected: 200, fractionDefective: 0.025, measurements: [], sampleSize: 200, mean: 0.025, range: 0, stdDev: 0, violations: [] },
      { id: 'p-9', subgroupNumber: 9, timestamp: '2026-10-10T16:00:00Z', batchOrLotNumber: 'LOT-B-03', operatorName: 'Vikram Patel', machineId: 'PRS-250T', defectivesCount: 4, totalInspected: 200, fractionDefective: 0.020, measurements: [], sampleSize: 200, mean: 0.020, range: 0, stdDev: 0, violations: [] },
      { id: 'p-10', subgroupNumber: 10, timestamp: '2026-10-11T08:00:00Z', batchOrLotNumber: 'LOT-B-04', operatorName: 'Vikram Patel', machineId: 'PRS-250T', defectivesCount: 3, totalInspected: 200, fractionDefective: 0.015, measurements: [], sampleSize: 200, mean: 0.015, range: 0, stdDev: 0, violations: [] }
    ]
  },
  {
    id: 'spc-study-004',
    studyName: 'Casting Porosity Defects (c-Chart)',
    partNumber: 'PART-CAST-88',
    partName: 'Ductile Iron Gear Housing',
    operationCode: 'OP-CST-01',
    operationName: 'Die Casting & Shakeout',
    characteristicName: 'Total Porosity Pinholes per Sample Unit',
    unit: 'Defects',
    chartType: 'c_chart',
    subgroupSize: 1,
    nominalValue: 4,
    usl: 12,
    lsl: 0,
    activeRules: ['WE_RULE_1', 'WE_RULE_2', 'WE_RULE_4'],
    createdAt: '2026-10-05T08:00:00Z',
    updatedAt: '2026-10-12T00:45:00Z',
    subgroups: [
      { id: 'c-1', subgroupNumber: 1, timestamp: '2026-10-09T08:00:00Z', batchOrLotNumber: 'CAST-HEAT-01', operatorName: 'Frank Dubois', machineId: 'CST-04', defectsCount: 3, measurements: [], sampleSize: 1, mean: 3, range: 0, stdDev: 0, violations: [] },
      { id: 'c-2', subgroupNumber: 2, timestamp: '2026-10-09T10:00:00Z', batchOrLotNumber: 'CAST-HEAT-01', operatorName: 'Frank Dubois', machineId: 'CST-04', defectsCount: 4, measurements: [], sampleSize: 1, mean: 4, range: 0, stdDev: 0, violations: [] },
      { id: 'c-3', subgroupNumber: 3, timestamp: '2026-10-09T12:00:00Z', batchOrLotNumber: 'CAST-HEAT-01', operatorName: 'Frank Dubois', machineId: 'CST-04', defectsCount: 2, measurements: [], sampleSize: 1, mean: 2, range: 0, stdDev: 0, violations: [] },
      { id: 'c-4', subgroupNumber: 4, timestamp: '2026-10-09T14:00:00Z', batchOrLotNumber: 'CAST-HEAT-01', operatorName: 'Frank Dubois', machineId: 'CST-04', defectsCount: 5, measurements: [], sampleSize: 1, mean: 5, range: 0, stdDev: 0, violations: [] },
      { id: 'c-5', subgroupNumber: 5, timestamp: '2026-10-09T16:00:00Z', batchOrLotNumber: 'CAST-HEAT-01', operatorName: 'Frank Dubois', machineId: 'CST-04', defectsCount: 3, measurements: [], sampleSize: 1, mean: 3, range: 0, stdDev: 0, violations: [] },
      { id: 'c-6', subgroupNumber: 6, timestamp: '2026-10-10T08:00:00Z', batchOrLotNumber: 'CAST-HEAT-02', operatorName: 'Frank Dubois', machineId: 'CST-04', defectsCount: 4, measurements: [], sampleSize: 1, mean: 4, range: 0, stdDev: 0, violations: [] },
      { id: 'c-7', subgroupNumber: 7, timestamp: '2026-10-10T10:00:00Z', batchOrLotNumber: 'CAST-HEAT-02', operatorName: 'Frank Dubois', machineId: 'CST-04', defectsCount: 11, measurements: [], sampleSize: 1, mean: 11, range: 0, stdDev: 0, violations: [] },
      { id: 'c-8', subgroupNumber: 8, timestamp: '2026-10-10T12:00:00Z', batchOrLotNumber: 'CAST-HEAT-02', operatorName: 'Frank Dubois', machineId: 'CST-04', defectsCount: 4, measurements: [], sampleSize: 1, mean: 4, range: 0, stdDev: 0, violations: [] },
      { id: 'c-9', subgroupNumber: 9, timestamp: '2026-10-10T14:00:00Z', batchOrLotNumber: 'CAST-HEAT-02', operatorName: 'Frank Dubois', machineId: 'CST-04', defectsCount: 3, measurements: [], sampleSize: 1, mean: 3, range: 0, stdDev: 0, violations: [] },
      { id: 'c-10', subgroupNumber: 10, timestamp: '2026-10-10T16:00:00Z', batchOrLotNumber: 'CAST-HEAT-02', operatorName: 'Frank Dubois', machineId: 'CST-04', defectsCount: 4, measurements: [], sampleSize: 1, mean: 4, range: 0, stdDev: 0, violations: [] }
    ]
  }
];

// Helper to initialize studies and compute their limits + rules
function loadAndHydrateStudies(): SpcStudy[] {
  let stored: SpcStudy[] = [];
  try {
    const raw = localStorage.getItem(SPC_STUDIES_STORAGE_KEY);
    if (raw) {
      stored = JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed reading SPC studies:', e);
  }

  if (!stored || stored.length === 0) {
    stored = INITIAL_SPC_STUDIES;
  }

  // Hydrate: compute limits & evaluate rules for all studies
  return stored.map(study => {
    const limits = calculateControlLimits(study);
    const evaluatedSubgroups = evaluateWesternElectricRules(study.subgroups, limits, study.activeRules);
    return {
      ...study,
      subgroups: evaluatedSubgroups
    };
  });
}

function loadAlerts(): SpcOocAlert[] {
  try {
    const raw = localStorage.getItem(SPC_ALERTS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading SPC alerts:', e);
  }

  // Derive initial alerts from pre-seeded violations
  const initialAlerts: SpcOocAlert[] = [
    {
      id: 'alt-001',
      studyId: 'spc-study-001',
      studyName: 'CNC Turning Dia 180mm (X-bar & R)',
      characteristicName: 'Turned Outer Flange Diameter',
      timestamp: '2026-10-11T20:00:00Z',
      subgroupNumber: 13,
      ruleId: 'WE_RULE_2',
      ruleName: 'Rule 2: Zone A (2 of 3 > 2σ)',
      description: '2 of 3 consecutive points fall in upper Zone A (> +2σ: 180.015). Tool insert wear detected.',
      observedValue: 180.026,
      severity: 'warning',
      status: 'resolved',
      acknowledged: true,
      acknowledgedBy: 'Marcus Vance',
      acknowledgedAt: '2026-10-11T20:30:00Z',
      rootCause: 'Carbide insert tip wear caused dimensional growth (+0.026 mm).',
      correctiveAction: 'Indexed insert to fresh cutting edge #3 and performed touch-off offset calibration.'
    },
    {
      id: 'alt-002',
      studyId: 'spc-study-003',
      studyName: 'Bracket Stamping Defect Rate (p-Chart)',
      characteristicName: 'Fraction Defective Units',
      timestamp: '2026-10-10T08:00:00Z',
      subgroupNumber: 7,
      ruleId: 'WE_RULE_1',
      ruleName: 'Rule 1: Point Beyond 3σ',
      description: 'Subgroup #7 fraction defective spiked to 0.070 (UCL: 0.051). Sheet metal coil burrs exceeded spec.',
      observedValue: 0.070,
      severity: 'critical',
      status: 'resolved',
      acknowledged: true,
      acknowledgedBy: 'Vikram Patel',
      acknowledgedAt: '2026-10-10T08:45:00Z',
      rootCause: 'Shear blade gap misalignment on 250T press after coil feeder change.',
      correctiveAction: 'Re-aligned punch die clearance and polished shear guide plates.'
    },
    {
      id: 'alt-003',
      studyId: 'spc-study-001',
      studyName: 'CNC Turning Dia 180mm (X-bar & R)',
      characteristicName: 'Turned Outer Flange Diameter',
      timestamp: '2026-10-11T19:00:00Z',
      subgroupNumber: 12,
      ruleId: 'NELSON_5',
      ruleName: 'Nelson 5: Trend (6 increasing)',
      description: 'Subgroups 7 through 12 showed continuous upward drift from thermal expansion of spindle.',
      observedValue: 180.022,
      severity: 'warning',
      status: 'resolved',
      acknowledged: true,
      acknowledgedBy: 'Elena Rostova',
      acknowledgedAt: '2026-10-11T19:20:00Z',
      rootCause: 'Spindle chiller temperature regulator set 4°C above target.',
      correctiveAction: 'Reset chiller coolant thermostat to 20°C ambient setpoint.'
    }
  ];

  return initialAlerts;
}

export const spcService = {
  // Get all studies
  getStudies(): SpcStudy[] {
    return loadAndHydrateStudies();
  },

  // Get specific study by ID with limits and capability indices
  getStudyById(id: string): {
    study: SpcStudy;
    limits: ControlLimits;
    capability: ProcessCapabilityIndices;
    histogram: HistogramDistribution;
  } | null {
    const studies = loadAndHydrateStudies();
    const study = studies.find(s => s.id === id);
    if (!study) return null;

    const limits = calculateControlLimits(study);
    const hydratedSubgroups = evaluateWesternElectricRules(study.subgroups, limits, study.activeRules);
    const hydratedStudy = { ...study, subgroups: hydratedSubgroups };

    const capability = calculateCapabilityIndices(hydratedStudy, limits);
    const histogram = generateHistogramDistribution(hydratedSubgroups, study.usl, study.lsl);

    return {
      study: hydratedStudy,
      limits,
      capability,
      histogram
    };
  },

  // Save/Update Study
  saveStudy(study: SpcStudy): SpcStudy {
    const studies = loadAndHydrateStudies();
    const existingIdx = studies.findIndex(s => s.id === study.id);

    // Recompute limits and evaluate rules
    const limits = calculateControlLimits(study);
    const evaluatedSubgroups = evaluateWesternElectricRules(study.subgroups, limits, study.activeRules);
    const updated: SpcStudy = {
      ...study,
      subgroups: evaluatedSubgroups,
      updatedAt: new Date().toISOString()
    };

    if (existingIdx >= 0) {
      studies[existingIdx] = updated;
    } else {
      studies.unshift(updated);
    }

    localStorage.setItem(SPC_STUDIES_STORAGE_KEY, JSON.stringify(studies));
    return updated;
  },

  // Add new Subgroup to study
  addSubgroup(studyId: string, subgroupData: Omit<SubgroupSample, 'id' | 'violations' | 'mean' | 'range' | 'stdDev'>): {
    updatedStudy: SpcStudy;
    newAlerts: SpcOocAlert[];
  } {
    const studies = loadAndHydrateStudies();
    const studyIdx = studies.findIndex(s => s.id === studyId);
    if (studyIdx === -1) throw new Error('Study not found');

    const study = studies[studyIdx];
    const n = study.subgroupSize || 5;

    // Calculate sample stats
    let mean = 0;
    let range = 0;
    let stdDev = 0;
    let movingRange: number | undefined = undefined;

    if (subgroupData.measurements && subgroupData.measurements.length > 0) {
      const vals = subgroupData.measurements;
      mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      range = Math.max(...vals) - Math.min(...vals);
      const sumSq = vals.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0);
      stdDev = Math.sqrt(sumSq / (vals.length > 1 ? vals.length - 1 : 1));
    } else if (study.chartType === 'p_chart') {
      const defectives = subgroupData.defectivesCount ?? 0;
      const total = subgroupData.totalInspected ?? n;
      mean = total > 0 ? defectives / total : 0;
    } else if (study.chartType === 'c_chart') {
      mean = subgroupData.defectsCount ?? 0;
    }

    if (study.chartType === 'I_MR' && study.subgroups.length > 0) {
      const lastVal = study.subgroups[study.subgroups.length - 1].measurements[0] ?? study.subgroups[study.subgroups.length - 1].mean;
      const thisVal = subgroupData.measurements[0] ?? mean;
      movingRange = Math.abs(thisVal - lastVal);
    }

    const newSubgroup: SubgroupSample = {
      ...subgroupData,
      id: `sg-${Date.now()}`,
      subgroupNumber: study.subgroups.length + 1,
      timestamp: subgroupData.timestamp || new Date().toISOString(),
      sampleSize: subgroupData.measurements?.length || n,
      mean: Number(mean.toFixed(4)),
      range: Number(range.toFixed(4)),
      stdDev: Number(stdDev.toFixed(4)),
      movingRange,
      violations: []
    };

    const newSubgroupsList = [...study.subgroups, newSubgroup];
    const limits = calculateControlLimits({ ...study, subgroups: newSubgroupsList });
    const evaluated = evaluateWesternElectricRules(newSubgroupsList, limits, study.activeRules);

    const latestEvaluated = evaluated[evaluated.length - 1];
    const newAlerts: SpcOocAlert[] = [];

    if (latestEvaluated.violations && latestEvaluated.violations.length > 0) {
      const existingAlerts = loadAlerts();
      latestEvaluated.violations.forEach(v => {
        const alert: SpcOocAlert = {
          id: `alt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          studyId: study.id,
          studyName: study.studyName,
          characteristicName: study.characteristicName,
          timestamp: newSubgroup.timestamp,
          subgroupNumber: newSubgroup.subgroupNumber,
          ruleId: v.ruleId,
          ruleName: v.ruleName,
          description: v.description,
          observedValue: v.value,
          severity: v.severity,
          status: 'active',
          acknowledged: false
        };
        newAlerts.push(alert);
        existingAlerts.unshift(alert);
      });
      localStorage.setItem(SPC_ALERTS_STORAGE_KEY, JSON.stringify(existingAlerts));
    }

    const updatedStudy: SpcStudy = {
      ...study,
      subgroups: evaluated,
      updatedAt: new Date().toISOString()
    };

    studies[studyIdx] = updatedStudy;
    localStorage.setItem(SPC_STUDIES_STORAGE_KEY, JSON.stringify(studies));

    return { updatedStudy, newAlerts };
  },

  // Simulate Next Subgroup (for live demonstration of process drift & Western Electric rule detection)
  simulateNextSubgroup(studyId: string, driftOption: 'normal' | 'upward_drift' | 'downward_drift' | 'outlier'): {
    updatedStudy: SpcStudy;
    newAlerts: SpcOocAlert[];
  } {
    const studies = loadAndHydrateStudies();
    const study = studies.find(s => s.id === studyId);
    if (!study) throw new Error('Study not found');

    const lastSubgroup = study.subgroups[study.subgroups.length - 1];
    const prevMean = lastSubgroup ? lastSubgroup.mean : study.nominalValue;
    const stdDevEst = (study.usl - study.lsl) / 12 || 0.005;

    let targetCenter = study.nominalValue;
    if (driftOption === 'normal') {
      targetCenter = study.nominalValue + (Math.random() - 0.5) * stdDevEst;
    } else if (driftOption === 'upward_drift') {
      targetCenter = prevMean + stdDevEst * 0.7; // steadily increasing
    } else if (driftOption === 'downward_drift') {
      targetCenter = prevMean - stdDevEst * 0.7; // steadily decreasing
    } else if (driftOption === 'outlier') {
      targetCenter = study.usl + stdDevEst * 1.5; // spikes above UCL!
    }

    // Generate random measurements around targetCenter
    const n = study.subgroupSize || 5;
    const measurements: number[] = [];
    for (let i = 0; i < n; i++) {
      const noise = (Math.random() - 0.5) * stdDevEst * 1.8;
      measurements.push(Number((targetCenter + noise).toFixed(3)));
    }

    const operatorNames = ['Alex Rivera', 'Elena Rostova', 'Marcus Vance', 'Sarah Jenkins'];
    const randomOp = operatorNames[Math.floor(Math.random() * operatorNames.length)];

    return this.addSubgroup(studyId, {
      subgroupNumber: study.subgroups.length + 1,
      timestamp: new Date().toISOString(),
      batchOrLotNumber: `LOT-SIM-${study.subgroups.length + 1}`,
      operatorName: randomOp,
      machineId: 'CNC-HAAS-01',
      measurements,
      sampleSize: n,
      notes: `Simulated subgroup (${driftOption} profile)`
    });
  },

  // Get alerts feed
  getAlerts(): SpcOocAlert[] {
    return loadAlerts();
  },

  // Acknowledge alert and log corrective action / root cause
  acknowledgeAlert(
    alertId: string,
    acknowledgedBy: string,
    rootCause?: string,
    correctiveAction?: string
  ): SpcOocAlert {
    const alerts = loadAlerts();
    const idx = alerts.findIndex(a => a.id === alertId);
    if (idx === -1) throw new Error('Alert not found');

    alerts[idx] = {
      ...alerts[idx],
      acknowledged: true,
      acknowledgedBy,
      acknowledgedAt: new Date().toISOString(),
      rootCause: rootCause || alerts[idx].rootCause || 'Investigated by quality engineer',
      correctiveAction: correctiveAction || alerts[idx].correctiveAction || 'Machine re-verified',
      status: 'resolved'
    };

    localStorage.setItem(SPC_ALERTS_STORAGE_KEY, JSON.stringify(alerts));
    return alerts[idx];
  },

  // Get KPI Summary
  getKpiSummary(): SpcKpiSummary {
    const studies = loadAndHydrateStudies();
    const alerts = loadAlerts();

    let totalCpk = 0;
    let studiesWithCpk = 0;
    let inControlCount = 0;
    let totalSubgroups = 0;

    studies.forEach(s => {
      totalSubgroups += s.subgroups.length;
      const limits = calculateControlLimits(s);
      const cap = calculateCapabilityIndices(s, limits);
      if (cap.cpk > 0) {
        totalCpk += cap.cpk;
        studiesWithCpk++;
      }
      // Check if last subgroup had no critical violations
      const last = s.subgroups[s.subgroups.length - 1];
      const hasCritical = last?.violations.some(v => v.severity === 'critical');
      if (!hasCritical) inControlCount++;
    });

    const activeAlerts = alerts.filter(a => !a.acknowledged);
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');

    return {
      totalStudies: studies.length,
      inControlStudiesCount: inControlCount,
      averageCpk: studiesWithCpk > 0 ? Number((totalCpk / studiesWithCpk).toFixed(2)) : 0,
      activeAlertsCount: activeAlerts.length,
      criticalAlertsCount: criticalAlerts.length,
      totalSubgroupsLogged: totalSubgroups
    };
  },

  // Export Study to CSV
  exportStudyCsv(studyId: string): string {
    const hydrated = this.getStudyById(studyId);
    if (!hydrated) return '';

    const { study, limits, capability } = hydrated;
    const rows = [
      ['SPC CONTROL STUDY REPORT'],
      ['Study Name', study.studyName],
      ['Part SKU', study.partNumber],
      ['Part Name', study.partName],
      ['Operation', `${study.operationCode} - ${study.operationName}`],
      ['Characteristic', study.characteristicName],
      ['Chart Type', study.chartType],
      ['Subgroup Size (n)', study.subgroupSize],
      ['USL', study.usl],
      ['Nominal', study.nominalValue],
      ['LSL', study.lsl],
      ['Centerline (CL)', limits.centerLine],
      ['UCL (+3s)', limits.ucl],
      ['LCL (-3s)', limits.lcl],
      ['Cp', capability.cp],
      ['Cpk', capability.cpk],
      ['Pp', capability.pp],
      ['Ppk', capability.ppk],
      ['Est. PPM Defect Rate', capability.ppmDefectiveEst],
      [],
      ['Subgroup #', 'Timestamp', 'Lot/Batch', 'Operator', 'Machine', 'Mean / Value', 'Range / MR', 'Std Dev', 'Measurements', 'Rule Violations']
    ];

    study.subgroups.forEach(sg => {
      const violationsStr = sg.violations.map(v => v.ruleName).join('; ');
      rows.push([
        sg.subgroupNumber.toString(),
        sg.timestamp,
        sg.batchOrLotNumber,
        sg.operatorName,
        sg.machineId,
        sg.mean.toString(),
        sg.range.toString(),
        sg.stdDev.toString(),
        (sg.measurements || []).join(' | '),
        violationsStr
      ]);
    });

    return rows.map(r => r.map(cell => `"${cell}"`).join(',')).join('\n');
  }
};
