// src/components/spc/SpcControlChartViewer.tsx

import React, { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Info,
  Maximize2,
  Eye,
  Sliders,
  Sparkles,
  Layers,
  ShieldCheck,
  ShieldAlert,
  Clock,
  User,
  Activity
} from 'lucide-react';
import {
  SpcStudy,
  ControlLimits,
  SubgroupSample,
  RuleViolation
} from '../../types/spc';

interface SpcControlChartViewerProps {
  study: SpcStudy;
  limits: ControlLimits;
  subgroups: SubgroupSample[];
  showZones: boolean;
  onToggleZones: () => void;
  subgroupWindow: 'all' | 'last_20' | 'last_30';
  onChangeWindow: (win: 'all' | 'last_20' | 'last_30') => void;
}

export const SpcControlChartViewer: React.FC<SpcControlChartViewerProps> = ({
  study,
  limits,
  subgroups,
  showZones,
  onToggleZones,
  subgroupWindow,
  onChangeWindow
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const isVariable = study.chartType === 'XBar_R' || study.chartType === 'I_MR' || study.chartType === 'XBar_S';
  const hasSecondaryChart = isVariable;

  // Chart Dimensions
  const chartWidth = 900;
  const upperHeight = 270;
  const lowerHeight = 150;
  const padLeft = 65;
  const padRight = 85;
  const padTop = 30;
  const padBottom = 35;

  const innerW = chartWidth - padLeft - padRight;
  const upperInnerH = upperHeight - padTop - padBottom;
  const lowerInnerH = lowerHeight - padTop - padBottom;

  const totalPoints = subgroups.length;
  const stepX = totalPoints > 1 ? innerW / (totalPoints - 1) : innerW / 2;

  const getX = (idx: number) => padLeft + (totalPoints > 1 ? idx * stepX : innerW / 2);

  // Upper Chart Y Scale:
  // Points values:
  const getPrimaryVal = (s: SubgroupSample) => {
    if (study.chartType === 'I_MR') return s.measurements[0] ?? s.mean;
    if (study.chartType === 'p_chart') return s.fractionDefective ?? (s.defectivesCount ?? 0) / (s.totalInspected || 1);
    if (study.chartType === 'c_chart') return s.defectsCount ?? 0;
    if (study.chartType === 'u_chart') return s.defectsPerUnit ?? (s.defectsCount ?? 0) / (s.totalInspected || 1);
    return s.mean;
  };

  const primaryValues = subgroups.map(getPrimaryVal);
  const allYRef = [
    limits.ucl,
    limits.lcl,
    limits.centerLine,
    ...primaryValues,
    ...(study.usl !== undefined && !isNaN(study.usl) ? [study.usl] : []),
    ...(study.lsl !== undefined && !isNaN(study.lsl) ? [study.lsl] : [])
  ];

  const yMin = Math.min(...allYRef);
  const yMax = Math.max(...allYRef);
  const yBuffer = (yMax - yMin) * 0.12 || 0.005;
  const finalYMin = yMin - yBuffer;
  const finalYMax = yMax + yBuffer;
  const yRange = finalYMax - finalYMin || 1;

  const getUpperY = (val: number) => {
    const norm = (val - finalYMin) / yRange;
    return padTop + upperInnerH - norm * upperInnerH;
  };

  // Lower Chart Y Scale (Range R, Moving Range MR, or S)
  const getSecondaryVal = (s: SubgroupSample) => {
    if (study.chartType === 'I_MR') return s.movingRange ?? 0;
    if (study.chartType === 'XBar_S') return s.stdDev ?? 0;
    return s.range ?? 0;
  };

  const secondaryValues = subgroups.map(getSecondaryVal);
  const secUcl = limits.secondaryUcl ?? Math.max(...secondaryValues, 1);
  const secLcl = limits.secondaryLcl ?? 0;
  const secCl = limits.secondaryCenterLine ?? (secUcl + secLcl) / 2;

  const secMin = Math.min(secLcl, ...secondaryValues, 0);
  const secMax = Math.max(secUcl, ...secondaryValues) * 1.15 || 1;
  const secRange = secMax - secMin || 1;

  const getLowerY = (val: number) => {
    const norm = (val - secMin) / secRange;
    return padTop + lowerInnerH - norm * lowerInnerH;
  };

  // Build Polylines
  const upperLineCoords = subgroups.map((s, idx) => `${getX(idx)},${getUpperY(getPrimaryVal(s))}`).join(' ');
  const lowerLineCoords = subgroups.map((s, idx) => `${getX(idx)},${getLowerY(getSecondaryVal(s))}`).join(' ');

  const hoveredSample = hoveredIndex !== null ? subgroups[hoveredIndex] : null;

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-xl flex flex-col gap-5 text-slate-100">
      
      {/* Chart Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">{study.studyName}</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {study.chartType === 'XBar_R' && 'X̄ & R Chart'}
                {study.chartType === 'I_MR' && 'I-MR (Individual & Moving Range)'}
                {study.chartType === 'XBar_S' && 'X̄ & S Chart'}
                {study.chartType === 'p_chart' && 'p-Chart (Defect Rate)'}
                {study.chartType === 'c_chart' && 'c-Chart (Defect Count)'}
                {study.chartType === 'u_chart' && 'u-Chart (Defects / Unit)'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {study.partNumber} &bull; {study.characteristicName} &bull; Spec: [{study.lsl} to {study.usl} {study.unit}]
            </p>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onToggleZones}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              showZones
                ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {showZones ? 'Hide Zones A/B/C' : 'Show Zones A/B/C'}
          </button>

          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => onChangeWindow('all')}
              className={`px-2.5 py-1 rounded-md transition ${
                subgroupWindow === 'all' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({study.subgroups.length})
            </button>
            <button
              onClick={() => onChangeWindow('last_30')}
              className={`px-2.5 py-1 rounded-md transition ${
                subgroupWindow === 'last_30' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Last 30
            </button>
            <button
              onClick={() => onChangeWindow('last_20')}
              className={`px-2.5 py-1 rounded-md transition ${
                subgroupWindow === 'last_20' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Last 20
            </button>
          </div>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full overflow-x-auto bg-slate-950/60 rounded-xl border border-slate-800/80 p-2">
        <svg
          viewBox={`0 0 ${chartWidth} ${hasSecondaryChart ? upperHeight + lowerHeight + 15 : upperHeight}`}
          className="w-full h-auto min-w-[760px] select-none font-sans"
        >
          <defs>
            {/* Gradients for Zone Bands */}
            <linearGradient id="zoneAGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.04" />
            </linearGradient>
            <linearGradient id="zoneBGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.03" />
            </linearGradient>
            <linearGradient id="zoneCGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.09" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* ============================================================== */}
          {/* UPPER CHART (X-bar, Individual, p, c, u) */}
          {/* ============================================================== */}
          <g>
            {/* Chart Title */}
            <text x={padLeft} y={20} fill="#94a3b8" fontSize="11" fontWeight="bold">
              {study.chartType === 'XBar_R' && 'X̄ CHART (Subgroup Averages)'}
              {study.chartType === 'I_MR' && 'INDIVIDUALS (X) CHART'}
              {study.chartType === 'XBar_S' && 'X̄ CHART (Subgroup Averages)'}
              {study.chartType === 'p_chart' && 'p-CHART (Fraction Nonconforming)'}
              {study.chartType === 'c_chart' && 'c-CHART (Nonconformities Count)'}
              {study.chartType === 'u_chart' && 'u-CHART (Defects Per Unit)'}
            </text>

            {/* Background gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const yPos = padTop + pct * upperInnerH;
              return (
                <line
                  key={`ugrid-${idx}`}
                  x1={padLeft}
                  y1={yPos}
                  x2={padLeft + innerW}
                  y2={yPos}
                  stroke="#334155"
                  strokeWidth="0.5"
                  strokeDasharray="3 3"
                />
              );
            })}

            {/* Shaded Western Electric Zones if enabled */}
            {showZones && (
              <>
                {/* Upper Zone A (between +2s and UCL) */}
                <rect
                  x={padLeft}
                  y={getUpperY(limits.ucl)}
                  width={innerW}
                  height={Math.max(0, getUpperY(limits.plus2Sigma) - getUpperY(limits.ucl))}
                  fill="url(#zoneAGrad)"
                />
                {/* Upper Zone B (between +1s and +2s) */}
                <rect
                  x={padLeft}
                  y={getUpperY(limits.plus2Sigma)}
                  width={innerW}
                  height={Math.max(0, getUpperY(limits.plus1Sigma) - getUpperY(limits.plus2Sigma))}
                  fill="url(#zoneBGrad)"
                />
                {/* Zone C (between -1s and +1s) */}
                <rect
                  x={padLeft}
                  y={getUpperY(limits.plus1Sigma)}
                  width={innerW}
                  height={Math.max(0, getUpperY(limits.minus1Sigma) - getUpperY(limits.plus1Sigma))}
                  fill="url(#zoneCGrad)"
                />
                {/* Lower Zone B (between -2s and -1s) */}
                <rect
                  x={padLeft}
                  y={getUpperY(limits.minus1Sigma)}
                  width={innerW}
                  height={Math.max(0, getUpperY(limits.minus2Sigma) - getUpperY(limits.minus1Sigma))}
                  fill="url(#zoneBGrad)"
                />
                {/* Lower Zone A (between LCL and -2s) */}
                <rect
                  x={padLeft}
                  y={getUpperY(limits.minus2Sigma)}
                  width={innerW}
                  height={Math.max(0, getUpperY(limits.lcl) - getUpperY(limits.minus2Sigma))}
                  fill="url(#zoneAGrad)"
                />
              </>
            )}

            {/* USL Specification Line */}
            {study.usl !== undefined && (
              <g>
                <line
                  x1={padLeft}
                  y1={getUpperY(study.usl)}
                  x2={padLeft + innerW}
                  y2={getUpperY(study.usl)}
                  stroke="#ef4444"
                  strokeWidth="1.2"
                  strokeDasharray="5 3"
                />
                <text x={padLeft + innerW + 6} y={getUpperY(study.usl) + 3} fill="#ef4444" fontSize="9" fontWeight="bold">
                  USL: {study.usl}
                </text>
              </g>
            )}

            {/* UCL Line (+3 sigma) */}
            <g>
              <line
                x1={padLeft}
                y1={getUpperY(limits.ucl)}
                x2={padLeft + innerW}
                y2={getUpperY(limits.ucl)}
                stroke="#f97316"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              <text x={padLeft + innerW + 6} y={getUpperY(limits.ucl) + 3} fill="#f97316" fontSize="9" fontWeight="bold">
                UCL: {limits.ucl}
              </text>
            </g>

            {/* +2 Sigma / +1 Sigma faint zone lines */}
            {showZones && (
              <>
                <line
                  x1={padLeft}
                  y1={getUpperY(limits.plus2Sigma)}
                  x2={padLeft + innerW}
                  y2={getUpperY(limits.plus2Sigma)}
                  stroke="#eab308"
                  strokeWidth="0.8"
                  strokeDasharray="2 4"
                  strokeOpacity="0.7"
                />
                <text x={padLeft + innerW + 6} y={getUpperY(limits.plus2Sigma) + 3} fill="#eab308" fontSize="8">
                  +2σ: {limits.plus2Sigma}
                </text>

                <line
                  x1={padLeft}
                  y1={getUpperY(limits.plus1Sigma)}
                  x2={padLeft + innerW}
                  y2={getUpperY(limits.plus1Sigma)}
                  stroke="#60a5fa"
                  strokeWidth="0.8"
                  strokeDasharray="2 4"
                  strokeOpacity="0.7"
                />
                <text x={padLeft + innerW + 6} y={getUpperY(limits.plus1Sigma) + 3} fill="#60a5fa" fontSize="8">
                  +1σ: {limits.plus1Sigma}
                </text>
              </>
            )}

            {/* Center Line (CL) */}
            <g>
              <line
                x1={padLeft}
                y1={getUpperY(limits.centerLine)}
                x2={padLeft + innerW}
                y2={getUpperY(limits.centerLine)}
                stroke="#10b981"
                strokeWidth="1.8"
              />
              <text x={padLeft + innerW + 6} y={getUpperY(limits.centerLine) + 3} fill="#10b981" fontSize="9" fontWeight="bold">
                CL: {limits.centerLine}
              </text>
            </g>

            {/* -1 Sigma / -2 Sigma faint zone lines */}
            {showZones && (
              <>
                <line
                  x1={padLeft}
                  y1={getUpperY(limits.minus1Sigma)}
                  x2={padLeft + innerW}
                  y2={getUpperY(limits.minus1Sigma)}
                  stroke="#60a5fa"
                  strokeWidth="0.8"
                  strokeDasharray="2 4"
                  strokeOpacity="0.7"
                />
                <text x={padLeft + innerW + 6} y={getUpperY(limits.minus1Sigma) + 3} fill="#60a5fa" fontSize="8">
                  -1σ: {limits.minus1Sigma}
                </text>

                <line
                  x1={padLeft}
                  y1={getUpperY(limits.minus2Sigma)}
                  x2={padLeft + innerW}
                  y2={getUpperY(limits.minus2Sigma)}
                  stroke="#eab308"
                  strokeWidth="0.8"
                  strokeDasharray="2 4"
                  strokeOpacity="0.7"
                />
                <text x={padLeft + innerW + 6} y={getUpperY(limits.minus2Sigma) + 3} fill="#eab308" fontSize="8">
                  -2σ: {limits.minus2Sigma}
                </text>
              </>
            )}

            {/* LCL Line (-3 sigma) */}
            <g>
              <line
                x1={padLeft}
                y1={getUpperY(limits.lcl)}
                x2={padLeft + innerW}
                y2={getUpperY(limits.lcl)}
                stroke="#f97316"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              <text x={padLeft + innerW + 6} y={getUpperY(limits.lcl) + 3} fill="#f97316" fontSize="9" fontWeight="bold">
                LCL: {limits.lcl}
              </text>
            </g>

            {/* LSL Specification Line */}
            {study.lsl !== undefined && (
              <g>
                <line
                  x1={padLeft}
                  y1={getUpperY(study.lsl)}
                  x2={padLeft + innerW}
                  y2={getUpperY(study.lsl)}
                  stroke="#ef4444"
                  strokeWidth="1.2"
                  strokeDasharray="5 3"
                />
                <text x={padLeft + innerW + 6} y={getUpperY(study.lsl) + 3} fill="#ef4444" fontSize="9" fontWeight="bold">
                  LSL: {study.lsl}
                </text>
              </g>
            )}

            {/* Data Polyline */}
            <polyline
              points={upperLineCoords}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeLinejoin="round"
            />

            {/* Data Points */}
            {subgroups.map((s, idx) => {
              const xPos = getX(idx);
              const val = getPrimaryVal(s);
              const yPos = getUpperY(val);
              const hasViolation = s.violations && s.violations.length > 0;
              const isHovered = hoveredIndex === idx;

              const isCritical = s.violations.some(v => v.severity === 'critical');
              const isWarning = s.violations.some(v => v.severity === 'warning');

              let pointColor = '#38bdf8';
              if (isCritical) pointColor = '#ef4444';
              else if (isWarning) pointColor = '#f59e0b';

              return (
                <g
                  key={`upt-${idx}`}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="cursor-pointer"
                >
                  {/* Halo ring for out of control or hover */}
                  {(hasViolation || isHovered) && (
                    <circle
                      cx={xPos}
                      cy={yPos}
                      r={isHovered ? 10 : 7}
                      fill={pointColor}
                      fillOpacity={isHovered ? 0.35 : 0.25}
                      className={hasViolation ? 'animate-pulse' : ''}
                    />
                  )}

                  {/* Core dot */}
                  <circle
                    cx={xPos}
                    cy={yPos}
                    r={isHovered ? 5.5 : 3.8}
                    fill={pointColor}
                    stroke="#0f172a"
                    strokeWidth="1.5"
                  />

                  {/* Out of Control Warning Badge Icon */}
                  {hasViolation && (
                    <text
                      x={xPos}
                      y={yPos - 9}
                      textAnchor="middle"
                      fill="#ef4444"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      !
                    </text>
                  )}

                  {/* X Axis Subgroup Tick & Label */}
                  <line
                    x1={xPos}
                    y1={padTop + upperInnerH}
                    x2={xPos}
                    y2={padTop + upperInnerH + 4}
                    stroke="#475569"
                    strokeWidth="1"
                  />
                  {(idx === 0 || idx === subgroups.length - 1 || idx % 2 === 0) && (
                    <text
                      x={xPos}
                      y={padTop + upperInnerH + 16}
                      fill="#94a3b8"
                      fontSize="8"
                      textAnchor="middle"
                    >
                      #{s.subgroupNumber}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* ============================================================== */}
          {/* LOWER CHART (Range R or Moving Range MR or Std Dev S) */}
          {/* ============================================================== */}
          {hasSecondaryChart && (
            <g transform={`translate(0, ${upperHeight + 15})`}>
              {/* Lower Chart Title */}
              <text x={padLeft} y={15} fill="#94a3b8" fontSize="11" fontWeight="bold">
                {study.chartType === 'XBar_R' && 'R CHART (Subgroup Range: Max - Min)'}
                {study.chartType === 'I_MR' && 'MOVING RANGE (MR) CHART'}
                {study.chartType === 'XBar_S' && 'S CHART (Subgroup Standard Deviation)'}
              </text>

              {/* Lower Background Grid */}
              {[0, 0.5, 1].map((pct, idx) => {
                const yPos = padTop + pct * lowerInnerH;
                return (
                  <line
                    key={`lgrid-${idx}`}
                    x1={padLeft}
                    y1={yPos}
                    x2={padLeft + innerW}
                    y2={yPos}
                    stroke="#334155"
                    strokeWidth="0.5"
                    strokeDasharray="3 3"
                  />
                );
              })}

              {/* Secondary UCL */}
              <g>
                <line
                  x1={padLeft}
                  y1={getLowerY(secUcl)}
                  x2={padLeft + innerW}
                  y2={getLowerY(secUcl)}
                  stroke="#f97316"
                  strokeWidth="1.2"
                  strokeDasharray="4 2"
                />
                <text x={padLeft + innerW + 6} y={getLowerY(secUcl) + 3} fill="#f97316" fontSize="9" fontWeight="bold">
                  UCL: {secUcl}
                </text>
              </g>

              {/* Secondary CL */}
              <g>
                <line
                  x1={padLeft}
                  y1={getLowerY(secCl)}
                  x2={padLeft + innerW}
                  y2={getLowerY(secCl)}
                  stroke="#10b981"
                  strokeWidth="1.5"
                />
                <text x={padLeft + innerW + 6} y={getLowerY(secCl) + 3} fill="#10b981" fontSize="9" fontWeight="bold">
                  CL: {secCl}
                </text>
              </g>

              {/* Secondary LCL if > 0 */}
              {secLcl > 0 && (
                <g>
                  <line
                    x1={padLeft}
                    y1={getLowerY(secLcl)}
                    x2={padLeft + innerW}
                    y2={getLowerY(secLcl)}
                    stroke="#f97316"
                    strokeWidth="1.2"
                    strokeDasharray="4 2"
                  />
                  <text x={padLeft + innerW + 6} y={getLowerY(secLcl) + 3} fill="#f97316" fontSize="9" fontWeight="bold">
                    LCL: {secLcl}
                  </text>
                </g>
              )}

              {/* Secondary Polyline */}
              <polyline
                points={lowerLineCoords}
                fill="none"
                stroke="#a855f7"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />

              {/* Secondary Points */}
              {subgroups.map((s, idx) => {
                const xPos = getX(idx);
                const val = getSecondaryVal(s);
                const yPos = getLowerY(val);
                const isHovered = hoveredIndex === idx;

                return (
                  <circle
                    key={`lpt-${idx}`}
                    cx={xPos}
                    cy={yPos}
                    r={isHovered ? 5 : 3.2}
                    fill={isHovered ? '#c084fc' : '#a855f7'}
                    stroke="#0f172a"
                    strokeWidth="1.2"
                  />
                );
              })}
            </g>
          )}
        </svg>

        {/* Interactive Hover Tooltip Box */}
        {hoveredSample && (
          <div className="mt-3 p-3 bg-slate-900/90 border border-slate-700 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="px-2.5 py-1 bg-blue-500/20 text-blue-300 font-mono font-bold rounded-lg border border-blue-500/30">
                Subgroup #{hoveredSample.subgroupNumber}
              </div>
              <div className="flex items-center gap-1.5 text-slate-300 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {new Date(hoveredSample.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {hoveredSample.operatorName} ({hoveredSample.machineId})
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div>
                <span className="text-slate-400">Plotted Value: </span>
                <span className="font-mono font-bold text-white text-sm">
                  {getPrimaryVal(hoveredSample).toFixed(4)} {study.unit}
                </span>
              </div>

              {hasSecondaryChart && (
                <div>
                  <span className="text-slate-400">
                    {study.chartType === 'I_MR' ? 'MR: ' : study.chartType === 'XBar_S' ? 'StdDev: ' : 'Range: '}
                  </span>
                  <span className="font-mono font-bold text-purple-300">
                    {getSecondaryVal(hoveredSample).toFixed(4)} {study.unit}
                  </span>
                </div>
              )}

              {hoveredSample.measurements && hoveredSample.measurements.length > 0 && (
                <div className="hidden sm:flex items-center gap-1 font-mono text-[11px] text-slate-400">
                  <span>Samples:</span>
                  <span className="text-slate-300">[{hoveredSample.measurements.join(', ')}]</span>
                </div>
              )}
            </div>

            {/* Rule Violations on Hover */}
            {hoveredSample.violations && hoveredSample.violations.length > 0 && (
              <div className="w-full pt-2 border-t border-slate-800 flex flex-wrap gap-2 items-center">
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> Out of Control Triggered:
                </span>
                {hoveredSample.violations.map((v, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  >
                    {v.ruleName} &bull; {v.description}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chart Legend Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-1">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-red-500 inline-block border-dashed"></span>
            <span>USL / LSL (Specification)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-orange-500 inline-block border-dashed"></span>
            <span>UCL / LCL (±3σ Control Limits)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-500 inline-block"></span>
            <span>Centerline (Process Mean)</span>
          </div>
          {showZones && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-yellow-500/30 border border-yellow-500 inline-block"></span>
              <span>Zones A (2σ-3σ) &amp; B (1σ-2σ)</span>
            </div>
          )}
        </div>

        <div className="text-slate-400 font-mono text-[11px]">
          Sample Count: <strong className="text-white">{subgroups.length}</strong> &bull; Total Points: <strong className="text-white">{subgroups.reduce((a, b) => a + (b.measurements?.length || 1), 0)}</strong>
        </div>
      </div>

    </div>
  );
};
