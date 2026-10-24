// src/components/cost-rollup/WorkOrderCostDetailModal.tsx

import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Layers,
  Clock,
  Factory,
  Package,
  Sliders,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  Plus,
  Play,
  RotateCcw,
  Sparkles,
  Info,
  Calendar,
  Building,
  User
} from 'lucide-react';
import {
  WorkOrderCostRollup,
  OverheadAllocationConfig
} from '../../types/costRollup';
import { costRollupService } from '../../services/costRollupService';

interface WorkOrderCostDetailModalProps {
  rollup: WorkOrderCostRollup;
  onClose: () => void;
  onOpenIssueMaterial: (workOrderId: string) => void;
  onRefresh: () => void;
}

export const WorkOrderCostDetailModal: React.FC<WorkOrderCostDetailModalProps> = ({
  rollup,
  onClose,
  onOpenIssueMaterial,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'waterfall' | 'materials' | 'labor' | 'machine' | 'overhead' | 'simulator'>('waterfall');

  // What-If Simulator state
  const [simPrice, setSimPrice] = useState<number>(rollup.contractPricePerUnit);
  const [simMaterialDelta, setSimMaterialDelta] = useState<number>(0);
  const [simLaborDelta, setSimLaborDelta] = useState<number>(0);

  const simulationResult = costRollupService.simulateMargin(rollup.workOrderId, {
    sellingPricePerUnit: simPrice,
    materialCostAdjustmentPercent: simMaterialDelta,
    laborHoursAdjustmentPercent: simLaborDelta
  });

  const getMarginBadge = (health: string, margin: number) => {
    switch (health) {
      case 'high_margin':
        return {
          bg: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
          dot: 'bg-emerald-400',
          label: `High Margin (${margin}%)`
        };
      case 'healthy':
        return {
          bg: 'bg-sky-950/70 border-sky-500/40 text-sky-300',
          dot: 'bg-sky-400',
          label: `Healthy Margin (${margin}%)`
        };
      case 'at_risk':
        return {
          bg: 'bg-amber-950/70 border-amber-500/40 text-amber-300',
          dot: 'bg-amber-400',
          label: `At Risk (${margin}%)`
        };
      case 'loss_making':
      default:
        return {
          bg: 'bg-rose-950/70 border-rose-500/40 text-rose-300',
          dot: 'bg-rose-400 animate-pulse',
          label: `Loss-Making (${margin}%)`
        };
    }
  };

  const marginBadge = getMarginBadge(rollup.marginHealth, rollup.actualGrossMarginPercent);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                {rollup.workOrderNumber}
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                SO: {rollup.salesOrderNumber}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${marginBadge.bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${marginBadge.dot}`}></span>
                {marginBadge.label}
              </span>
              {rollup.isLiveRunning && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 animate-pulse">
                  <Play size={10} className="fill-emerald-400" />
                  Live Shop Floor Running
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {rollup.partName}
              <span className="text-xs text-slate-400 font-mono font-normal">({rollup.partCode})</span>
            </h2>
            <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
              <span className="flex items-center gap-1">
                <Building size={12} className="text-slate-500" /> {rollup.customerName}
              </span>
              <span>•</span>
              <span>Batch Qty: <strong className="text-slate-200">{rollup.quantity} units</strong></span>
              <span>•</span>
              <span>Selling Price: <strong className="text-slate-200">₹{rollup.contractPricePerUnit.toLocaleString()} / unit</strong></span>
              <span>•</span>
              <span>Total Revenue: <strong className="text-emerald-400">₹{rollup.totalRevenue.toLocaleString()}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenIssueMaterial(rollup.workOrderId)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition shadow"
            >
              <Plus size={13} />
              Issue Material
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 bg-slate-900/90 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'waterfall', label: 'Cost Waterfall & P&L', icon: TrendingUp },
            { id: 'materials', label: `Materials (${rollup.materialItems.length})`, icon: Package },
            { id: 'labor', label: `Shop Floor Labor (${rollup.laborLogs.length})`, icon: User },
            { id: 'machine', label: `Machine Hours (${rollup.machineLogs.length})`, icon: Factory },
            { id: 'overhead', label: 'Overhead Allocation', icon: Layers },
            { id: 'simulator', label: 'What-If Simulator', icon: Sliders }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? 'border-indigo-500 text-indigo-400 bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: WATERFALL & P&L */}
          {activeTab === 'waterfall' && (
            <div className="space-y-6">
              {/* Top High-level Financial Summary Card */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-xl space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Total Revenue</span>
                  <div className="text-xl font-bold text-white font-mono">
                    ₹{rollup.totalRevenue.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-400">
                    {rollup.quantity} units @ ₹{rollup.contractPricePerUnit.toLocaleString()}
                  </div>
                </div>

                <div className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-xl space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Actual Total Cost</span>
                  <div className="text-xl font-bold text-amber-300 font-mono">
                    ₹{rollup.actualTotalCost.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <span>Std: ₹{rollup.standardTotalCost.toLocaleString()}</span>
                    <span className={`font-semibold ${rollup.totalCostVariance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      ({rollup.totalCostVariance > 0 ? '+' : ''}{rollup.totalCostVariancePercent}%)
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-xl space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Realized Gross Profit</span>
                  <div className={`text-xl font-bold font-mono ${rollup.actualGrossProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ₹{rollup.actualGrossProfit.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-400">
                    Std Budget: ₹{rollup.standardGrossProfit.toLocaleString()}
                  </div>
                </div>

                <div className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-xl space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Actual Gross Margin</span>
                  <div className={`text-2xl font-black font-mono ${
                    rollup.actualGrossMarginPercent >= 25 ? 'text-emerald-400' :
                    rollup.actualGrossMarginPercent >= 15 ? 'text-sky-400' :
                    rollup.actualGrossMarginPercent >= 0 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {rollup.actualGrossMarginPercent}%
                  </div>
                  <div className="text-xs text-slate-400">
                    Target Quote: {rollup.standardGrossMarginPercent}% ({rollup.marginVariancePercent > 0 ? '+' : ''}{rollup.marginVariancePercent}%)
                  </div>
                </div>
              </div>

              {/* Cost Waterfall Breakdown Component Comparison */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center justify-between">
                  <span>Manufacturing Cost Element Breakdown</span>
                  <span className="text-xs text-slate-400 font-normal">Actual Incurred vs Standard Budgeted</span>
                </h3>

                <div className="space-y-3.5">
                  {[
                    {
                      label: 'Direct Materials',
                      actual: rollup.actualMaterialCost,
                      std: rollup.standardMaterialCost,
                      variance: rollup.materialVarianceCost,
                      pct: rollup.materialVariancePercent,
                      color: 'bg-blue-500',
                      icon: Package
                    },
                    {
                      label: 'Direct Labor (Shop Floor Time)',
                      actual: rollup.actualLaborCost,
                      std: rollup.standardLaborCost,
                      variance: rollup.laborVarianceCost,
                      pct: rollup.laborVariancePercent,
                      color: 'bg-emerald-500',
                      icon: User
                    },
                    {
                      label: 'Machine Hours & Depreciation',
                      actual: rollup.actualMachineCost,
                      std: rollup.standardMachineCost,
                      variance: rollup.machineVarianceCost,
                      pct: rollup.machineVariancePercent,
                      color: 'bg-amber-500',
                      icon: Factory
                    },
                    {
                      label: 'Subcontract Processing',
                      actual: rollup.actualSubcontractCost,
                      std: rollup.standardSubcontractCost,
                      variance: rollup.subcontractVarianceCost,
                      pct: rollup.standardSubcontractCost > 0 ? (rollup.subcontractVarianceCost / rollup.standardSubcontractCost) * 100 : 0,
                      color: 'bg-purple-500',
                      icon: Building
                    },
                    {
                      label: 'Factory & Plant Overhead',
                      actual: rollup.allocatedFactoryOverheadCost,
                      std: rollup.standardOverheadCost - rollup.allocatedSgaOverheadCost,
                      variance: rollup.allocatedFactoryOverheadCost - (rollup.standardOverheadCost - rollup.allocatedSgaOverheadCost),
                      pct: 0,
                      color: 'bg-indigo-500',
                      icon: Layers
                    },
                    {
                      label: 'Selling, General & Admin (SG&A)',
                      actual: rollup.allocatedSgaOverheadCost,
                      std: rollup.allocatedSgaOverheadCost,
                      variance: 0,
                      pct: 0,
                      color: 'bg-slate-400',
                      icon: Building
                    }
                  ].map((elem, idx) => {
                    const share = rollup.actualTotalCost > 0 ? (elem.actual / rollup.actualTotalCost) * 100 : 0;
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-300 flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-sm ${elem.color}`} />
                            {elem.label}
                            <span className="text-slate-500 text-[11px]">({share.toFixed(1)}% of total)</span>
                          </span>
                          <div className="flex items-center gap-3 font-mono">
                            <span className="text-slate-400">Std: ₹{elem.std.toLocaleString()}</span>
                            <span className="font-semibold text-slate-200">Actual: ₹{elem.actual.toLocaleString()}</span>
                            <span className={`font-semibold text-[11px] ${elem.variance > 0 ? 'text-rose-400' : elem.variance < 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                              {elem.variance > 0 ? `+₹${elem.variance.toLocaleString()}` : elem.variance < 0 ? `-₹${Math.abs(elem.variance).toLocaleString()}` : '±0'}
                            </span>
                          </div>
                        </div>
                        {/* Visual Progress Bar */}
                        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden flex">
                          <div
                            className={`h-full ${elem.color} transition-all duration-500`}
                            style={{ width: `${Math.min(100, share)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Unit Cost Economics */}
                <div className="mt-4 pt-4 border-t border-slate-700/70 flex items-center justify-between text-xs flex-wrap gap-2">
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400">Unit Cost Economics:</span>
                    <span>Std Cost/Unit: <strong className="font-mono text-slate-200">₹{rollup.standardUnitCost}</strong></span>
                    <span>Actual Cost/Unit: <strong className={`font-mono ${rollup.actualUnitCost > rollup.standardUnitCost ? 'text-rose-400' : 'text-emerald-400'}`}>₹{rollup.actualUnitCost}</strong></span>
                    <span>Contract Revenue/Unit: <strong className="font-mono text-indigo-300">₹{rollup.contractPricePerUnit}</strong></span>
                  </div>
                  <div className="font-medium text-slate-300">
                    Net Margin / Unit: <strong className="font-mono text-emerald-400">₹{(rollup.contractPricePerUnit - rollup.actualUnitCost).toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MATERIAL CONSUMPTION */}
          {activeTab === 'materials' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Direct Material Consumption & Inventory Issuance</h3>
                  <p className="text-xs text-slate-400">Actual physical stock lot withdrawals reconciled against engineering BOM</p>
                </div>
                <button
                  onClick={() => onOpenIssueMaterial(rollup.workOrderId)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Plus size={13} />
                  Issue Additional Lot / Scrap Replacement
                </button>
              </div>

              <div className="border border-slate-700/70 rounded-xl overflow-hidden bg-slate-900/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-300 font-semibold border-b border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Material & Item Code</th>
                      <th className="py-2.5 px-3">Lot & Heat #</th>
                      <th className="py-2.5 px-3">Location / Bin</th>
                      <th className="py-2.5 px-3 text-right">Std Qty</th>
                      <th className="py-2.5 px-3 text-right">Actual Issued</th>
                      <th className="py-2.5 px-3 text-right">Unit Rate</th>
                      <th className="py-2.5 px-3 text-right">Actual Cost</th>
                      <th className="py-2.5 px-3 text-right">Variance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {rollup.materialItems.map((mat) => (
                      <tr key={mat.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-white">{mat.materialName}</div>
                          <div className="text-[11px] font-mono text-slate-400">{mat.materialCode}</div>
                          {mat.notes && <div className="text-[10px] text-indigo-300 mt-0.5">{mat.notes}</div>}
                        </td>
                        <td className="py-3 px-3 font-mono text-xs">
                          <span className="text-slate-200">{mat.lotNumber}</span>
                          {mat.heatNumber && <div className="text-[10px] text-slate-400">{mat.heatNumber}</div>}
                        </td>
                        <td className="py-3 px-3 text-[11px] text-slate-400">
                          {mat.binCode}
                        </td>
                        <td className="py-3 px-3 text-right font-mono">
                          {mat.standardRequiredQty} {mat.unit}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-100">
                          {mat.actualIssuedQty} {mat.unit}
                        </td>
                        <td className="py-3 px-3 text-right font-mono">
                          ₹{mat.actualUnitCost}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-white">
                          ₹{mat.actualTotalCost.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            mat.varianceCost > 0 
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                              : mat.varianceCost < 0 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'text-slate-400'
                          }`}>
                            {mat.varianceCost > 0 ? `+₹${mat.varianceCost.toLocaleString()}` : mat.varianceCost < 0 ? `-₹${Math.abs(mat.varianceCost).toLocaleString()}` : '±0'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-800/80 font-bold border-t border-slate-700 text-xs">
                    <tr>
                      <td colSpan={6} className="py-2.5 px-3 text-slate-300 text-right">
                        Total Direct Material Cost:
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-white">
                        ₹{rollup.actualMaterialCost.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-400">
                        {rollup.materialVarianceCost > 0 ? `+₹${rollup.materialVarianceCost.toLocaleString()}` : '₹0'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: SHOP FLOOR LABOR TIME CAPTURE */}
          {activeTab === 'labor' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Shop Floor Operator Labor Time Capture
                    {rollup.activeOperatorCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        {rollup.activeOperatorCount} Operator Active
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">Connected to Time Capture Kiosk job tickets, operator badges, and setup/run logs</p>
                </div>
              </div>

              <div className="border border-slate-700/70 rounded-xl overflow-hidden bg-slate-900/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-300 font-semibold border-b border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Operation</th>
                      <th className="py-2.5 px-3">Operator & Badge</th>
                      <th className="py-2.5 px-3">Hourly Rate</th>
                      <th className="py-2.5 px-3 text-right">Setup Mins</th>
                      <th className="py-2.5 px-3 text-right">Run Mins</th>
                      <th className="py-2.5 px-3 text-right">Total Mins</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                      <th className="py-2.5 px-3 text-right">Labor Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {rollup.laborLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-white">Op {log.operationSequence}: {log.operationName}</div>
                          <div className="text-[10px] text-slate-400">{log.role} ({log.skillLevel})</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-200">{log.operatorName}</div>
                          <div className="text-[11px] font-mono text-indigo-400">{log.operatorBadgeNumber}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300">
                          ₹{log.hourlyRate} / hr
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-400">
                          {log.actualSetupMinutes}m
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-300">
                          {log.actualRunMinutes}m
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-white">
                          {log.totalActualMinutes}m
                          <span className="text-[10px] text-slate-500 block font-normal">({(log.totalActualMinutes / 60).toFixed(1)}h)</span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {log.isLiveRunning ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                              RUNNING
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                              COMPLETED
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-100">
                          ₹{log.totalLaborCost.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-800/80 font-bold border-t border-slate-700 text-xs">
                    <tr>
                      <td colSpan={7} className="py-2.5 px-3 text-slate-300 text-right">
                        Total Direct Labor Cost:
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                        ₹{rollup.actualLaborCost.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: MACHINE HOURS */}
          {activeTab === 'machine' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Machine Operating Hours & Work Center Rates</h3>
                <p className="text-xs text-slate-400">Machine hourly rate (MHR), depreciation, electricity load, and tooling allowance</p>
              </div>

              <div className="border border-slate-700/70 rounded-xl overflow-hidden bg-slate-900/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-300 font-semibold border-b border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Work Center / Machine</th>
                      <th className="py-2.5 px-3">MHR Rate</th>
                      <th className="py-2.5 px-3 text-right">Power & Tooling</th>
                      <th className="py-2.5 px-3 text-right">Setup Time</th>
                      <th className="py-2.5 px-3 text-right">Run Time</th>
                      <th className="py-2.5 px-3 text-right">Total Machine Hrs</th>
                      <th className="py-2.5 px-3 text-right">Total Machine Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {rollup.machineLogs.map((mach) => (
                      <tr key={mach.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-white">{mach.machineName}</div>
                          <div className="text-[11px] font-mono text-indigo-400">{mach.machineCode}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300">
                          ₹{mach.hourlyRate} / hr
                          <span className="text-[10px] text-slate-500 block">Setup: ₹{mach.setupHourlyRate}/hr</span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-400">
                          {mach.powerRatingKw} kW
                          <span className="text-[10px] text-slate-500 block">Tooling: ₹{mach.toolingAllowancePerHr}/h</span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-400">
                          {mach.actualSetupMinutes}m
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-300">
                          {mach.actualRunMinutes}m
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-white">
                          {mach.totalMachineHours} hrs
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-amber-300">
                          ₹{mach.totalMachineCost.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-800/80 font-bold border-t border-slate-700 text-xs">
                    <tr>
                      <td colSpan={6} className="py-2.5 px-3 text-slate-300 text-right">
                        Total Machine & Work Center Cost:
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-400">
                        ₹{rollup.actualMachineCost.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: OVERHEAD ALLOCATION RULES */}
          {activeTab === 'overhead' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Applied Overhead Allocation Rule</h3>
                    <p className="text-xs text-indigo-400 font-medium">{rollup.overheadConfigApplied.name}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 text-xs font-mono font-semibold border border-indigo-500/30 uppercase">
                    {rollup.appliedAllocationMethod.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {rollup.overheadConfigApplied.notes}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Labor Absorption %</span>
                    <span className="text-base font-bold text-white font-mono">{rollup.overheadConfigApplied.laborOverheadPercent}%</span>
                    <span className="text-[10px] text-slate-500 block">Applied to Direct Labor</span>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Machine Hour Levy</span>
                    <span className="text-base font-bold text-white font-mono">₹{rollup.overheadConfigApplied.machineHourOverheadRate} / hr</span>
                    <span className="text-[10px] text-slate-500 block">Applied per machine hr</span>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Fixed Unit Charge</span>
                    <span className="text-base font-bold text-white font-mono">₹{rollup.overheadConfigApplied.factoryFixedRatePerUnit} / unit</span>
                    <span className="text-[10px] text-slate-500 block">Coolant & Shop Supps</span>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">SG&A Administration %</span>
                    <span className="text-base font-bold text-white font-mono">{rollup.overheadConfigApplied.generalAdminSgaPercent}%</span>
                    <span className="text-[10px] text-slate-500 block">Selling, Gen & Admin</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">Total Overhead Allocated to this Job:</span>
                  <span className="text-sm font-bold text-indigo-400">
                    Factory: ₹{rollup.allocatedFactoryOverheadCost.toLocaleString()} + SG&A: ₹{rollup.allocatedSgaOverheadCost.toLocaleString()} = ₹{rollup.totalOverheadCost.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: WHAT-IF SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="space-y-5">
              <div className="p-4 bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <Sparkles size={16} />
                  Margin Sensitivity & What-If Pricing Simulator
                </div>
                <p className="text-xs text-slate-300">
                  Simulate adjustments to selling price, raw material purchasing volatility, and shop floor cycle efficiency to evaluate their impact on this job's gross margin.
                </p>
              </div>

              {/* Slider Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Contract Price */}
                <div className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold">Selling Price / Unit</span>
                    <span className="font-mono font-bold text-indigo-400">₹{simPrice.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min={Math.round(rollup.contractPricePerUnit * 0.7)}
                    max={Math.round(rollup.contractPricePerUnit * 1.4)}
                    step={10}
                    value={simPrice}
                    onChange={(e) => setSimPrice(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>-30%</span>
                    <span>Orig: ₹{rollup.contractPricePerUnit}</span>
                    <span>+40%</span>
                  </div>
                </div>

                {/* 2. Material Cost Variation */}
                <div className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold">Material Cost / Scrap Delta</span>
                    <span className={`font-mono font-bold ${simMaterialDelta > 0 ? 'text-rose-400' : simMaterialDelta < 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {simMaterialDelta > 0 ? '+' : ''}{simMaterialDelta}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-20}
                    max={30}
                    step={1}
                    value={simMaterialDelta}
                    onChange={(e) => setSimMaterialDelta(Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>-20% discount</span>
                    <span>Baseline</span>
                    <span>+30% inflation</span>
                  </div>
                </div>

                {/* 3. Labor Efficiency Delta */}
                <div className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold">Labor Hours / Setup Delta</span>
                    <span className={`font-mono font-bold ${simLaborDelta > 0 ? 'text-rose-400' : simLaborDelta < 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {simLaborDelta > 0 ? '+' : ''}{simLaborDelta}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-25}
                    max={35}
                    step={1}
                    value={simLaborDelta}
                    onChange={(e) => setSimLaborDelta(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>-25% faster</span>
                    <span>Baseline</span>
                    <span>+35% delays</span>
                  </div>
                </div>
              </div>

              {/* Simulation Result Comparison */}
              <div className="p-5 bg-slate-800/60 border border-slate-700 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400">Simulated Outcome</h4>
                  <button
                    onClick={() => {
                      setSimPrice(rollup.contractPricePerUnit);
                      setSimMaterialDelta(0);
                      setSimLaborDelta(0);
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
                  >
                    <RotateCcw size={12} />
                    Reset to Actuals
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400">Simulated Revenue</span>
                    <div className="text-lg font-bold text-white font-mono">
                      ₹{(rollup.quantity * simPrice).toLocaleString()}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400">Simulated Total Cost</span>
                    <div className="text-lg font-bold text-amber-300 font-mono">
                      ₹{simulationResult.simulatedTotalCost.toLocaleString()}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400">Simulated Gross Profit</span>
                    <div className={`text-lg font-bold font-mono ${simulationResult.simulatedGrossProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ₹{simulationResult.simulatedGrossProfit.toLocaleString()}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400">Simulated Gross Margin</span>
                    <div className={`text-xl font-black font-mono ${
                      simulationResult.simulatedGrossMarginPercent >= 20 ? 'text-emerald-400' :
                      simulationResult.simulatedGrossMarginPercent >= 10 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {simulationResult.simulatedGrossMarginPercent}%
                      <span className="text-xs font-normal text-slate-400 ml-1">
                        ({simulationResult.marginDeltaPercent > 0 ? '+' : ''}{simulationResult.marginDeltaPercent}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-800/80 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Real-time shop floor calculations synced to Inventory and Time Capture</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
