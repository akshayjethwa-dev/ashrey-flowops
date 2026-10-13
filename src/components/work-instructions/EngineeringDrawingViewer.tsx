// src/components/work-instructions/EngineeringDrawingViewer.tsx

import React, { useState, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  FileText,
  Layers,
  Info,
  Sparkles,
  Eye,
  Crosshair,
  Download
} from 'lucide-react';
import { InstructionMedia, CadDimensionDetail } from '../../types/workInstruction';

interface EngineeringDrawingViewerProps {
  media: InstructionMedia;
  onSelectDimension?: (dim: CadDimensionDetail) => void;
  isTabletMode?: boolean;
}

type ColorScheme = 'blueprint' | 'dark_cad' | 'light_paper';

export const EngineeringDrawingViewer: React.FC<EngineeringDrawingViewerProps> = ({
  media,
  onSelectDimension,
  isTabletMode = false,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [colorScheme, setColorScheme] = useState<ColorScheme>('blueprint');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedPin, setSelectedPin] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.6));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setSelectedPin(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Tablet Touch Pan Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - panOffset.x,
        y: e.touches[0].clientY - panOffset.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPanOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => setIsDragging(false);

  // Scheme styling
  const schemeStyles: Record<ColorScheme, { bg: string; gridColor: string; strokeColor: string; textColor: string; accentColor: string }> = {
    blueprint: {
      bg: 'bg-[#0f2744]',
      gridColor: '#1d3e66',
      strokeColor: '#7dd3fc',
      textColor: '#e0f2fe',
      accentColor: '#38bdf8'
    },
    dark_cad: {
      bg: 'bg-[#18181b]',
      gridColor: '#27272a',
      strokeColor: '#a1a1aa',
      textColor: '#fafafa',
      accentColor: '#10b981'
    },
    light_paper: {
      bg: 'bg-white',
      gridColor: '#f1f5f9',
      strokeColor: '#1e293b',
      textColor: '#0f172a',
      accentColor: '#2563eb'
    }
  };

  const currentScheme = schemeStyles[colorScheme];

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col border border-slate-700/60 rounded-xl overflow-hidden shadow-lg select-none ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none w-screen h-screen' : 'w-full h-[520px]'
      } ${currentScheme.bg}`}
    >
      {/* Top CAD Viewer Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-slate-700/50 text-white z-10 gap-2">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-cyan-400" />
          <span className="text-xs font-mono font-semibold tracking-wide text-cyan-200">
            {media.drawingNumber || 'DWG-CAD-STD'}
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-xs text-slate-300 font-medium truncate max-w-[200px] sm:max-w-xs">
            {media.title}
          </span>
          {media.sheetNumber && (
            <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800/60 px-1.5 py-0.5 rounded font-mono">
              {media.sheetNumber}
            </span>
          )}
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-1.5">
          {/* Color Scheme Switcher */}
          <div className="flex items-center bg-slate-800 rounded p-0.5 border border-slate-700 mr-2 text-[11px]">
            <button
              onClick={() => setColorScheme('blueprint')}
              className={`px-2 py-1 rounded transition-colors ${
                colorScheme === 'blueprint' ? 'bg-cyan-700 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
              title="Classic Blueprint"
            >
              Blueprint
            </button>
            <button
              onClick={() => setColorScheme('dark_cad')}
              className={`px-2 py-1 rounded transition-colors ${
                colorScheme === 'dark_cad' ? 'bg-zinc-700 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
              title="Dark CAD"
            >
              Dark CAD
            </button>
            <button
              onClick={() => setColorScheme('light_paper')}
              className={`px-2 py-1 rounded transition-colors ${
                colorScheme === 'light_paper' ? 'bg-slate-200 text-slate-900 font-medium' : 'text-slate-400 hover:text-white'
              }`}
              title="White Paper"
            >
              White
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center bg-slate-800 rounded border border-slate-700">
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 active:scale-95 transition"
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-xs font-mono px-2 text-cyan-300 font-medium min-w-[50px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 active:scale-95 transition"
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
          </div>

          <button
            onClick={handleResetZoom}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 active:scale-95 transition"
            title="Reset Zoom & Pan"
          >
            <RotateCcw size={16} />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 bg-cyan-700/60 hover:bg-cyan-600 text-cyan-100 rounded border border-cyan-500/50 active:scale-95 transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Tablet Fullscreen Blueprint'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Main Drawing Canvas Area */}
      <div
        className="relative flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle, ${currentScheme.gridColor} 1.5px, transparent 1.5px)`,
            backgroundSize: '24px 24px'
          }}
        />

        {/* Zoomable & Pannable Vector Schematics */}
        <div
          className="w-full h-full flex items-center justify-center transition-transform duration-75 origin-center"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`
          }}
        >
          <svg
            viewBox="0 0 900 600"
            className="w-[850px] h-[550px] max-w-none drop-shadow-md select-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Title Block Border (ISO Standard Drawing Frame) */}
            <rect
              x="20"
              y="20"
              width="860"
              height="560"
              fill="none"
              stroke={currentScheme.strokeColor}
              strokeWidth="2.5"
            />
            <rect
              x="26"
              y="26"
              width="848"
              height="548"
              fill="none"
              stroke={currentScheme.strokeColor}
              strokeWidth="1"
              strokeDasharray="4 2"
              opacity="0.6"
            />

            {/* Title Block Box (Bottom Right) */}
            <g transform="translate(560, 470)">
              <rect
                x="0"
                y="0"
                width="308"
                height="98"
                fill={colorScheme === 'blueprint' ? '#0c2038' : colorScheme === 'dark_cad' ? '#1f1f23' : '#f8fafc'}
                stroke={currentScheme.strokeColor}
                strokeWidth="1.5"
              />
              <line x1="0" y1="26" x2="308" y2="26" stroke={currentScheme.strokeColor} strokeWidth="1" />
              <line x1="0" y1="52" x2="308" y2="52" stroke={currentScheme.strokeColor} strokeWidth="1" />
              <line x1="0" y1="74" x2="308" y2="74" stroke={currentScheme.strokeColor} strokeWidth="1" />
              <line x1="160" y1="26" x2="160" y2="98" stroke={currentScheme.strokeColor} strokeWidth="1" />

              <text x="12" y="18" fill={currentScheme.textColor} fontSize="11" fontFamily="monospace" fontWeight="bold">
                FLOWOPS AEROSPACE & PRECISION
              </text>
              <text x="12" y="42" fill={currentScheme.textColor} fontSize="10" fontFamily="sans-serif">
                PART: GEAR BLANK 42T
              </text>
              <text x="170" y="42" fill={currentScheme.textColor} fontSize="10" fontFamily="monospace">
                REV: 3.2 (ISO-2768m)
              </text>
              <text x="12" y="66" fill={currentScheme.textColor} fontSize="9" fontFamily="sans-serif">
                DWG: {media.drawingNumber || 'DWG-GB-42T'}
              </text>
              <text x="170" y="66" fill={currentScheme.textColor} fontSize="9" fontFamily="monospace">
                SCALE 1:1.5 | MM
              </text>
              <text x="12" y="88" fill={currentScheme.accentColor} fontSize="9" fontFamily="monospace" fontWeight="bold">
                DATUM: [A] FACE / [B] BORE
              </text>
            </g>

            {/* Centerline Axis */}
            <line
              x1="60"
              y1="300"
              x2="520"
              y2="300"
              stroke="#ef4444"
              strokeWidth="1.2"
              strokeDasharray="14 4 3 4"
              opacity="0.85"
            />
            <text x="525" y="303" fill="#ef4444" fontSize="10" fontFamily="monospace">CL</text>

            {/* Cross-section Hatching & Part Profile (Gear Blank Revolute) */}
            {/* Top Half Section */}
            <path
              d="M 120 180 L 460 180 L 460 210 L 430 210 L 430 250 L 350 250 L 350 240 L 220 240 L 220 250 L 120 250 Z"
              fill={colorScheme === 'blueprint' ? '#133966' : colorScheme === 'dark_cad' ? '#27272a' : '#e2e8f0'}
              stroke={currentScheme.strokeColor}
              strokeWidth="2.5"
            />
            {/* Hatching Lines in Top Section */}
            <g stroke={currentScheme.strokeColor} strokeWidth="0.8" opacity="0.4">
              <line x1="140" y1="180" x2="210" y2="250" />
              <line x1="170" y1="180" x2="240" y2="250" />
              <line x1="200" y1="180" x2="270" y2="250" />
              <line x1="230" y1="180" x2="300" y2="250" />
              <line x1="260" y1="180" x2="330" y2="250" />
              <line x1="290" y1="180" x2="360" y2="250" />
              <line x1="320" y1="180" x2="390" y2="250" />
              <line x1="350" y1="180" x2="420" y2="250" />
              <line x1="380" y1="180" x2="450" y2="250" />
              <line x1="410" y1="180" x2="460" y2="230" />
            </g>

            {/* Bottom Half Section (Symmetric) */}
            <path
              d="M 120 420 L 460 420 L 460 390 L 430 390 L 430 350 L 350 350 L 350 360 L 220 360 L 220 350 L 120 350 Z"
              fill={colorScheme === 'blueprint' ? '#133966' : colorScheme === 'dark_cad' ? '#27272a' : '#e2e8f0'}
              stroke={currentScheme.strokeColor}
              strokeWidth="2.5"
            />
            {/* Hatching Lines in Bottom Section */}
            <g stroke={currentScheme.strokeColor} strokeWidth="0.8" opacity="0.4">
              <line x1="140" y1="420" x2="210" y2="350" />
              <line x1="170" y1="420" x2="240" y2="350" />
              <line x1="200" y1="420" x2="270" y2="350" />
              <line x1="230" y1="420" x2="300" y2="350" />
              <line x1="260" y1="420" x2="330" y2="350" />
              <line x1="290" y1="420" x2="360" y2="350" />
              <line x1="320" y1="420" x2="390" y2="350" />
              <line x1="350" y1="420" x2="420" y2="350" />
              <line x1="380" y1="420" x2="450" y2="350" />
              <line x1="410" y1="420" x2="460" y2="370" />
            </g>

            {/* Inner Bore Hole (between y=250 and y=350, Ø50.000 H7) */}
            <line x1="120" y1="250" x2="460" y2="250" stroke={currentScheme.strokeColor} strokeWidth="2" />
            <line x1="120" y1="350" x2="460" y2="350" stroke={currentScheme.strokeColor} strokeWidth="2" />

            {/* Chamfers at Bore Entry (1.0 x 45°) */}
            <line x1="120" y1="245" x2="125" y2="250" stroke={currentScheme.strokeColor} strokeWidth="2" />
            <line x1="120" y1="355" x2="125" y2="350" stroke={currentScheme.strokeColor} strokeWidth="2" />
            <line x1="460" y1="245" x2="455" y2="250" stroke={currentScheme.strokeColor} strokeWidth="2" />
            <line x1="460" y1="355" x2="455" y2="350" stroke={currentScheme.strokeColor} strokeWidth="2" />

            {/* DIMENSION WITNESS LINES & CALLOUTS */}
            {/* 1. Critical Bore Diameter Dimension: Ø50.000 +0.025/-0.000 */}
            <g
              className="cursor-pointer"
              onClick={() => {
                setSelectedPin(1);
                if (onSelectDimension && media.cadDetails?.[0]) onSelectDimension(media.cadDetails[0]);
              }}
            >
              <line x1="280" y1="250" x2="280" y2="350" stroke="#38bdf8" strokeWidth="1.8" />
              {/* Arrowheads */}
              <polygon points="280,250 276,260 284,260" fill="#38bdf8" />
              <polygon points="280,350 276,340 284,340" fill="#38bdf8" />

              {/* Callout Box */}
              <rect
                x="210"
                y="288"
                width="140"
                height="26"
                rx="4"
                fill="#0369a1"
                stroke="#38bdf8"
                strokeWidth="1.5"
                className="transition hover:fill-sky-700"
              />
              <text x="280" y="305" fill="#ffffff" fontSize="12" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                Ø50.000 +0.025 / 0
              </text>
            </g>

            {/* 2. Total Part Cut Length: 142.500 mm */}
            <g
              className="cursor-pointer"
              onClick={() => {
                setSelectedPin(2);
                if (onSelectDimension && media.cadDetails?.[1]) onSelectDimension(media.cadDetails[1]);
              }}
            >
              <line x1="120" y1="150" x2="120" y2="175" stroke={currentScheme.strokeColor} strokeWidth="1" strokeDasharray="3 2" />
              <line x1="460" y1="150" x2="460" y2="175" stroke={currentScheme.strokeColor} strokeWidth="1" strokeDasharray="3 2" />
              <line x1="120" y1="155" x2="460" y2="155" stroke="#10b981" strokeWidth="1.8" />
              <polygon points="120,155 130,151 130,159" fill="#10b981" />
              <polygon points="460,155 450,151 450,159" fill="#10b981" />

              <rect x="235" y="142" width="110" height="24" rx="4" fill="#047857" stroke="#34d399" strokeWidth="1.2" />
              <text x="290" y="158" fill="#ffffff" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                142.500 +0.50
              </text>
            </g>

            {/* 3. Outer Diameter Dimension: Ø140.000 */}
            <g className="cursor-pointer" onClick={() => setSelectedPin(3)}>
              <line x1="80" y1="180" x2="115" y2="180" stroke={currentScheme.strokeColor} strokeWidth="1" strokeDasharray="3 2" />
              <line x1="80" y1="420" x2="115" y2="420" stroke={currentScheme.strokeColor} strokeWidth="1" strokeDasharray="3 2" />
              <line x1="85" y1="180" x2="85" y2="420" stroke="#f59e0b" strokeWidth="1.8" />
              <polygon points="85,180 81,190 89,190" fill="#f59e0b" />
              <polygon points="85,420 81,410 89,410" fill="#f59e0b" />

              <rect x="35" y="288" width="98" height="24" rx="4" fill="#b45309" stroke="#fbbf24" strokeWidth="1.2" />
              <text x="84" y="304" fill="#ffffff" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                Ø140.00 mm
              </text>
            </g>

            {/* GD&T Tolerance Feature Control Frames */}
            {/* Runout to Datum A */}
            <g transform="translate(360, 95)">
              <rect x="0" y="0" width="130" height="24" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.2" />
              <line x1="30" y1="0" x2="30" y2="24" stroke="#38bdf8" strokeWidth="1" />
              <line x1="85" y1="0" x2="85" y2="24" stroke="#38bdf8" strokeWidth="1" />
              {/* Circular runout symbol */}
              <text x="15" y="16" fill="#38bdf8" fontSize="13" fontWeight="bold" textAnchor="middle">↗</text>
              <text x="58" y="16" fill="#f8fafc" fontSize="11" fontFamily="monospace" textAnchor="middle">0.030</text>
              <text x="108" y="16" fill="#f8fafc" fontSize="11" fontFamily="monospace" textAnchor="middle">A</text>
              {/* Leader arrow pointing to OD */}
              <path d="M 65 24 L 65 45 L 200 180" fill="none" stroke="#38bdf8" strokeWidth="1" />
            </g>

            {/* Datum A Flag Symbol on Face */}
            <g transform="translate(120, 240)">
              <line x1="0" y1="0" x2="-25" y2="0" stroke="#f43f5e" strokeWidth="2" />
              <polygon points="-25,0 -40,-8 -40,8" fill="#f43f5e" />
              <rect x="-65" y="-12" width="24" height="24" fill="#881337" stroke="#f43f5e" strokeWidth="1.5" />
              <text x="-53" y="4" fill="#ffffff" fontSize="12" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                A
              </text>
            </g>

            {/* Surface Finish Ra 1.6 Callout */}
            <g transform="translate(480, 230)">
              {/* Checkmark style machining finish symbol */}
              <path d="M 0 15 L 8 0 L 22 0" fill="none" stroke="#a855f7" strokeWidth="1.8" />
              <line x1="0" y1="15" x2="0" y2="25" stroke="#a855f7" strokeWidth="1.5" />
              <text x="16" y="-3" fill="#d8b4fe" fontSize="11" fontFamily="monospace" fontWeight="bold">
                Ra 1.6
              </text>
              <text x="16" y="10" fill="#c084fc" fontSize="9" fontFamily="sans-serif">
                Ground / Turned
              </text>
            </g>
          </svg>
        </div>

        {/* Floating Quick Dimension Inspector Panel */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-700/80 rounded-lg p-2.5 backdrop-blur-md max-w-sm text-xs text-slate-200 shadow-xl pointer-events-auto">
          <div className="flex items-center gap-1.5 font-semibold text-cyan-300 pb-1 border-b border-slate-700/60 mb-1.5">
            <Crosshair size={14} />
            <span>Critical Inspection Dimensions (Click to inspect)</span>
          </div>
          <div className="space-y-1">
            {media.cadDetails?.map((dim, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedPin(idx + 1);
                  if (onSelectDimension) onSelectDimension(dim);
                }}
                className={`w-full flex items-center justify-between px-2 py-1 rounded transition text-left ${
                  selectedPin === idx + 1
                    ? 'bg-cyan-900/60 border border-cyan-500/80 text-cyan-100 font-medium'
                    : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className={`w-2 h-2 rounded-full ${dim.criticalToQuality ? 'bg-amber-400' : 'bg-cyan-400'}`} />
                  <span className="truncate">{dim.parameter}</span>
                </div>
                <span className="font-mono text-cyan-200 shrink-0 ml-2">
                  {dim.nominal.toFixed(3)} {dim.unit}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Pan & Drag Hint */}
        <div className="absolute top-3 left-3 bg-slate-950/60 border border-slate-700/40 px-2 py-1 rounded text-[11px] text-slate-400 flex items-center gap-1.5 pointer-events-none">
          <Info size={12} className="text-cyan-400" />
          <span>Click & drag to pan · Use controls to zoom</span>
        </div>
      </div>
    </div>
  );
};
