// src/components/ipqc/Part3DMarkingViewer.tsx

import React, { useState } from 'react';
import {
  Rotate3d,
  Layers,
  Camera,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  Pin,
  Plus,
  Crosshair,
  Eye,
  Info
} from 'lucide-react';
import { Part3DMarker, PartModelType, ViewPerspective } from '../../types/ipqc';

interface Part3DMarkingViewerProps {
  modelType: PartModelType;
  partName: string;
  partNumber: string;
  markers: Part3DMarker[];
  activeMarkerId?: string;
  onSelectMarker: (marker: Part3DMarker) => void;
  onAddMarkerAtCoordinate?: (coord: { x: number; y: number; viewPerspective: ViewPerspective }) => void;
  readOnly?: boolean;
}

export const Part3DMarkingViewer: React.FC<Part3DMarkingViewerProps> = ({
  modelType,
  partName,
  partNumber,
  markers,
  activeMarkerId,
  onSelectMarker,
  onAddMarkerAtCoordinate,
  readOnly = false
}) => {
  const [perspective, setPerspective] = useState<ViewPerspective>('isometric');
  const [rotationAngle, setRotationAngle] = useState<number>(25);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isCrosshairActive, setIsCrosshairActive] = useState<boolean>(false);

  // Handle canvas click to place a new 3D marker
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (readOnly || !onAddMarkerAtCoordinate) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const yPct = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    onAddMarkerAtCoordinate({
      x: Math.max(5, Math.min(95, xPct)),
      y: Math.max(5, Math.min(95, yPct)),
      viewPerspective: perspective
    });
    setIsCrosshairActive(false);
  };

  // Render CAD model wireframe based on modelType & perspective
  const renderCadModelGeometry = () => {
    switch (modelType) {
      case 'gear_shaft':
        return (
          <g transform={`rotate(${rotationAngle * 0.15} 250 175)`}>
            {/* Base Shaft cylinder */}
            <defs>
              <linearGradient id="shaftGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="50%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
            </defs>
            {/* Step 1: Left turned journal */}
            <rect x="50" y="140" width="80" height="70" fill="url(#shaftGrad)" stroke="#38bdf8" strokeWidth="1.5" rx="3" />
            <line x1="130" y1="140" x2="130" y2="210" stroke="#0284c7" strokeWidth="2" />
            {/* Step 2: Center bearing seat */}
            <rect x="130" y="125" width="160" height="100" fill="url(#shaftGrad)" stroke="#38bdf8" strokeWidth="2" rx="4" />
            {/* Keyway slot */}
            <rect x="180" y="150" width="60" height="20" fill="#0f172a" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3,2" rx="2" />
            <text x="185" y="165" fill="#fda4af" fontSize="9" fontFamily="monospace" fontWeight="bold">KEYWAY</text>
            {/* Step 3: Right spline journal */}
            <rect x="290" y="135" width="140" height="80" fill="url(#shaftGrad)" stroke="#38bdf8" strokeWidth="1.5" rx="3" />
            {/* Spline grooves */}
            <line x1="330" y1="135" x2="330" y2="215" stroke="#64748b" strokeWidth="1" strokeDasharray="2,2" />
            <line x1="370" y1="135" x2="370" y2="215" stroke="#64748b" strokeWidth="1" strokeDasharray="2,2" />
            <line x1="410" y1="135" x2="410" y2="215" stroke="#64748b" strokeWidth="1" strokeDasharray="2,2" />
            {/* Center line */}
            <line x1="30" y1="175" x2="450" y2="175" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="6,4" opacity="0.6" />
          </g>
        );

      case 'machined_housing':
        return (
          <g transform={`rotate(${rotationAngle * 0.1} 250 175)`}>
            <defs>
              <linearGradient id="housingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="50%" stopColor="#334155" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
            </defs>
            <rect x="80" y="70" width="340" height="210" fill="url(#housingGrad)" stroke="#38bdf8" strokeWidth="2" rx="12" />
            {/* Center Line Bore */}
            <circle cx="250" cy="175" r="65" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
            <circle cx="250" cy="175" r="45" fill="#020617" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="4,2" />
            {/* Bolt pitch circle */}
            <circle cx="250" cy="175" r="85" fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="5,5" />
            <circle cx="165" cy="175" r="6" fill="#38bdf8" />
            <circle cx="335" cy="175" r="6" fill="#38bdf8" />
            <circle cx="250" cy="90" r="6" fill="#38bdf8" />
            <circle cx="250" cy="260" r="6" fill="#38bdf8" />
            {/* Machined top mounting face */}
            <line x1="80" y1="95" x2="420" y2="95" stroke="#0ea5e9" strokeWidth="1.5" />
          </g>
        );

      case 'flange_valve':
      default:
        return (
          <g transform={`rotate(${rotationAngle * 0.2} 250 175)`}>
            <defs>
              <linearGradient id="flangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="50%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
            </defs>
            {/* Outer Flange Rim (Isometric Ellipse) */}
            <ellipse cx="250" cy="175" rx="170" ry="85" fill="url(#flangeGrad)" stroke="#38bdf8" strokeWidth="2.5" />
            {/* Flange Web Depth */}
            <path d="M 80 175 C 80 230 420 230 420 175 L 420 195 C 420 250 80 250 80 195 Z" fill="#1e293b" stroke="#0284c7" strokeWidth="2" />
            {/* Raised Face for O-Ring */}
            <ellipse cx="250" cy="175" rx="115" ry="58" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,2" />
            {/* Internal Precision Bore */}
            <ellipse cx="250" cy="175" rx="60" ry="30" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
            {/* 4 Bolt Holes around PCD */}
            <ellipse cx="140" cy="175" rx="8" ry="4" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
            <ellipse cx="360" cy="175" rx="8" ry="4" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
            <ellipse cx="250" cy="125" rx="8" ry="4" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
            <ellipse cx="250" cy="225" rx="8" ry="4" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
            {/* Crosshair coordinate axes */}
            <line x1="250" y1="70" x2="250" y2="280" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="5,3" opacity="0.4" />
            <line x1="60" y1="175" x2="440" y2="175" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="5,3" opacity="0.4" />
          </g>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
      
      {/* Top 3D Control Bar */}
      <div className="px-4 py-3 bg-slate-800/90 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Rotate3d className="w-5 h-5 text-blue-400" />
          <div>
            <span className="text-xs font-bold text-white block">
              3D CAD Surface Quality Map
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {partName} ({partNumber})
            </span>
          </div>
        </div>

        {/* Perspective Toggles */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setPerspective('isometric')}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition ${
              perspective === 'isometric'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Isometric
          </button>
          <button
            type="button"
            onClick={() => setPerspective('front')}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition ${
              perspective === 'front'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Front View
          </button>
          <button
            type="button"
            onClick={() => setPerspective('top')}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition ${
              perspective === 'top'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Top View
          </button>
          <button
            type="button"
            onClick={() => setPerspective('cross_section')}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition ${
              perspective === 'cross_section'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Section A-A
          </button>
        </div>

        {/* View Adjustments (Orbit rotation, Zoom, Drop Pin) */}
        <div className="flex items-center gap-2">
          {!readOnly && (
            <button
              type="button"
              onClick={() => setIsCrosshairActive(!isCrosshairActive)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition ${
                isCrosshairActive
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700'
              }`}
              title="Click on part surface to drop a 3D inspection pin"
            >
              <Pin className="w-3.5 h-3.5" />
              {isCrosshairActive ? 'Click Part Surface...' : 'Mark Pin Point'}
            </button>
          )}

          <div className="flex items-center gap-1 bg-slate-950/80 px-2 py-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setRotationAngle(prev => (prev - 15) % 360)}
              className="p-1 text-slate-400 hover:text-white transition"
              title="Rotate Left"
            >
              ↺
            </button>
            <span className="text-[10px] text-slate-400 font-mono w-7 text-center">
              {rotationAngle}°
            </span>
            <button
              type="button"
              onClick={() => setRotationAngle(prev => (prev + 15) % 360)}
              className="p-1 text-slate-400 hover:text-white transition"
              title="Rotate Right"
            >
              ↻
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-950/80 px-2 py-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.max(0.7, prev - 0.1))}
              className="p-1 text-slate-400 hover:text-white transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[10px] text-slate-400 font-mono">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.min(1.5, prev + 0.1))}
              className="p-1 text-slate-400 hover:text-white transition"
              title="Zoom In"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 3D Canvas Area */}
      <div className="relative w-full h-80 sm:h-96 bg-slate-950 overflow-hidden flex items-center justify-center select-none">
        
        {/* Engineering Grid Background */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        {/* CAD Vector SVG Wireframe with Scale Transform */}
        <svg
          viewBox="0 0 500 350"
          className={`w-full h-full max-w-full max-h-full transition-transform duration-200 ${
            isCrosshairActive ? 'cursor-crosshair' : 'cursor-default'
          }`}
          style={{ transform: `scale(${zoomLevel})` }}
          onClick={handleCanvasClick}
        >
          {renderCadModelGeometry()}

          {/* Interactive 3D Marker Pins */}
          {markers.map((marker) => {
            const isSelected = marker.id === activeMarkerId;
            const isOutOfSpec = marker.status === 'out_of_spec';
            const isDefect = marker.status === 'defect_flagged';
            const isInSpec = marker.status === 'in_spec';

            const pinColor = isOutOfSpec
              ? '#ef4444' // Rose
              : isDefect
              ? '#f59e0b' // Amber
              : isInSpec
              ? '#10b981' // Emerald
              : '#38bdf8'; // Sky

            // Transform percentage coordinate (0-100) to SVG viewbox (500x350)
            const cx = (marker.x / 100) * 500;
            const cy = (marker.y / 100) * 350;

            return (
              <g
                key={marker.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMarker(marker);
                }}
                className="cursor-pointer group"
              >
                {/* Ping animation ripple for selected or defect markers */}
                {(isSelected || isOutOfSpec) && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 18 : 14}
                    fill="none"
                    stroke={pinColor}
                    strokeWidth="2"
                    opacity="0.6"
                    className="animate-ping"
                  />
                )}

                {/* Pin Leader Line to coordinate point */}
                <line
                  x1={cx}
                  y1={cy}
                  x2={cx - 15}
                  y2={cy - 25}
                  stroke={pinColor}
                  strokeWidth="2"
                  strokeDasharray={isSelected ? 'none' : '3,2'}
                />

                {/* Target Coordinate Dot */}
                <circle
                  cx={cx}
                  cy={cy}
                  r="4.5"
                  fill={pinColor}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />

                {/* Pin Head Badge */}
                <rect
                  x={cx - 25}
                  y={cy - 45}
                  width="70"
                  height="22"
                  rx="6"
                  fill={isSelected ? pinColor : '#0f172a'}
                  stroke={pinColor}
                  strokeWidth="2"
                  filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.6))"
                />

                <text
                  x={cx + 10}
                  y={cy - 30}
                  textAnchor="middle"
                  fill={isSelected ? '#ffffff' : pinColor}
                  fontSize="9.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {marker.label.slice(0, 8)}
                </text>

                {/* Photo indicator badge if photo attached */}
                {marker.photoUrl && (
                  <circle
                    cx={cx + 42}
                    cy={cy - 44}
                    r="5"
                    fill="#3b82f6"
                    stroke="#ffffff"
                    strokeWidth="1"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Crosshair Overlay Prompt */}
        {isCrosshairActive && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 font-bold px-4 py-1.5 rounded-full text-xs shadow-lg flex items-center gap-2 pointer-events-none animate-bounce">
            <Crosshair className="w-4 h-4" />
            Click on 3D Part Surface to Anchor Inspection Coordinate Pin
          </div>
        )}

        {/* Legend Box */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-sm border border-slate-700/80 rounded-xl p-2.5 text-[10px] font-mono text-slate-300 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>In-Spec</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Out-of-Spec</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Defect Photo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span>Pending</span>
          </div>
        </div>

        {/* Coordinate Readout */}
        <div className="absolute top-3 right-3 text-[10px] font-mono text-slate-500 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800">
          PROJECTION: ISO 128-30 • AXES: X,Y,Z (CAD 1:1)
        </div>
      </div>

      {/* Markers Summary Strip below 3D Viewer */}
      <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
        <span className="text-[10px] uppercase font-mono text-slate-400 font-bold shrink-0">
          Inspection Points ({markers.length}):
        </span>
        {markers.map((m) => {
          const isSelected = m.id === activeMarkerId;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectMarker(m)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition shrink-0 flex items-center gap-1.5 border ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md ring-1 ring-blue-400'
                  : m.status === 'out_of_spec'
                  ? 'bg-rose-950/40 text-rose-300 border-rose-500/40 hover:bg-rose-900/30'
                  : m.status === 'in_spec'
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <span>{m.label}</span>
              {m.measuredValue !== undefined && m.measuredValue !== null && (
                <span className="text-[10px] opacity-80">({m.measuredValue}{m.unit})</span>
              )}
            </button>
          );
        })}
      </div>

    </div>
  );
};
