// src/components/traceability/GenealogyTraceGraphModal.tsx

import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  GitBranch,
  ShieldAlert,
  Printer,
  Package,
  Layers,
  Building2,
  Truck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  ChevronRight,
  ExternalLink,
  DollarSign,
  Clock,
  MapPin
} from 'lucide-react';
import {
  TraceabilityGraph,
  TraceabilityNode,
  TraceDirection,
  LotRecord
} from '../../types/traceability';
import { traceabilityService } from '../../services/traceabilityService';
import { useAuth } from '../../context/AuthContext';

interface GenealogyTraceGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLotNumber?: string;
  initialDirection?: TraceDirection;
  onInitiateRecall?: (lotNumber: string) => void;
  onPrintRecallReport?: (lotNumber: string) => void;
}

export const GenealogyTraceGraphModal: React.FC<GenealogyTraceGraphModalProps> = ({
  isOpen,
  onClose,
  initialLotNumber = 'LOT-2026-RM-0412',
  initialDirection = 'forward',
  onInitiateRecall,
  onPrintRecallReport
}) => {
  const { tenant } = useAuth();
  const tenantId = tenant?.id || 'demo-tenant';

  const [searchKey, setSearchKey] = useState<string>(initialLotNumber);
  const [direction, setDirection] = useState<TraceDirection>(initialDirection);
  const [graph, setGraph] = useState<TraceabilityGraph | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedNode, setSelectedNode] = useState<TraceabilityNode | null>(null);

  useEffect(() => {
    if (initialLotNumber) {
      setSearchKey(initialLotNumber);
    }
  }, [initialLotNumber]);

  useEffect(() => {
    if (isOpen) {
      loadTrace(searchKey, direction);
    }
  }, [isOpen, direction]);

  const loadTrace = async (key: string, dir: TraceDirection) => {
    setLoading(true);
    try {
      if (dir === 'forward') {
        const res = await traceabilityService.getForwardTrace(tenantId, key);
        setGraph(res);
        if (res.nodes.length > 0) setSelectedNode(res.nodes[0]);
      } else {
        const res = await traceabilityService.getBackwardTrace(tenantId, key);
        setGraph(res);
        if (res.nodes.length > 0) setSelectedNode(res.nodes[0]);
      }
    } catch (err) {
      console.error('Failed loading trace', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKey.trim()) {
      loadTrace(searchKey.trim(), direction);
    }
  };

  if (!isOpen) return null;

  const getNodeIcon = (type: TraceabilityNode['type']) => {
    switch (type) {
      case 'supplier':
        return Building2;
      case 'purchase_order':
        return FileText;
      case 'raw_lot':
        return Package;
      case 'inventory_bin':
        return MapPin;
      case 'work_order':
        return Layers;
      case 'fg_lot':
        return Package;
      case 'customer_dispatch':
        return Truck;
      default:
        return GitBranch;
    }
  };

  const getNodeTypeBadge = (type: TraceabilityNode['type']) => {
    switch (type) {
      case 'supplier':
        return { label: 'Certified Supplier', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'purchase_order':
        return { label: 'Inbound PO', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'raw_lot':
        return { label: 'Raw Material Lot', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'inventory_bin':
        return { label: 'Storage Bin Location', color: 'bg-slate-50 text-slate-700 border-slate-200' };
      case 'work_order':
        return { label: 'Work Order (WIP)', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'fg_lot':
        return { label: 'Finished Goods Lot', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'customer_dispatch':
        return { label: 'Customer Shipment', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      default:
        return { label: 'Genealogy Node', color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  // Recursive Tree Node Renderer
  const renderNode = (node: TraceabilityNode, depth: number = 0) => {
    const Icon = getNodeIcon(node.type);
    const badge = getNodeTypeBadge(node.type);
    const isSelected = selectedNode?.id === node.id;
    const isRecalled = node.severity === 'critical';

    return (
      <div key={node.id} className="relative flex flex-col space-y-3">
        <div
          onClick={() => setSelectedNode(node)}
          className={`cursor-pointer transition-all duration-150 p-4 rounded-xl border ${
            isSelected
              ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/40 shadow-md'
              : isRecalled
              ? 'border-rose-300 bg-rose-50/50 hover:bg-rose-50 hover:border-rose-400'
              : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div
                className={`p-2.5 rounded-lg border ${
                  isRecalled
                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                    : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                    {node.code}
                  </span>
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${badge.color}`}>
                    {badge.label}
                  </span>
                  {node.status && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isRecalled
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {node.status}
                    </span>
                  )}
                </div>
                <div className="text-sm font-bold text-slate-900 mt-1">{node.label}</div>
                {node.subLabel && <div className="text-xs text-slate-500 mt-0.5">{node.subLabel}</div>}
              </div>
            </div>

            {node.metrics && (
              <div className="hidden sm:flex flex-col items-end text-right">
                {Object.entries(node.metrics).slice(0, 2).map(([k, v]) => (
                  <div key={k} className="text-[11px] text-slate-500">
                    <span className="text-slate-400">{k}:</span> <span className="font-semibold text-slate-700">{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Child Connections */}
        {node.children && node.children.length > 0 && (
          <div className="pl-6 border-l-2 border-dashed border-indigo-200 ml-5 space-y-3">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-xl">
              <GitBranch className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-bold tracking-tight">Precision Genealogy & Traceability Graph</h3>
                <span className="bg-indigo-500/30 text-indigo-200 text-xs px-2.5 py-0.5 rounded-full font-medium border border-indigo-400/30">
                  {direction === 'forward' ? 'Forward Containment Tree' : 'Backward Root-Cause Tree'}
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">
                Complete multi-tier material genealogy connecting Supplier PO → Raw Lot → Work Order → Finished Goods → Dispatched Invoices.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Direction Toggle & Search Input */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Direction Switcher */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button
              onClick={() => {
                setDirection('forward');
              }}
              className={`flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                direction === 'forward'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Forward Trace (Impact Containment)</span>
            </button>
            <button
              onClick={() => {
                setDirection('backward');
              }}
              className={`flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                direction === 'backward'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Backward Trace (Root-Cause Discovery)</span>
            </button>
          </div>

          {/* Quick Search */}
          <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchKey}
                onChange={e => setSearchKey(e.target.value)}
                placeholder="Enter Lot #, Heat #, or WO #..."
                className="pl-9 pr-3 py-1.5 text-xs font-mono rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 w-64 bg-white"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              Trace Now
            </button>
          </form>
        </div>

        {/* Exposure Summary Cards (When Graph Loaded) */}
        {graph && (
          <div className="bg-white border-b border-slate-200 px-6 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Raw Material Lots</span>
              <span className="text-base font-bold text-slate-900">{graph.summary.totalRawLotsCount}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">WIP Work Orders</span>
              <span className="text-base font-bold text-purple-700">{graph.summary.totalWorkOrdersCount}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Finished Lots Produced</span>
              <span className="text-base font-bold text-emerald-700">{graph.summary.totalFinishedLotsCount}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Customers Dispatched</span>
              <span className="text-base font-bold text-rose-700">{graph.summary.totalCustomersAffected}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Units Exposed</span>
              <span className="text-base font-bold text-slate-900">{graph.summary.totalUnitsExposed}</span>
            </div>
            <div className="p-2.5 bg-indigo-50/60 rounded-lg border border-indigo-100">
              <span className="text-indigo-600 block text-[10px] uppercase font-bold">Valuation Exposure</span>
              <span className="text-base font-bold text-indigo-950">₹{graph.summary.totalValueExposed.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Main Body: Tree Viewer + Detail Inspector Drawer */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Tree Flow Column */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/40">
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                Generating comprehensive material genealogy graph...
              </div>
            ) : graph && graph.nodes.length > 0 ? (
              graph.nodes.map(n => renderNode(n))
            ) : (
              <div className="p-12 text-center text-slate-500 text-sm">
                No matching genealogy records found for <code className="font-mono text-indigo-600">{searchKey}</code>.
              </div>
            )}
          </div>

          {/* Node Inspector Sidebar */}
          {selectedNode && (
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-200 bg-white p-5 overflow-y-auto flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Node Inspector</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                    {selectedNode.type}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">{selectedNode.label}</h4>
                  <div className="font-mono text-xs font-semibold text-indigo-600 mt-0.5">{selectedNode.code}</div>
                  {selectedNode.subLabel && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{selectedNode.subLabel}</p>}
                </div>

                {selectedNode.metrics && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Key Parameters</div>
                    {Object.entries(selectedNode.metrics).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs">
                        <span className="text-slate-500">{k}</span>
                        <span className="font-semibold text-slate-800">{v}</span>
                      </div>
                    ))}
                  </div>
                )}

                {selectedNode.location && (
                  <div className="text-xs text-slate-600 flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>Location: <strong>{selectedNode.location}</strong></span>
                  </div>
                )}
              </div>

              {/* Action Buttons in Inspector */}
              <div className="pt-5 border-t border-slate-200 space-y-2 mt-4">
                {onInitiateRecall && (selectedNode.type === 'raw_lot' || selectedNode.type === 'fg_lot') && (
                  <button
                    onClick={() => onInitiateRecall(selectedNode.code)}
                    className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 shadow-sm transition-colors"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Initiate Recall Containment</span>
                  </button>
                )}

                {onPrintRecallReport && (
                  <button
                    onClick={() => onPrintRecallReport(graph?.rootLotNumber || selectedNode.code)}
                    className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-colors"
                  >
                    <Printer className="w-4 h-4 text-slate-500" />
                    <span>Print Recall Audit Report</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
