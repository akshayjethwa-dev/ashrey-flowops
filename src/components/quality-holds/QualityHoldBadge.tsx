// src/components/quality-holds/QualityHoldBadge.tsx

import React from 'react';
import { ShieldAlert, ShieldCheck, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { QualityHoldStatus, QualityHoldSeverity } from '../../types/qualityHold';

interface QualityHoldBadgeProps {
  status: QualityHoldStatus;
  severity?: QualityHoldSeverity;
  holdId?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const QualityHoldBadge: React.FC<QualityHoldBadgeProps> = ({
  status,
  severity,
  holdId,
  size = 'md',
  showLabel = true
}) => {
  const sizeClasses = {
    sm: 'text-[9px] px-1.5 py-0.5 gap-1',
    md: 'text-[11px] px-2.5 py-1 gap-1.5',
    lg: 'text-xs px-3 py-1.5 gap-2 font-bold'
  }[size];

  if (status === 'active_hold') {
    const isCritical = severity === 'critical';
    return (
      <span
        className={`inline-flex items-center rounded-md font-mono font-semibold uppercase tracking-wider ${
          isCritical
            ? 'bg-rose-950/80 text-rose-300 border border-rose-500/50 shadow-sm shadow-rose-900/30 animate-pulse'
            : 'bg-amber-950/80 text-amber-300 border border-amber-500/50'
        } ${sizeClasses}`}
        title={`Quality Hold Active${holdId ? ` [${holdId}]` : ''} - Dispatch Blocked`}
      >
        <AlertOctagon className={size === 'sm' ? 'w-3 h-3 text-rose-400' : 'w-3.5 h-3.5 text-rose-400'} />
        {showLabel && (
          <span>
            QUALITY HOLD {holdId ? `· ${holdId}` : ''}
          </span>
        )}
      </span>
    );
  }

  if (status === 'released') {
    return (
      <span
        className={`inline-flex items-center rounded-md font-mono font-semibold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 ${sizeClasses}`}
        title="Quality Hold Formally Released by Quality Authority"
      >
        <ShieldCheck className={size === 'sm' ? 'w-3 h-3 text-emerald-400' : 'w-3.5 h-3.5 text-emerald-400'} />
        {showLabel && <span>HOLD RELEASED</span>}
      </span>
    );
  }

  if (status === 'quarantined') {
    return (
      <span
        className={`inline-flex items-center rounded-md font-mono font-semibold uppercase tracking-wider bg-red-950/90 text-red-300 border border-red-600/60 ${sizeClasses}`}
        title="Hard Material Quarantine - MRB Cage"
      >
        <ShieldAlert className={size === 'sm' ? 'w-3 h-3 text-red-400' : 'w-3.5 h-3.5 text-red-400'} />
        {showLabel && <span>QUARANTINED (MRB)</span>}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-md font-mono font-semibold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 ${sizeClasses}`}
    >
      <CheckCircle2 className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {showLabel && <span>SCRAPPED</span>}
    </span>
  );
};
