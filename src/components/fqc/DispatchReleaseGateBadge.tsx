// src/components/fqc/DispatchReleaseGateBadge.tsx

import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { fqcService } from '../../services/fqcService';

interface DispatchReleaseGateBadgeProps {
  orderIdOrNumber: string;
  className?: string;
  onClickInspect?: () => void;
  compact?: boolean;
}

export const DispatchReleaseGateBadge: React.FC<DispatchReleaseGateBadgeProps> = ({
  orderIdOrNumber,
  className = '',
  onClickInspect,
  compact = false
}) => {
  const check = fqcService.checkDispatchReleaseEligibility(orderIdOrNumber);

  if (check.isEligible && check.status === 'released') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ${className}`}
        title={`Cleared for Dispatch: ${check.message}`}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>FQC RELEASED</span>
        {!compact && check.cocNumber && (
          <span className="text-[10px] text-emerald-500 font-normal">({check.cocNumber})</span>
        )}
      </div>
    );
  }

  if (check.status === 'quarantined') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/40 animate-pulse ${className}`}
        title={`Hard Blocked: ${check.holdReason || check.message}`}
      >
        <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        <span>DISPATCH QUARANTINED</span>
      </div>
    );
  }

  // Auto-Hold or Not Initiated
  return (
    <div
      onClick={onClickInspect}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/40 ${
        onClickInspect ? 'cursor-pointer hover:bg-amber-500/25' : ''
      } ${className}`}
      title={check.holdReason || check.message}
    >
      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span>ON QUALITY HOLD (FQC)</span>
    </div>
  );
};
