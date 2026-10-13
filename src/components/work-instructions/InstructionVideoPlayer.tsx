// src/components/work-instructions/InstructionVideoPlayer.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Repeat,
  FastForward,
  Rewind,
  Video,
  Sparkles,
  Layers,
  AlertCircle
} from 'lucide-react';
import { InstructionMedia } from '../../types/workInstruction';

interface InstructionVideoPlayerProps {
  media: InstructionMedia;
  isTabletMode?: boolean;
}

export const InstructionVideoPlayer: React.FC<InstructionVideoPlayerProps> = ({
  media,
  isTabletMode = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [simulatedTime, setSimulatedTime] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const totalDuration = media.videoDurationSeconds || 45;

  // Handle simulated playback loop if video fails or is simulated mode
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && (hasVideoError || media.isVideoSimulated)) {
      interval = setInterval(() => {
        setSimulatedTime(prev => {
          const next = prev + 0.5 * playbackRate;
          if (next >= totalDuration) {
            if (isLooping) return 0;
            setIsPlaying(false);
            return totalDuration;
          }
          return next;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, hasVideoError, media.isVideoSimulated, playbackRate, isLooping, totalDuration]);

  useEffect(() => {
    if (hasVideoError || media.isVideoSimulated) {
      setProgress((simulatedTime / totalDuration) * 100);
    }
  }, [simulatedTime, totalDuration, hasVideoError, media.isVideoSimulated]);

  const togglePlay = () => {
    if (videoRef.current && !hasVideoError) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          setHasVideoError(true);
          setIsPlaying(true);
        });
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && !hasVideoError) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration || totalDuration;
      setProgress((cur / dur) * 100);
      setSimulatedTime(cur);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setProgress(val);
    const targetSec = (val / 100) * totalDuration;
    setSimulatedTime(targetSec);
    if (videoRef.current && !hasVideoError) {
      videoRef.current.currentTime = targetSec;
    }
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current && !hasVideoError) {
      videoRef.current.playbackRate = rate;
    }
  };

  const skipSeconds = (sec: number) => {
    if (videoRef.current && !hasVideoError) {
      videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration, videoRef.current.currentTime + sec));
    } else {
      setSimulatedTime(prev => Math.max(0, Math.min(totalDuration, prev + sec)));
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="relative flex flex-col bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl text-white">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-rose-500/20 text-rose-400">
            <Video size={16} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-100 truncate max-w-sm">
              {media.title}
            </div>
            <div className="text-[10px] text-slate-400">
              HD Shopfloor Standard Operating Demonstration (SOP Video)
            </div>
          </div>
        </div>

        {/* Video Mode Badge */}
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Tablet Offline Ready</span>
        </div>
      </div>

      {/* Main Video Viewport */}
      <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
        {/* Real HTML5 Video element */}
        {!hasVideoError ? (
          <video
            ref={videoRef}
            src={media.url}
            loop={isLooping}
            muted={isMuted}
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => {
              if (!isLooping) setIsPlaying(false);
            }}
            onError={() => setHasVideoError(true)}
            className="w-full h-full object-cover"
          />
        ) : null}

        {/* Simulated Animated Machine Cycle Screen (Offline Fallback & Simulation) */}
        {hasVideoError && (
          <div className="relative w-full h-full bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center p-6 text-center select-none">
            {/* SVG Machining Spindle Graphic with dynamic rotation animation */}
            <div className="relative mb-3">
              <svg width="180" height="180" viewBox="0 0 180 180" className="drop-shadow-lg">
                <circle cx="90" cy="90" r="76" fill="#1e293b" stroke="#38bdf8" strokeWidth="4" />
                <circle cx="90" cy="90" r="54" fill="#0f172a" stroke="#64748b" strokeWidth="2" strokeDasharray="6 4" />
                
                {/* 3 Chuck Jaws */}
                <rect x="80" y="20" width="20" height="30" rx="3" fill="#38bdf8" />
                <rect x="35" y="110" width="30" height="20" rx="3" fill="#38bdf8" />
                <rect x="115" y="110" width="30" height="20" rx="3" fill="#38bdf8" />

                {/* Rotating Spindle Center */}
                <g style={{
                  transformOrigin: '90px 90px',
                  transform: isPlaying ? `rotate(${(simulatedTime * 360) % 360}deg)` : 'rotate(0deg)',
                  transition: 'transform 0.1s linear'
                }}>
                  <circle cx="90" cy="90" r="30" fill="#0284c7" stroke="#bae6fd" strokeWidth="2" />
                  <line x1="90" y1="65" x2="90" y2="115" stroke="#ffffff" strokeWidth="3" />
                  <line x1="65" y1="90" x2="115" y2="90" stroke="#ffffff" strokeWidth="3" />
                </g>
              </svg>
            </div>

            <div className="text-sm font-semibold text-cyan-300 mb-1">
              {isPlaying ? 'Cycle Running — Spindle Speed: 1,450 RPM' : 'Cycle Paused'}
            </div>
            <p className="text-xs text-slate-400 max-w-md">
              {media.caption || 'Observe chip evacuation direction and spindle stop position before opening enclosure.'}
            </p>
          </div>
        )}

        {/* Big Center Play Button Overlay on Pause or Click */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-cyan-600/80 hover:bg-cyan-500 text-white flex items-center justify-center shadow-2xl backdrop-blur-sm active:scale-95 transition"
            title="Play Demonstration"
          >
            <Play size={32} className="ml-1" />
          </button>
        )}

        {/* Live Step Overlay Banner */}
        <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 text-xs">
          <span className="text-cyan-400 font-mono font-bold">CYCLE PHASE:</span>{' '}
          <span className="text-white">
            {simulatedTime < totalDuration * 0.3
              ? '1. Pre-clamp Alignment'
              : simulatedTime < totalDuration * 0.7
              ? '2. Tool In-feed & OD Roughing'
              : '3. Finish Pass & Spindle Stop'}
          </span>
        </div>
      </div>

      {/* Scrub bar */}
      <div className="px-3 pt-2 bg-slate-900">
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleSeek}
          className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
      </div>

      {/* Media Player Bottom Controls */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-slate-900 text-slate-200 gap-2">
        {/* Left: Play/Pause & Skips */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className={`p-2 rounded-lg font-medium transition active:scale-95 ${
              isPlaying ? 'bg-amber-600 text-white' : 'bg-cyan-600 text-white'
            }`}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>

          <button
            onClick={() => skipSeconds(-5)}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
            title="Rewind 5s"
          >
            <Rewind size={16} />
          </button>

          <button
            onClick={() => skipSeconds(5)}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
            title="Forward 5s"
          >
            <FastForward size={16} />
          </button>

          {/* Time display */}
          <div className="text-xs font-mono text-slate-300 ml-1">
            {formatTime(simulatedTime)} / {formatTime(totalDuration)}
          </div>
        </div>

        {/* Right: Loop, Speed, Audio */}
        <div className="flex items-center gap-2">
          {/* Continuous Loop Mode Toggle */}
          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`px-2 py-1 rounded text-xs flex items-center gap-1 border transition ${
              isLooping
                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 font-semibold'
                : 'border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Toggle Continuous Loop"
          >
            <Repeat size={14} />
            <span>Loop</span>
          </button>

          {/* Speed selector */}
          <div className="flex items-center bg-slate-800 rounded border border-slate-700 text-[11px]">
            {[0.5, 1.0, 1.5].map(rate => (
              <button
                key={rate}
                onClick={() => handleRateChange(rate)}
                className={`px-2 py-0.5 rounded transition ${
                  playbackRate === rate ? 'bg-cyan-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* Mute */}
          <button
            onClick={() => {
              setIsMuted(!isMuted);
              if (videoRef.current) videoRef.current.muted = !isMuted;
            }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};
