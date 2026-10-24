// src/components/defect-pareto/PartHeatmapViewer.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  Rotate3d,
  Layers,
  Eye,
  Sliders,
  Crosshair,
  Flame,
  Plus,
  Maximize2,
  RefreshCw,
  Info,
  ZoomIn,
  ZoomOut,
  MapPin,
  ChevronRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import {
  PartDefinition,
  DefectRecord,
  HeatmapZoneAggregation,
  DefectSpatialPoint
} from '../../types/defectPareto';
import { DEFECT_CLASSIFICATION_INFO } from '../../services/defectParetoService';

interface PartHeatmapViewerProps {
  parts: PartDefinition[];
  activePart: PartDefinition;
  onSelectPart: (part: PartDefinition) => void;
  defects: DefectRecord[];
  heatmapZones: HeatmapZoneAggregation[];
  onSelectDefect: (defect: DefectRecord) => void;
  onDropPinpoint: (point: DefectSpatialPoint) => void;
  isPinpointMode: boolean;
  onTogglePinpointMode: (active: boolean) => void;
}

export const PartHeatmapViewer: React.FC<PartHeatmapViewerProps> = ({
  parts,
  activePart,
  onSelectPart,
  defects,
  heatmapZones,
  onSelectDefect,
  onDropPinpoint,
  isPinpointMode,
  onTogglePinpointMode
}) => {
  const [viewMode, setViewMode] = useState<'2d_blueprint' | '3d_model'>('2d_blueprint');
  const [heatIntensity, setHeatIntensity] = useState<number>(0.8);
  const [blurRadius, setBlurRadius] = useState<number>(24);
  const [showDefectPins, setShowDefectPins] = useState<boolean>(true);
  const [showZoneLabels, setShowZoneLabels] = useState<boolean>(true);
  const [wireframeMode, setWireframeMode] = useState<boolean>(false);
  
  // 3D Orbit Controls State
  const [rotX, setRotX] = useState<number>(25); // Pitch
  const [rotY, setRotY] = useState<number>(-35); // Yaw
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; rotX: number; rotY: number }>({ x: 0, y: 0, rotX: 25, rotY: -35 });

  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredZone, setHoveredZone] = useState<HeatmapZoneAggregation | null>(null);

  // Filter defects for the current part
  const partDefects = defects.filter(d => d.partSku === activePart.sku);

  // Handle 3D Mouse Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (viewMode !== '3d_model' || isPinpointMode) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY, rotX, rotY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setRotY(dragStartRef.current.rotY + dx * 0.5);
    setRotX(Math.max(-80, Math.min(80, dragStartRef.current.rotX - dy * 0.5)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle Clicking on Part to Drop Pinpoint
  const handlePartClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPinpointMode || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xPct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const yPct = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    // Identify closest zone
    const closestZone = activePart.zones.reduce((prev, curr) => {
      const dCurr = Math.hypot(curr.xPct - xPct, curr.yPct - yPct);
      const dPrev = Math.hypot(prev.xPct - xPct, prev.yPct - yPct);
      return dCurr < dPrev ? curr : prev;
    }, activePart.zones[0]);

    onDropPinpoint({
      x: xPct,
      y: yPct,
      z: closestZone.zCoordinate || 0,
      viewAngle: viewMode === '3d_model' ? '3d' : 'top',
      zoneId: closestZone.id,
      zoneName: closestZone.name
    });
  };

  // Render SVG Schematics for 2D View
  const renderSvgBlueprint = () => {
    switch (activePart.schematicSvgType) {
      case 'camshaft':
        return (
          <g>
            {/* Centerline */}
            <line x1="20" y1="200" x2="780" y2="200" stroke="#0ea5e9" strokeDasharray="8,4,2,4" strokeWidth="1" opacity="0.6" />
            {/* Main shaft bar */}
            <rect x="50" y="180" width="700" height="40" fill="#1e293b" stroke="#475569" strokeWidth="2" rx="4" />
            {/* Bearing Journal #1 */}
            <rect x="80" y="165" width="80" height="70" fill="#334155" stroke="#38bdf8" strokeWidth="2" rx="2" />
            <text x="120" y="160" textAnchor="middle" fill="#7dd3fc" fontSize="10" fontFamily="monospace">J1: Ø32.000</text>
            {/* Intake Cam Lobe #1 */}
            <path d="M 190 200 C 190 140, 240 120, 240 200 C 240 230, 190 230, 190 200 Z" fill="#475569" stroke="#94a3b8" strokeWidth="2" />
            {/* Exhaust Cam Lobe #2 */}
            <path d="M 270 200 C 270 255, 320 270, 320 200 C 320 170, 270 170, 270 200 Z" fill="#475569" stroke="#94a3b8" strokeWidth="2" />
            {/* Center Journal #2 */}
            <rect x="360" y="165" width="80" height="70" fill="#334155" stroke="#38bdf8" strokeWidth="2" rx="2" />
            <text x="400" y="160" textAnchor="middle" fill="#7dd3fc" fontSize="10" fontFamily="monospace">J2: Ø32.000</text>
            {/* Intake Cam Lobe #3 */}
            <path d="M 470 200 C 470 135, 520 115, 520 200 C 520 230, 470 230, 470 200 Z" fill="#475569" stroke="#94a3b8" strokeWidth="2" />
            {/* Exhaust Cam Lobe #4 */}
            <path d="M 560 200 C 560 255, 610 270, 610 200 C 610 170, 560 170, 560 200 Z" fill="#475569" stroke="#94a3b8" strokeWidth="2" />
            {/* Bearing Journal #3 / Spline */}
            <rect x="660" y="160" width="70" height="80" fill="#334155" stroke="#38bdf8" strokeWidth="2" rx="2" />
            <text x="695" y="155" textAnchor="middle" fill="#7dd3fc" fontSize="10" fontFamily="monospace">J3 / DRIVE</text>
            {/* Axial Oil Gallery dotted line */}
            <line x1="70" y1="200" x2="720" y2="200" stroke="#f59e0b" strokeDasharray="3,3" strokeWidth="3" opacity="0.7" />
          </g>
        );

      case 'impeller':
        return (
          <g transform="translate(400, 200)">
            {/* Hub base rings */}
            <circle cx="0" cy="0" r="170" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <circle cx="0" cy="0" r="120" fill="#0f172a" stroke="#334155" strokeWidth="1" strokeDasharray="6,4" />
            <circle cx="0" cy="0" r="45" fill="#334155" stroke="#38bdf8" strokeWidth="2" />
            <circle cx="0" cy="0" r="22" fill="#0284c7" stroke="#7dd3fc" strokeWidth="2" />
            <text x="0" y="6" textAnchor="middle" fill="#e0f2fe" fontSize="11" fontWeight="bold" fontFamily="monospace">Ø22 H7</text>
            {/* 14 Aerofoil Blades */}
            {Array.from({ length: 14 }).map((_, i) => {
              const ang = (i * 360) / 14;
              return (
                <path
                  key={i}
                  d="M 30 0 C 60 25, 120 40, 165 15 C 150 5, 80 -10, 30 0 Z"
                  fill="#475569"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  transform={`rotate(${ang})`}
                  opacity="0.9"
                />
              );
            })}
          </g>
        );

      case 'valve_body':
        return (
          <g>
            {/* Outer Flanges */}
            <rect x="100" y="90" width="40" height="220" rx="6" fill="#334155" stroke="#38bdf8" strokeWidth="2" />
            <rect x="660" y="90" width="40" height="220" rx="6" fill="#334155" stroke="#38bdf8" strokeWidth="2" />
            {/* Valve Bonnet Neck */}
            <path d="M 340 90 L 460 90 L 440 180 L 360 180 Z" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <rect x="330" y="70" width="140" height="25" rx="4" fill="#334155" stroke="#38bdf8" strokeWidth="2" />
            <text x="400" y="87" textAnchor="middle" fill="#7dd3fc" fontSize="10" fontFamily="monospace">BONNET FLANGE</text>
            {/* Spherical Valve Body Cavity */}
            <circle cx="400" cy="200" r="95" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            {/* Flow passage cylinder */}
            <rect x="140" y="160" width="520" height="80" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            {/* Internal Stellite Seat Ring */}
            <ellipse cx="400" cy="200" rx="25" ry="42" fill="#475569" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4,2" />
            <text x="400" y="205" textAnchor="middle" fill="#fca5a5" fontSize="11" fontWeight="bold">SEAT</text>
            {/* Bottom Drain Boss */}
            <rect x="375" y="295" width="50" height="30" rx="4" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
            <text x="400" y="315" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">1/2" NPT</text>
          </g>
        );

      case 'bracket':
        return (
          <g>
            {/* Stamped Sheet Profile */}
            <path
              d="M 120 100 L 680 100 Q 720 100 720 140 L 720 260 Q 720 300 680 300 L 120 300 Q 80 300 80 260 L 80 140 Q 80 100 120 100 Z"
              fill="#1e293b"
              stroke="#475569"
              strokeWidth="3"
            />
            {/* Deep Drawn Cup */}
            <circle cx="580" cy="220" r="50" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
            <circle cx="580" cy="220" r="28" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
            {/* Stiffener Emboss Rib */}
            <path d="M 300 170 Q 420 150 500 190 Q 420 230 300 210 Z" fill="#334155" stroke="#f59e0b" strokeWidth="1.5" opacity="0.8" />
            {/* Mounting Hole A */}
            <circle cx="170" cy="150" r="26" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
            <text x="170" y="154" textAnchor="middle" fill="#7dd3fc" fontSize="10" fontFamily="monospace">HOLE A</text>
            {/* Mounting Hole B */}
            <circle cx="170" cy="250" r="26" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
            <text x="170" y="254" textAnchor="middle" fill="#7dd3fc" fontSize="10" fontFamily="monospace">HOLE B</text>
            {/* Weld Flange Edge */}
            <line x1="680" y1="120" x2="680" y2="280" stroke="#f43f5e" strokeWidth="4" strokeDasharray="6,4" />
            <text x="690" y="200" transform="rotate(90, 690, 200)" textAnchor="middle" fill="#fca5a5" fontSize="10" fontFamily="monospace">LASER WELD ZONE</text>
          </g>
        );

      case 'pcb_controller':
        return (
          <g>
            {/* Green FR4 board background */}
            <rect x="100" y="60" width="600" height="280" rx="10" fill="#064e3b" stroke="#059669" strokeWidth="2" />
            {/* Copper ground plane hatch */}
            <rect x="110" y="70" width="580" height="260" rx="6" fill="#022c22" stroke="#10b981" strokeWidth="1" strokeDasharray="10,10" opacity="0.4" />
            {/* BGA MCU */}
            <rect x="270" y="130" width="90" height="90" rx="4" fill="#0f172a" stroke="#fbbf24" strokeWidth="1.5" />
            <text x="315" y="180" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="bold">ARM BGA</text>
            {/* Power MOSFET Array */}
            <rect x="500" y="110" width="130" height="60" rx="4" fill="#1e293b" stroke="#ef4444" strokeWidth="1.5" />
            <text x="565" y="145" textAnchor="middle" fill="#f87171" fontSize="10" fontWeight="bold">MOSFET BRIDGE</text>
            {/* Bulk Caps */}
            <circle cx="530" cy="250" r="24" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="590" cy="250" r="24" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            {/* Terminal Block */}
            <rect x="120" y="120" width="45" height="160" rx="4" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
            <text x="142" y="205" transform="rotate(-90, 142, 205)" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="bold">TERMINALS</text>
            {/* RJ45 EtherCAT */}
            <rect x="180" y="240" width="50" height="50" rx="3" fill="#1e293b" stroke="#60a5fa" strokeWidth="1.5" />
            <text x="205" y="270" textAnchor="middle" fill="#93c5fd" fontSize="9" fontWeight="bold">ETH</text>
          </g>
        );
    }
  };

  // Render 3D Model Wireframe/Solid Projection
  const render3DModel = () => {
    // 3D coordinate transform math with rotX and rotY
    const radX = (rotX * Math.PI) / 180;
    const radY = (rotY * Math.PI) / 180;

    const project3D = (x: number, y: number, z: number) => {
      // Rotate around Y
      const x1 = x * Math.cos(radY) + z * Math.sin(radY);
      const z1 = -x * Math.sin(radY) + z * Math.cos(radY);
      // Rotate around X
      const y2 = y * Math.cos(radX) - z1 * Math.sin(radX);
      const z2 = y * Math.sin(radX) + z1 * Math.cos(radX);
      // Orthographic projection to 2D canvas with center (400, 200)
      const scale = 2.4 * zoomLevel;
      return {
        px: 400 + x1 * scale,
        py: 200 + y2 * scale,
        depth: z2
      };
    };

    // 3D Geometry primitives depending on part
    const segments = 16;
    const meshLines: { x1: number; y1: number; z1: number; x2: number; y2: number; z2: number }[] = [];

    if (activePart.schematicSvgType === 'camshaft') {
      // Cylindrical shaft segments
      for (let i = 0; i < segments; i++) {
        const theta1 = (i * 2 * Math.PI) / segments;
        const theta2 = ((i + 1) * 2 * Math.PI) / segments;
        const r = 24;
        const rLobe = 36;

        // Shaft ribs
        meshLines.push({ x1: -120, y1: Math.sin(theta1) * r, z1: Math.cos(theta1) * r, x2: 120, y2: Math.sin(theta1) * r, z2: Math.cos(theta1) * r });
        // Journal rings
        [-100, -50, 0, 50, 100].forEach(gx => {
          meshLines.push({
            x1: gx, y1: Math.sin(theta1) * r, z1: Math.cos(theta1) * r,
            x2: gx, y2: Math.sin(theta2) * r, z2: Math.cos(theta2) * r
          });
        });
        // Lobes
        [-65, 30].forEach(lx => {
          meshLines.push({
            x1: lx, y1: Math.sin(theta1) * rLobe, z1: Math.cos(theta1) * (r + 8),
            x2: lx, y2: Math.sin(theta2) * rLobe, z2: Math.cos(theta2) * (r + 8)
          });
        });
      }
    } else {
      // General solid bounding prism & radial wireframe for 3D view
      for (let i = 0; i < 12; i++) {
        const t1 = (i * 2 * Math.PI) / 12;
        const t2 = ((i + 1) * 2 * Math.PI) / 12;
        const rOuter = 80;
        const rInner = 28;
        meshLines.push({
          x1: Math.cos(t1) * rOuter, y1: -30, z1: Math.sin(t1) * rOuter,
          x2: Math.cos(t2) * rOuter, y2: -30, z2: Math.sin(t2) * rOuter
        });
        meshLines.push({
          x1: Math.cos(t1) * rOuter, y1: 30, z1: Math.sin(t1) * rOuter,
          x2: Math.cos(t2) * rOuter, y2: 30, z2: Math.sin(t2) * rOuter
        });
        meshLines.push({
          x1: Math.cos(t1) * rOuter, y1: -30, z1: Math.sin(t1) * rOuter,
          x2: Math.cos(t1) * rOuter, y2: 30, z2: Math.sin(t1) * rOuter
        });
        meshLines.push({
          x1: Math.cos(t1) * rInner, y1: -40, z1: Math.sin(t1) * rInner,
          x2: Math.cos(t2) * rInner, y2: -40, z2: Math.sin(t2) * rInner
        });
      }
    }

    return (
      <g>
        {/* Wireframe Mesh Lines */}
        {meshLines.map((line, idx) => {
          const p1 = project3D(line.x1, line.y1, line.z1);
          const p2 = project3D(line.x2, line.y2, line.z2);
          const avgDepth = (p1.depth + p2.depth) / 2;
          const opacity = Math.max(0.15, Math.min(0.9, (avgDepth + 100) / 200));

          return (
            <line
              key={idx}
              x1={p1.px}
              y1={p1.py}
              x2={p2.px}
              y2={p2.py}
              stroke={wireframeMode ? '#38bdf8' : '#64748b'}
              strokeWidth={wireframeMode ? 1.5 : 1}
              opacity={opacity}
            />
          );
        })}

        {/* 3D Defect Spatial Points & Glowing Hotspot Spheres */}
        {partDefects.map((def) => {
          // Map 2D percentage coordinates to 3D center (-100 to 100)
          const modelX = ((def.spatialLocation.x - 50) / 50) * 110;
          const modelY = ((def.spatialLocation.y - 50) / 50) * 45;
          const modelZ = (def.spatialLocation.z || 0) * 2;

          const proj = project3D(modelX, modelY, modelZ);
          const isCritical = def.severity === 'critical';

          return (
            <g
              key={def.id}
              className="cursor-pointer group"
              onClick={(e) => {
                e.stopPropagation();
                onSelectDefect(def);
              }}
            >
              {/* Thermal glow sphere in 3D */}
              <circle
                cx={proj.px}
                cy={proj.py}
                r={isCritical ? 16 : 11}
                fill={isCritical ? '#f43f5e' : '#f59e0b'}
                opacity={0.35}
                className="animate-pulse"
              />
              <circle
                cx={proj.px}
                cy={proj.py}
                r={isCritical ? 7 : 5}
                fill={isCritical ? '#e11d48' : '#d97706'}
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              {/* Pin Callout */}
              <text
                x={proj.px}
                y={proj.py - 12}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="9"
                fontWeight="bold"
                fontFamily="monospace"
                className="pointer-events-none drop-shadow-md"
              >
                {def.defectNumber.slice(-4)}
              </text>
            </g>
          );
        })}

        {/* 3D Coordinate Axis Gizmo in top-left */}
        <g transform="translate(70, 70)">
          {(() => {
            const origin = project3D(0, 0, 0);
            const xAxis = project3D(25, 0, 0);
            const yAxis = project3D(0, 25, 0);
            const zAxis = project3D(0, 0, 25);
            return (
              <>
                <circle cx="0" cy="0" r="28" fill="#0f172a" stroke="#334155" strokeWidth="1" opacity="0.8" />
                <line x1="0" y1="0" x2={xAxis.px - origin.px} y2={xAxis.py - origin.py} stroke="#ef4444" strokeWidth="2" />
                <text x={xAxis.px - origin.px + 4} y={xAxis.py - origin.py} fill="#ef4444" fontSize="9" fontWeight="bold">X</text>
                <line x1="0" y1="0" x2={yAxis.px - origin.px} y2={yAxis.py - origin.py} stroke="#10b981" strokeWidth="2" />
                <text x={yAxis.px - origin.px + 4} y={yAxis.py - origin.py} fill="#10b981" fontSize="9" fontWeight="bold">Y</text>
                <line x1="0" y1="0" x2={zAxis.px - origin.px} y2={zAxis.py - origin.py} stroke="#3b82f6" strokeWidth="2" />
                <text x={zAxis.px - origin.px + 4} y={zAxis.py - origin.py} fill="#3b82f6" fontSize="9" fontWeight="bold">Z</text>
              </>
            );
          })()}
        </g>
      </g>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      {/* Top Header & Part Selector */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider bg-amber-950/80 text-amber-300 border border-amber-800/80 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <Flame size={12} className="text-amber-400" />
              Defect Heat Map & Spatial Concentrator
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Part Coordinate Inspection Overlay
            </span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1.5 flex items-center gap-2">
            <Crosshair size={20} className="text-amber-400" />
            <span>Interactive Part Defect Localization & Spatial Clusters</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Identify hot zones where tooling wear, hydraulic chatter, thermal expansion, or casting porosity concentrate.
          </p>
        </div>

        {/* View Toggle (2D Blueprint vs 3D Model) */}
        <div className="flex items-center gap-2 self-start xl:self-center">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('2d_blueprint')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === '2d_blueprint'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye size={13} />
              <span>2D Blueprint Schematic</span>
            </button>
            <button
              onClick={() => setViewMode('3d_model')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === '3d_model'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Rotate3d size={13} />
              <span>3D Spatial Orbit Model</span>
            </button>
          </div>

          {/* Pinpoint Mode Trigger */}
          <button
            onClick={() => onTogglePinpointMode(!isPinpointMode)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 ${
              isPinpointMode
                ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-900/50 animate-pulse'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Crosshair size={13} className={isPinpointMode ? 'text-white' : 'text-rose-400'} />
            <span>{isPinpointMode ? 'Click on Part to Log' : 'Drop Defect Pinpoint'}</span>
          </button>
        </div>
      </div>

      {/* Parts Selector Carousel / Tabs */}
      <div className="my-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <Layers size={13} /> Part:
        </span>
        {parts.map((p) => {
          const isSelected = p.sku === activePart.sku;
          const pDefectCount = defects.filter(d => d.partSku === p.sku).length;
          return (
            <button
              key={p.sku}
              onClick={() => onSelectPart(p)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
                isSelected
                  ? 'bg-slate-800 border-amber-500 text-amber-300 shadow-md ring-1 ring-amber-500/50'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <span>{p.name}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                isSelected ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-slate-800 text-slate-400'
              }`}>
                {pDefectCount} defects
              </span>
            </button>
          );
        })}
      </div>

      {/* Part Specifications Banner */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs mb-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-amber-400 font-bold">{activePart.sku}</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">{activePart.material}</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400 font-mono">{activePart.nominalDimensions}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            Tol: {activePart.defaultTolerances}
          </span>
          <span className="text-xs font-bold text-rose-400 font-mono">
            {partDefects.length} Defect Locations
          </span>
        </div>
      </div>

      {/* Main Interactive Canvas / Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handlePartClick}
        className={`relative w-full h-[400px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-2xl border border-slate-800 overflow-hidden select-none ${
          isPinpointMode ? 'cursor-crosshair' : viewMode === '3d_model' ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        }`}
      >
        {/* Subtle grid pattern background */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none" 
          style={{ backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
        />

        {/* View mode indicator */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
          <div className="bg-slate-950/90 border border-slate-800/90 backdrop-blur-md px-3 py-1 rounded-xl text-xs flex items-center gap-2 text-slate-300 font-medium shadow-lg">
            {viewMode === '2d_blueprint' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>2D Engineering CAD Blueprint</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                <span>3D Ortho Model (Drag to Orbit · Pitch {Math.round(rotX)}° · Yaw {Math.round(rotY)}°)</span>
              </>
            )}
          </div>

          {isPinpointMode && (
            <div className="bg-rose-950/90 border border-rose-700/90 text-rose-200 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg animate-bounce">
              <Crosshair size={13} />
              <span>Click on any part surface to drop a defect pinpoint!</span>
            </div>
          )}
        </div>

        {/* Top Right Controls & Overlay Sliders */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          {viewMode === '3d_model' && (
            <div className="flex items-center gap-1 bg-slate-950/90 border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setZoomLevel(prev => Math.min(2.0, prev + 0.15))}
                title="Zoom In"
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.15))}
                title="Zoom Out"
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              >
                <ZoomOut size={14} />
              </button>
              <button
                onClick={() => { setRotX(25); setRotY(-35); setZoomLevel(1.0); }}
                title="Reset View"
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              >
                <RefreshCw size={14} />
              </button>
              <button
                onClick={() => setWireframeMode(!wireframeMode)}
                title="Toggle Wireframe"
                className={`px-2 py-0.5 text-[11px] font-mono rounded ${
                  wireframeMode ? 'bg-sky-950 text-sky-400 border border-sky-800' : 'text-slate-400 hover:text-white'
                }`}
              >
                Wire
              </button>
            </div>
          )}

          {/* Show/Hide Pins Toggle */}
          <button
            onClick={() => setShowDefectPins(!showDefectPins)}
            className={`px-2.5 py-1 text-xs rounded-xl border backdrop-blur-md transition-all font-semibold flex items-center gap-1.5 ${
              showDefectPins 
                ? 'bg-slate-950/90 border-slate-700 text-slate-200' 
                : 'bg-slate-900/60 border-slate-800 text-slate-500'
            }`}
          >
            <MapPin size={12} className={showDefectPins ? 'text-rose-400' : 'text-slate-500'} />
            <span>Pins ({partDefects.length})</span>
          </button>
        </div>

        {/* SVG Canvas Container */}
        <svg
          viewBox="0 0 800 400"
          className="w-full h-full"
          style={{ transform: viewMode === '3d_model' ? 'none' : 'none' }}
        >
          <defs>
            {/* Radial Gradients for Heatmap Clusters */}
            <radialGradient id="heatRadialHot" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
              <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.6" />
              <stop offset="75%" stopColor="#06b6d4" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heatRadialWarm" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.75" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heatRadialCool" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6" />
              <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Render 2D Schematic or 3D Wireframe */}
          {viewMode === '2d_blueprint' ? (
            <>
              {renderSvgBlueprint()}

              {/* 2D Heat Map Density Clouds (Rendered behind pins) */}
              {heatmapZones.map((zone) => {
                if (zone.defectCount === 0) return null;
                const cx = (zone.xPct / 100) * 800;
                const cy = (zone.yPct / 100) * 400;
                const r = (zone.radiusPct / 100) * 400 * (blurRadius / 20) * 1.5;
                const isHot = zone.criticalCount > 0 || zone.defectCount >= 3;

                return (
                  <g key={`heat-${zone.zoneId}`} className="pointer-events-none">
                    <circle
                      cx={cx}
                      cy={cy}
                      r={Math.max(30, r)}
                      fill={isHot ? 'url(#heatRadialHot)' : 'url(#heatRadialWarm)'}
                      opacity={heatIntensity}
                      className={isHot ? 'animate-pulse' : ''}
                    />
                  </g>
                );
              })}

              {/* Zone Hover / Label Boundaries */}
              {showZoneLabels && activePart.zones.map((zone) => {
                const zAgg = heatmapZones.find(hz => hz.zoneId === zone.id);
                const count = zAgg ? zAgg.defectCount : 0;
                const cx = (zone.xPct / 100) * 800;
                const cy = (zone.yPct / 100) * 400;

                return (
                  <g
                    key={zone.id}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredZone(zAgg || null)}
                    onMouseLeave={() => setHoveredZone(null)}
                  >
                    <circle
                      cx={cx}
                      cy={cy}
                      r="16"
                      fill="none"
                      stroke={count > 0 ? '#f43f5e' : '#475569'}
                      strokeDasharray="3,3"
                      strokeWidth="1.2"
                      opacity="0.7"
                    />
                  </g>
                );
              })}

              {/* 2D Interactive Defect Pinpoints */}
              {showDefectPins && partDefects.map((def) => {
                const px = (def.spatialLocation.x / 100) * 800;
                const py = (def.spatialLocation.y / 100) * 400;
                const isCritical = def.severity === 'critical';

                return (
                  <g
                    key={def.id}
                    className="cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDefect(def);
                    }}
                  >
                    {/* Pulsing ring */}
                    <circle
                      cx={px}
                      cy={py}
                      r={isCritical ? 14 : 10}
                      fill={isCritical ? '#f43f5e' : '#f59e0b'}
                      opacity={0.3}
                      className="animate-ping"
                    />
                    {/* Pin body */}
                    <circle
                      cx={px}
                      cy={py}
                      r={isCritical ? 6.5 : 5}
                      fill={isCritical ? '#e11d48' : '#d97706'}
                      stroke="#ffffff"
                      strokeWidth="1.8"
                      className="transition-transform group-hover:scale-125"
                    />
                    {/* Tooltip callout badge on pin */}
                    <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                      <rect
                        x={px - 55}
                        y={py - 32}
                        width="110"
                        height="22"
                        rx="6"
                        fill="#020617"
                        stroke="#f43f5e"
                        strokeWidth="1"
                      />
                      <text
                        x={px}
                        y={py - 18}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9.5"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {def.defectNumber} ({def.severity})
                      </text>
                    </g>
                  </g>
                );
              })}
            </>
          ) : (
            render3DModel()
          )}
        </svg>

        {/* Hovered Zone Callout at Bottom-Left */}
        {hoveredZone && (
          <div className="absolute bottom-3 left-3 bg-slate-950/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-md max-w-sm pointer-events-none z-20 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <h4 className="text-xs font-bold text-white">{hoveredZone.zoneName}</h4>
            </div>
            <div className="mt-1.5 flex items-center gap-3 text-[11px] font-mono">
              <span className="text-rose-400 font-bold">{hoveredZone.defectCount} Defects</span>
              <span className="text-slate-500">·</span>
              <span className="text-amber-300">{hoveredZone.criticalCount} Critical</span>
              <span className="text-slate-500">·</span>
              <span className="text-cyan-300">Heat: {Math.round(hoveredZone.heatIntensity * 100)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Heatmap Tuning & Calibration Controls */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Sliders */}
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2">
            <Sliders size={13} className="text-slate-400" />
            <span className="text-slate-300 font-medium">Heat Intensity:</span>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={heatIntensity}
              onChange={(e) => setHeatIntensity(parseFloat(e.target.value))}
              className="w-24 accent-amber-500 bg-slate-800 rounded cursor-pointer"
            />
            <span className="text-slate-400 font-mono text-[11px]">{Math.round(heatIntensity * 100)}%</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-medium">Blur Radius:</span>
            <input
              type="range"
              min="10"
              max="45"
              step="2"
              value={blurRadius}
              onChange={(e) => setBlurRadius(parseInt(e.target.value))}
              className="w-24 accent-sky-500 bg-slate-800 rounded cursor-pointer"
            />
            <span className="text-slate-400 font-mono text-[11px]">{blurRadius}px</span>
          </div>

          <button
            onClick={() => setShowZoneLabels(!showZoneLabels)}
            className={`px-2 py-0.5 rounded border text-[11px] font-medium transition-all ${
              showZoneLabels ? 'bg-slate-800 border-slate-600 text-slate-200' : 'text-slate-500 border-slate-800'
            }`}
          >
            Zone Boundaries: {showZoneLabels ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Heat Map Gradient Legend */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Cluster Density:</span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-500 font-mono">Cool (0)</span>
            <div className="w-24 h-2.5 rounded-full bg-gradient-to-r from-blue-600 via-emerald-400 via-amber-400 to-rose-600 shadow-inner" />
            <span className="text-[10px] text-rose-400 font-mono">Hot (Max)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
