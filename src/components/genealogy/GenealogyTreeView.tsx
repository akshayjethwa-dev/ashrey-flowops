// src/components/genealogy/GenealogyTreeView.tsx

import React, { useState } from 'react';
import {
  GitBranch,
  Layers,
  Cpu,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  FileText,
  Truck,
  Building2,
  ShieldCheck,
  Tag,
  ChevronRight,
  Info,
  Calendar,
  Sparkles,
  Search
} from 'lucide-react';
import { ProductionGenealogyRecord, OperationGenealogyStep } from '../../types/genealogy';

interface GenealogyTreeViewProps {
  record: ProductionGenealogyRecord;
  onSelectOperation?: (step: OperationGenealogyStep) => void;
  onOpenCompliance?: () => void;
}

export const GenealogyTreeView: React.FC<GenealogyTreeViewProps> = ({
  record,
  onSelectOperation,
  onOpenCompliance
}) => {
  const [activeStepId, setActiveStepId] = useState<string | null>(
    record.operations.length > 0 ? record.operations[0].stepId : null
  );

  const selectedStep = record.operations.find(o => o.stepId === activeStepId) || record.operations[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'passed':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40';
      case 'in_progress':
        return 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40 animate-pulse';
      case 'hold':
      case 'quarantined':
        return 'text-rose-400 bg-rose-950/60 border-rose-500/40';
      case 'marginal':
      case 'conditional':
        return 'text-amber-400 bg-amber-950/60 border-amber-500/40';
      default:
        return 'text-slate-400 bg-slate-900 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Tree Topology Flow Banner ─────────────────────────────────── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">
                  Interactive Production Genealogy Tree
                </h3>
                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${getStatusColor(record.status)}`}>
                  {record.status}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {record.trackingLevel === 'unit' ? 'Serial Unit' : `Batch (${record.batchQuantity} ${record.unitOfMeasure})`}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Upstream heat lots &rarr; Shop-floor operations (Machine + Operator + Timestamps) &rarr; Quality gate &rarr; Outbound dispatch.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onOpenCompliance && (
              <button
                onClick={onOpenCompliance}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/40 text-xs font-medium transition cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Certificate of Conformance</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Visual Multi-Tier Diagram ─────────────────────────────── */}
        <div className="relative overflow-x-auto pb-4">
          <div className="min-w-[860px] flex flex-col gap-6">

            {/* LEVEL 1: Upstream Raw Materials & Supplier Heat */}
            <div className="flex items-center gap-4">
              <div className="w-32 shrink-0 text-right pr-2">
                <span className="text-[11px] font-mono uppercase font-bold text-amber-400 tracking-wider">
                  Tier 1: Ingot / Heat
                </span>
                <p className="text-[10px] text-slate-500">Mill Origins</p>
              </div>

              <div className="flex-1 bg-amber-950/20 border border-amber-600/30 rounded-xl p-3.5 flex items-center justify-between hover:border-amber-500/60 transition group">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-200">
                        Heat # {record.rawMaterialSummary.heatNumber}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-300 font-mono">
                        {record.rawMaterialSummary.materialGrade}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {record.rawMaterialSummary.supplierName} &bull; PO: {record.rawMaterialSummary.poNumber}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>MTR Cert: {record.rawMaterialSummary.mtrNumber}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Parent Lot: {record.rawMaterialSummary.primaryLotNumber}
                  </span>
                </div>
              </div>
            </div>

            {/* Tree Branch Connector */}
            <div className="flex items-center pl-36">
              <div className="h-6 w-0.5 bg-gradient-to-b from-amber-500/60 to-indigo-500/60 ml-8" />
            </div>

            {/* LEVEL 2: Work Order, Product & Sales Order */}
            <div className="flex items-center gap-4">
              <div className="w-32 shrink-0 text-right pr-2">
                <span className="text-[11px] font-mono uppercase font-bold text-indigo-400 tracking-wider">
                  Tier 2: Work Order
                </span>
                <p className="text-[10px] text-slate-500">MES Traveler</p>
              </div>

              <div className="flex-1 bg-indigo-950/20 border border-indigo-600/30 rounded-xl p-3.5 flex items-center justify-between hover:border-indigo-500/60 transition">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-indigo-200">
                        {record.workOrderNumber}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-900/50 text-indigo-300 font-mono">
                        {record.partNumber} ({record.revision})
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 font-medium mt-0.5">
                      {record.partName}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{record.customerName}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    SO: {record.salesOrderNumber || 'N/A'} &bull; PO: {record.customerPoNumber || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tree Branch Connector */}
            <div className="flex items-center pl-36">
              <div className="h-6 w-0.5 bg-gradient-to-b from-indigo-500/60 to-cyan-500/60 ml-8" />
            </div>

            {/* LEVEL 3: Operation Steps Sequence (Node Chain) */}
            <div className="flex items-start gap-4">
              <div className="w-32 shrink-0 text-right pr-2 pt-2">
                <span className="text-[11px] font-mono uppercase font-bold text-cyan-400 tracking-wider">
                  Tier 3: Operations
                </span>
                <p className="text-[10px] text-slate-500">{record.operations.length} Stations</p>
              </div>

              <div className="flex-1 bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800 text-xs text-slate-400">
                  <span>Shop-Floor Sequential Execution Flow</span>
                  <span className="font-mono text-[11px] text-cyan-400">Click a station to inspect live parameters</span>
                </div>

                {/* Operations horizontal flow */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {record.operations.map((op, idx) => {
                    const isSelected = op.stepId === (selectedStep?.stepId || '');
                    return (
                      <div
                        key={op.stepId}
                        onClick={() => {
                          setActiveStepId(op.stepId);
                          if (onSelectOperation) onSelectOperation(op);
                        }}
                        className={`relative p-3 rounded-lg border transition cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-500/70 shadow-md ring-1 ring-cyan-500/40'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                        }`}
                      >
                        {/* Step Sequence Badge */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-mono font-bold flex items-center justify-center text-slate-300">
                              {op.sequence}
                            </span>
                            <span className="text-xs font-semibold text-slate-100 truncate">
                              {op.operationName}
                            </span>
                          </div>
                          <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${getStatusColor(op.status)}`}>
                            {op.status}
                          </span>
                        </div>

                        {/* Machine info */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-300 mb-1">
                          <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="font-mono text-[11px] text-cyan-300 truncate">{op.machineCode}</span>
                          <span className="text-slate-500 text-[11px] truncate">&bull; {op.machineName}</span>
                        </div>

                        {/* Operator info */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-300 mb-1.5">
                          <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="text-slate-300 text-[11px] truncate">{op.operatorName}</span>
                          <span className="text-emerald-400 font-mono text-[10px]">({op.operatorBadge})</span>
                        </div>

                        {/* Timestamps & Duration */}
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1.5 border-t border-slate-800/80">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{op.startedAt ? new Date(op.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}</span>
                          </div>
                          <span className="text-slate-300 font-bold">
                            {op.durationMinutes ? `${op.durationMinutes}m` : `${op.plannedDurationMinutes}m plan`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Tree Branch Connector */}
            <div className="flex items-center pl-36">
              <div className="h-6 w-0.5 bg-gradient-to-b from-cyan-500/60 to-emerald-500/60 ml-8" />
            </div>

            {/* LEVEL 4: Quality Gate & CMM Metrology Certificate */}
            <div className="flex items-center gap-4">
              <div className="w-32 shrink-0 text-right pr-2">
                <span className="text-[11px] font-mono uppercase font-bold text-emerald-400 tracking-wider">
                  Tier 4: Quality Gate
                </span>
                <p className="text-[10px] text-slate-500">Metrology Release</p>
              </div>

              <div className="flex-1 bg-emerald-950/20 border border-emerald-600/30 rounded-xl p-3.5 flex items-center justify-between hover:border-emerald-500/60 transition">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-200">
                        Disposition: {record.qualityDisposition.toUpperCase()}
                      </span>
                      {record.certificateOfConformanceNumber && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 font-mono">
                          {record.certificateOfConformanceNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Inspector: {record.finalQcInspector || 'Pending Final Metrology Release'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-mono text-emerald-400">
                    {record.finalQcDate ? new Date(record.finalQcDate).toLocaleString() : 'In-line inspections recorded'}
                  </span>
                  <div className="text-[10px] font-mono text-slate-500 truncate max-w-xs">
                    Hash: {record.complianceHash.substring(0, 20)}...
                  </div>
                </div>
              </div>
            </div>

            {/* LEVEL 5: Customer Dispatch (if completed/dispatched) */}
            {record.dispatchRecord && (
              <>
                <div className="flex items-center pl-36">
                  <div className="h-6 w-0.5 bg-gradient-to-b from-emerald-500/60 to-purple-500/60 ml-8" />
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-32 shrink-0 text-right pr-2">
                    <span className="text-[11px] font-mono uppercase font-bold text-purple-400 tracking-wider">
                      Tier 5: Dispatch
                    </span>
                    <p className="text-[10px] text-slate-500">Lorry / Shipment</p>
                  </div>

                  <div className="flex-1 bg-purple-950/20 border border-purple-600/30 rounded-xl p-3.5 flex items-center justify-between hover:border-purple-500/60 transition">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-purple-200">
                            Invoice: {record.dispatchRecord.invoiceNumber}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/50 text-purple-300 font-mono">
                            LR #{record.dispatchRecord.lorryReceiptNumber}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5">
                          {record.dispatchRecord.recipientPlant} &bull; {record.dispatchRecord.destinationCity}
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-xs font-mono text-purple-300">
                      <span>Dispatched on {new Date(record.dispatchRecord.dispatchDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>

      {/* ── Drill-down Step Inspector Panel ───────────────────────────── */}
      {selectedStep && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 font-mono text-xs font-bold">
                Op {selectedStep.sequence}
              </span>
              <h4 className="text-sm font-bold text-slate-100">
                {selectedStep.operationName} Detailed Telemetry
              </h4>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs text-slate-400">
              <span>Work Center: <strong className="text-slate-200">{selectedStep.workCenterName}</strong></span>
              <span>Machine: <strong className="text-cyan-300">{selectedStep.machineName} ({selectedStep.machineCode})</strong></span>
              <span>Operator: <strong className="text-emerald-300">{selectedStep.operatorName} ({selectedStep.operatorBadge})</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Timestamps & Cycle Time */}
            <div className="bg-slate-950/60 rounded-lg p-3.5 border border-slate-800/80 space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                Operation Timestamps & Duration
              </span>
              <div className="text-xs space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Start Time:</span>
                  <span className="text-slate-200">{selectedStep.startedAt ? new Date(selectedStep.startedAt).toLocaleString() : 'Not started'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Completion Time:</span>
                  <span className="text-slate-200">{selectedStep.completedAt ? new Date(selectedStep.completedAt).toLocaleString() : 'In-Progress'}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Actual Cycle Time:</span>
                  <span className="text-cyan-300 font-bold">{selectedStep.durationMinutes} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Standard Plan Time:</span>
                  <span className="text-slate-300">{selectedStep.plannedDurationMinutes} minutes</span>
                </div>
              </div>
            </div>

            {/* Quality Checks at this Station */}
            <div className="bg-slate-950/60 rounded-lg p-3.5 border border-slate-800/80 space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                In-Process QC Check Parameters
              </span>
              {selectedStep.qcParameters.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">No QC checks registered for this step yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {selectedStep.qcParameters.map((qc, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-slate-900/60 p-1.5 rounded border border-slate-800">
                      <div>
                        <div className="font-medium text-slate-200">{qc.paramName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Spec: {qc.specification}</div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${getStatusColor(qc.status)}`}>
                          {qc.measuredValue}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Machine Parameters & Log Notes */}
            <div className="bg-slate-950/60 rounded-lg p-3.5 border border-slate-800/80 space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                Machine Telemetry & Operator Notes
              </span>
              {selectedStep.machineParameters && (
                <div className="text-xs font-mono space-y-1 text-slate-300 bg-slate-900/60 p-2 rounded border border-slate-800">
                  {selectedStep.machineParameters.spindleSpeedRpm && (
                    <div>Spindle Speed: <span className="text-cyan-400">{selectedStep.machineParameters.spindleSpeedRpm} RPM</span></div>
                  )}
                  {selectedStep.machineParameters.feedRateMmpm && (
                    <div>Feed Rate: <span className="text-cyan-400">{selectedStep.machineParameters.feedRateMmpm} mm/min</span></div>
                  )}
                  {selectedStep.machineParameters.temperatureCelsius && (
                    <div>Furnace Temp: <span className="text-amber-400">{selectedStep.machineParameters.temperatureCelsius} &deg;C</span></div>
                  )}
                  {selectedStep.machineParameters.coolantConcentration && (
                    <div>Coolant: <span className="text-slate-300">{selectedStep.machineParameters.coolantConcentration}</span></div>
                  )}
                </div>
              )}
              {selectedStep.notes && (
                <p className="text-xs text-slate-300 italic bg-slate-900/40 p-2 rounded border border-slate-800/60">
                  &ldquo;{selectedStep.notes}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
