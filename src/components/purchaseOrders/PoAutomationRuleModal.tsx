// src/components/purchaseOrders/PoAutomationRuleModal.tsx

import React, { useState } from 'react';
import {
  X,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  MessageSquare,
  Mail,
  DollarSign,
  TrendingUp,
  Info
} from 'lucide-react';
import { PoAutomationRule } from '../../types/purchaseOrder';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  rule: PoAutomationRule | null;
  onSave: (rule: PoAutomationRule) => Promise<any>;
}

export const PoAutomationRuleModal: React.FC<Props> = ({
  isOpen,
  onClose,
  rule,
  onSave
}) => {
  if (!isOpen) return null;

  const [enabled, setEnabled] = useState(rule?.enabled ?? true);
  const [autoApproveUnderAmount, setAutoApproveUnderAmount] = useState(
    rule?.autoApproveUnderAmount ?? 50000
  );
  const [managerApprovalLimit, setManagerApprovalLimit] = useState(
    rule?.managerApprovalLimit ?? 500000
  );
  const [autoNotifyVendor, setAutoNotifyVendor] = useState(
    rule?.autoNotifyVendorOnApproval ?? true
  );
  const [notifyChannel, setNotifyChannel] = useState<'whatsapp' | 'email' | 'both'>(
    rule?.notifyChannel ?? 'both'
  );
  const [safetyBufferMultiplier, setSafetyBufferMultiplier] = useState(
    rule?.safetyStockBufferMultiplier ?? 1.0
  );

  const [submitting, setSubmitting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await onSave({
        id: rule?.id || 'rule-po-default',
        tenantId: rule?.tenantId || 'tenant-default',
        enabled,
        autoApproveUnderAmount: Number(autoApproveUnderAmount),
        managerApprovalLimit: Number(managerApprovalLimit),
        autoNotifyVendorOnApproval: autoNotifyVendor,
        notifyChannel,
        safetyStockBufferMultiplier: Number(safetyBufferMultiplier)
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 700);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="fixed inset-0 z-[140] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl shadow-2xl text-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                PO Automation & Approval Policies
              </h2>
              <p className="text-xs text-slate-400">
                Configure auto-generation thresholds and multi-tier approval routing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6">
          {savedSuccess && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              PO automation rules successfully updated!
            </div>
          )}

          {/* Master Toggle */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400" />
                Enable Automated Reorder Level PO Engine
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically generate replenishment POs when bin/store inventory hits reorder point
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Tier 1: Auto-Approve Threshold */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Auto-Approval Limit (No Manual Sign-off Needed)
              </label>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {formatCurrency(Number(autoApproveUnderAmount))}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Orders equal to or below this total amount skip manual approval and are marked approved immediately.
            </p>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[25000, 50000, 100000, 200000].map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setAutoApproveUnderAmount(amt)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                    autoApproveUnderAmount === amt
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  ₹{(amt / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
            <div className="relative mt-2">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono text-xs">
                ₹
              </span>
              <input
                type="number"
                min={0}
                step={5000}
                value={autoApproveUnderAmount}
                onChange={(e) => setAutoApproveUnderAmount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Tier 2: Manager vs Executive Approval Tier */}
          <div className="space-y-2 border-t border-slate-800 pt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-indigo-400" />
                Procurement Manager Authorization Limit
              </label>
              <span className="text-xs font-mono font-bold text-indigo-400">
                {formatCurrency(Number(managerApprovalLimit))}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Orders exceeding this cap require high-level sign-off by VP Operations / Executive Finance.
            </p>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[200000, 500000, 1000000, 2500000].map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setManagerApprovalLimit(amt)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                    managerApprovalLimit === amt
                      ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  ₹{(amt / 100000).toFixed(1)}L
                </button>
              ))}
            </div>
            <div className="relative mt-2">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono text-xs">
                ₹
              </span>
              <input
                type="number"
                min={50000}
                step={25000}
                value={managerApprovalLimit}
                onChange={(e) => setManagerApprovalLimit(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Vendor Notification Channels */}
          <div className="space-y-3 border-t border-slate-800 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-emerald-400" />
                Auto-Notify Vendor Upon Approval
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoNotifyVendor}
                  onChange={(e) => setAutoNotifyVendor(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {autoNotifyVendor && (
              <div className="grid grid-cols-3 gap-2">
                {(['whatsapp', 'email', 'both'] as const).map((ch) => (
                  <button
                    type="button"
                    key={ch}
                    onClick={() => setNotifyChannel(ch)}
                    className={`py-2 px-3 rounded-xl text-xs font-mono font-bold border capitalize flex items-center justify-center gap-1.5 transition-all ${
                      notifyChannel === ch
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {ch === 'whatsapp' && <MessageSquare className="h-3.5 w-3.5" />}
                    {ch === 'email' && <Mail className="h-3.5 w-3.5" />}
                    {ch === 'both' && <Zap className="h-3.5 w-3.5" />}
                    {ch}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Safety Buffer Multiplier */}
          <div className="space-y-2 border-t border-slate-800 pt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-sky-400" />
                Reorder Buffer Multiplier
              </label>
              <span className="text-xs font-mono font-bold text-sky-400">
                {safetyBufferMultiplier.toFixed(1)}x
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Multiplier applied to standard replenishment lot size during volatile demand periods.
            </p>
            <input
              type="range"
              min={0.8}
              max={2.0}
              step={0.1}
              value={safetyBufferMultiplier}
              onChange={(e) => setSafetyBufferMultiplier(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>0.8x (Lean JIT)</span>
              <span>1.0x (Standard)</span>
              <span>1.5x (Seasonal Peak)</span>
              <span>2.0x (Buffer Heavy)</span>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              {submitting ? 'Saving Rules...' : 'Save Automation Policies'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
