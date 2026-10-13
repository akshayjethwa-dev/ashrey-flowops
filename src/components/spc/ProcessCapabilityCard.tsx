// src/components/spc/ProcessCapabilityCard.tsx

import React from 'react';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Percent,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';
import {
  ProcessCapabilityIndices,
  HistogramDistribution,
  SpcStudy
} from '../../types/spc';

interface ProcessCapabilityCardProps {
  capability: ProcessCapabilityIndices;
  histogram: HistogramDistribution;
  study: SpcStudy;
}

export const ProcessCapabilityCard: React.FC<ProcessCapabilityCardProps> = ({
  capability,
  histogram,
  study
}) => {
  const { cpk, cp, ppk, pp, centeringK, sigmaLevel, ppmDefectiveEst, status } = capability;

  // Status visual attributes
  const getStatusBadge = () => {
    switch (status) {
      case 'six_sigma':
        return {
          label: 'World Class (Cpk ≥ 1.67)',
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          desc: 'Virtually zero defect rate (< 1 PPM). Process variation is less than half the allowable tolerance band.'
        };
      case 'capable':
        return {
          label: 'Capable (1.33 ≤ Cpk < 1.67)',
          color: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          desc: 'Acceptable production stability. Defect rate well within standard industrial acceptance criteria.'
        };
      case 'marginally_capable':
        return {
          label: 'Marginally Capable (1.00 ≤ Cpk < 1.33)',
          color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          desc: 'Close monitoring required. Small process shifts or tool wear may lead to out-of-spec defects.'
        };
      case 'incapable':
      default:
        return {
          label: 'Incapable Process (Cpk < 1.00)',
          color: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          desc: 'High risk of non-conformances. Process spread exceeds allowable engineering tolerance limits.'
        };
    }
  };

  const statusInfo = getStatusBadge();

  // Histogram SVG Dimensions
  const svgWidth = 600;
  const svgHeight = 220;
  const padLeft = 45;
  const padRight = 45;
  const padTop = 25;
  const padBottom = 35;
  const innerW = svgWidth - padLeft - padRight;
  const innerH = svgHeight - padTop - padBottom;

  const maxFreq = Math.max(...histogram.bins.map(b => Math.max(b.actualCount, b.expectedCount)), 1);
  const xSpan = histogram.maxVal - histogram.minVal || 1;

  const getHistX = (val: number) => {
    const norm = (val - histogram.minVal) / xSpan;
    return padLeft + norm * innerW;
  };

  const getHistY = (count: number) => {
    const norm = count / (maxFreq * 1.15 || 1);
    return padTop + innerH - norm * innerH;
  };

  // Build Gaussian Bell Curve Polyline string
  const bellCurvePoints = histogram.normalCurvePoints
    .map(pt => `${getHistX(pt.x)},${getHistY(pt.y)}`)
    .join(' ');

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-xl flex flex-col gap-6 text-slate-100">
      
      {/* Header and Capability Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-bold text-white">Process Capability Analysis (Cp / Cpk / Pp / Ppk)</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Statistical potential vs overall machine performance based on {capability.totalMeasurements} samples
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-right">
            <span className="block text-[10px] text-slate-400 uppercase font-mono">Process Sigma Level</span>
            <span className="text-sm font-bold font-mono text-cyan-400">{sigmaLevel}σ</span>
          </div>
          <div className="px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-right">
            <span className="block text-[10px] text-slate-400 uppercase font-mono">Est. Defect Rate</span>
            <span className="text-sm font-bold font-mono text-amber-400">{ppmDefectiveEst.toLocaleString()} PPM</span>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics 4-Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Cpk */}
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Cpk (Centered)</span>
            <span className="text-[10px] font-mono">Min(Cpu, Cpl)</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono ${cpk >= 1.33 ? 'text-emerald-400' : cpk >= 1.0 ? 'text-amber-400' : 'text-rose-400'}`}>
              {cpk.toFixed(2)}
            </span>
            <span className="text-[11px] text-slate-400">
              {cpk >= 1.33 ? 'Passed' : 'Warning'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Short-term within capability</p>
        </div>

        {/* Cp */}
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Cp (Potential)</span>
            <span className="text-[10px] font-mono">Tol / 6σ</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {cp.toFixed(2)}
            </span>
            <span className="text-[11px] text-slate-400">Potential</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Tolerance spread capacity</p>
        </div>

        {/* Ppk */}
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Ppk (Performance)</span>
            <span className="text-[10px] font-mono">Overall s</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono ${ppk >= 1.33 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {ppk.toFixed(2)}
            </span>
            <span className="text-[11px] text-slate-400">Long-term</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Actual batch performance</p>
        </div>

        {/* Centering k */}
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Centering (k)</span>
            <span className="text-[10px] font-mono">Drift Index</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-cyan-400">
              {centeringK.toFixed(3)}
            </span>
            <span className="text-[11px] text-slate-400">
              {centeringK < 0.2 ? 'Centered' : 'Drifted'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Offset from nominal target</p>
        </div>
      </div>

      {/* Histogram & Normal Distribution Bell Curve */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Empirical Distribution vs Gaussian Bell Curve
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 bg-blue-500/40 border border-blue-400 rounded-sm inline-block"></span>
              <span>Sample Bins ({histogram.bins.length})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-400 inline-block"></span>
              <span>Normal Distribution (μ = {capability.mean}, σ = {capability.sigmaWithin})</span>
            </div>
          </div>
        </div>

        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto select-none font-sans">
          {/* USL Shaded Defect Tail Area (Right of USL) */}
          <rect
            x={getHistX(study.usl)}
            y={padTop}
            width={Math.max(0, padLeft + innerW - getHistX(study.usl))}
            height={innerH}
            fill="#ef4444"
            fillOpacity="0.08"
          />

          {/* LSL Shaded Defect Tail Area (Left of LSL) */}
          <rect
            x={padLeft}
            y={padTop}
            width={Math.max(0, getHistX(study.lsl) - padLeft)}
            height={innerH}
            fill="#ef4444"
            fillOpacity="0.08"
          />

          {/* Grid lines */}
          <line x1={padLeft} y1={padTop + innerH} x2={padLeft + innerW} y2={padTop + innerH} stroke="#334155" strokeWidth="1" />

          {/* Histogram Bins */}
          {histogram.bins.map((bin, i) => {
            const x = getHistX(bin.binStart);
            const w = Math.max(1, getHistX(bin.binEnd) - x - 1);
            const y = getHistY(bin.actualCount);
            const h = padTop + innerH - y;

            return (
              <g key={`bin-${i}`}>
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill="#38bdf8"
                  fillOpacity="0.35"
                  stroke="#38bdf8"
                  strokeWidth="0.8"
                  rx="1"
                />
                {bin.actualCount > 0 && (
                  <text
                    x={x + w / 2}
                    y={y - 3}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="8"
                  >
                    {bin.actualCount}
                  </text>
                )}
              </g>
            );
          })}

          {/* Theoretical Gaussian Normal Bell Curve */}
          <polyline
            points={bellCurvePoints}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* LSL Marker */}
          <g>
            <line
              x1={getHistX(study.lsl)}
              y1={padTop - 5}
              x2={getHistX(study.lsl)}
              y2={padTop + innerH}
              stroke="#ef4444"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            <text x={getHistX(study.lsl)} y={padTop - 8} textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="bold">
              LSL ({study.lsl})
            </text>
          </g>

          {/* USL Marker */}
          <g>
            <line
              x1={getHistX(study.usl)}
              y1={padTop - 5}
              x2={getHistX(study.usl)}
              y2={padTop + innerH}
              stroke="#ef4444"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            <text x={getHistX(study.usl)} y={padTop - 8} textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="bold">
              USL ({study.usl})
            </text>
          </g>

          {/* Mean μ Marker */}
          <g>
            <line
              x1={getHistX(capability.mean)}
              y1={padTop}
              x2={getHistX(capability.mean)}
              y2={padTop + innerH}
              stroke="#10b981"
              strokeWidth="1.8"
            />
            <text x={getHistX(capability.mean)} y={padTop + innerH + 16} textAnchor="middle" fill="#10b981" fontSize="9" fontWeight="bold">
              μ: {capability.mean}
            </text>
          </g>

          {/* Nominal Target Marker */}
          {study.nominalValue !== undefined && Math.abs(study.nominalValue - capability.mean) > 0.001 && (
            <g>
              <line
                x1={getHistX(study.nominalValue)}
                y1={padTop}
                x2={getHistX(study.nominalValue)}
                y2={padTop + innerH}
                stroke="#60a5fa"
                strokeWidth="1.2"
                strokeDasharray="2 2"
              />
              <text x={getHistX(study.nominalValue)} y={padTop + innerH + 16} textAnchor="middle" fill="#60a5fa" fontSize="8">
                Nominal ({study.nominalValue})
              </text>
            </g>
          )}
        </svg>

        <p className="text-[11px] text-slate-400 mt-2 text-center">
          {statusInfo.desc}
        </p>
      </div>

    </div>
  );
};
