// src/components/landed-cost/LandedCostRuleVisualizer.tsx

import React, { useState } from 'react';
import {
  Scale,
  DollarSign,
  Package,
  Layers,
  ArrowRight,
  Info,
  CheckCircle2,
  Sparkles,
  BarChart3,
  HelpCircle,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import {
  LandedCostVoucher,
  LandedCostAllocationRule,
  LandedCostRuleComparisonResult
} from '../../types/landedCost';
import { landedCostService, ALLOCATION_RULES_METADATA } from '../../services/landedCostService';

interface LandedCostRuleVisualizerProps {
  voucher: LandedCostVoucher;
  onApplyRule?: (rule: LandedCostAllocationRule) => void;
}

export const LandedCostRuleVisualizer: React.FC<LandedCostRuleVisualizerProps> = ({
  voucher,
  onApplyRule
}) => {
  const [selectedRule, setSelectedRule] = useState<LandedCostAllocationRule>(voucher.defaultAllocationRule);

  const comparison = React.useMemo(() => {
    return landedCostService.compareAllocationRules(voucher.charges, voucher.lotLines);
  }, [voucher.charges, voucher.lotLines]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  const getRuleIcon = (rule: LandedCostAllocationRule) => {
    switch (rule) {
      case 'by_weight':
        return <Scale className="w-4 h-4 text-emerald-400" />;
      case 'by_value':
        return <DollarSign className="w-4 h-4 text-indigo-400" />;
      case 'by_quantity':
        return <Package className="w-4 h-4 text-amber-400" />;
      default:
        return <Layers className="w-4 h-4 text-purple-400" />;
    }
  };

  const currentResult = comparison.find((c) => c.rule === selectedRule) || comparison[0];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
              <BarChart3 className="w-4 h-4" />
            </span>
            <h3 className="text-base font-semibold text-white">
              Multi-Rule Allocation Simulator & Audit Comparison
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Compare cost absorption across <strong className="text-slate-300">By Weight</strong>, <strong className="text-slate-300">By Value</strong>, and <strong className="text-slate-300">By Quantity</strong> rules for voucher <span className="font-mono text-cyan-400">{voucher.voucherNumber}</span>
          </p>
        </div>

        {onApplyRule && voucher.status === 'draft' && (
          <button
            onClick={() => onApplyRule(selectedRule)}
            disabled={selectedRule === voucher.defaultAllocationRule}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              selectedRule === voucher.defaultAllocationRule
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Apply {ALLOCATION_RULES_METADATA[selectedRule]?.name}
          </button>
        )}
      </div>

      {/* Rule Selection Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {comparison.map((comp) => {
          const isSelected = selectedRule === comp.rule;
          const isCurrentDefault = voucher.defaultAllocationRule === comp.rule;

          return (
            <div
              key={comp.rule}
              onClick={() => setSelectedRule(comp.rule)}
              className={`p-3.5 rounded-xl border cursor-pointer transition relative ${
                isSelected
                  ? 'bg-slate-800/90 border-cyan-500 ring-1 ring-cyan-500/40 shadow-md'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-slate-800">{getRuleIcon(comp.rule)}</span>
                  <span className="text-xs font-bold text-white">{comp.ruleName}</span>
                </div>
                {isCurrentDefault && (
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.5 rounded font-mono">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-2.5">
                {comp.ruleDescription}
              </p>
              <div className="text-[10px] text-slate-400 bg-slate-900/80 p-2 rounded border border-slate-800/80">
                <strong className="text-slate-300 block mb-0.5">Recommended For:</strong>
                {comp.recommendedFor}
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparative Simulation Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/70">
        <div className="px-4 py-3 bg-slate-900/60 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Allocated Cost & Unit Rate Matrix ({ALLOCATION_RULES_METADATA[selectedRule]?.name})
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Total Charges to Distribute: <strong className="text-white">{formatCurrency(voucher.totalLandedCharges)}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/40 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">Lot Number</th>
                <th className="py-2.5 px-3">Material & Item</th>
                <th className="py-2.5 px-3 text-right">Base Unit Cost</th>
                <th className="py-2.5 px-3 text-right">Allocated Share</th>
                <th className="py-2.5 px-3 text-right">Landed Surcharge/Unit</th>
                <th className="py-2.5 px-3 text-right">True Landed Cost/Unit</th>
                <th className="py-2.5 px-3 text-right">Cost Markup %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {currentResult.allocations.map((alloc) => {
                const rawLine = voucher.lotLines.find((l) => l.id === alloc.lotLineId);
                return (
                  <tr key={alloc.lotLineId} className="hover:bg-slate-900/50 transition">
                    <td className="py-2.5 px-3 font-semibold text-cyan-300">
                      {alloc.lotNumber}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <div className="text-slate-200 font-medium">{alloc.itemName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {alloc.itemCode} • {rawLine?.quantity} {rawLine?.uom} ({rawLine?.weightKg} kg)
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      {formatCurrency(alloc.baseUnitCost)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-white font-semibold">
                      {formatCurrency(alloc.allocatedAmount)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold">
                      +{formatCurrency(alloc.allocatedUnitCost)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-cyan-300 font-bold bg-cyan-950/20">
                      {formatCurrency(alloc.trueLandedCost)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="inline-flex items-center gap-0.5 text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded text-[10px] border border-amber-800/50">
                        <TrendingUp className="w-2.5 h-2.5" />
                        +{alloc.markupPercent.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Variance Analysis Callout */}
      <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-lg text-xs text-slate-400 space-y-1">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
          Financial Rule Variance Analysis
        </div>
        <p className="text-[11px] leading-relaxed">
          Switching between <span className="text-white font-medium">By Weight</span> and <span className="text-white font-medium">By Value</span> shifts cost absorption between heavy, lower-value commodities (e.g. wire rod coils) and lighter, high-precision components (e.g. carbide dies). Select the rule that best matches the cost driver of the invoice charges.
        </p>
      </div>
    </div>
  );
};
