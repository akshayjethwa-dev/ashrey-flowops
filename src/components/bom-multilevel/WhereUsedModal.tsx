// src/components/bom-multilevel/WhereUsedModal.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Search, 
  Layers, 
  Boxes, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Building2, 
  FolderTree, 
  Clock 
} from 'lucide-react';
import { MultiLevelBom, WhereUsedResult, WhereUsedItem } from '../../types/multiLevelBom';
import { findWhereUsed } from '../../services/multiLevelBomService';

interface WhereUsedModalProps {
  isOpen: boolean;
  onClose: () => void;
  boms: MultiLevelBom[];
  initialPartNumber?: string;
  onNavigateToBom: (bomId: string) => void;
}

export const WhereUsedModal: React.FC<WhereUsedModalProps> = ({
  isOpen,
  onClose,
  boms,
  initialPartNumber = '',
  onNavigateToBom
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (initialPartNumber) {
      setSearchTerm(initialPartNumber);
    }
  }, [initialPartNumber, isOpen]);

  // Extract catalog of all part numbers across all BOMs for auto-suggest
  const quickSuggestions = useMemo(() => {
    const set = new Set<string>();
    function extract(node: any) {
      if (node.partNumber) set.add(node.partNumber);
      if (node.children) node.children.forEach(extract);
    }
    boms.forEach(b => {
      b.revisions.forEach(r => extract(r.rootNode));
    });
    return Array.from(set).slice(0, 10);
  }, [boms]);

  const result: WhereUsedResult | null = useMemo(() => {
    if (!searchTerm.trim()) return null;
    return findWhereUsed(boms, searchTerm.trim());
  }, [boms, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Where-Used Product Impact Lookup
              </h3>
              <p className="text-xs text-slate-400">
                Trace component usage, quantity consumption & parent assemblies across all factory BOMs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Auto-Suggestions */}
        <div className="p-6 pb-4 bg-slate-950/50 border-b border-slate-800 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter part number or hardware code (e.g. STD-FST-M10X45-10.9, STD-BRG-6208, PRT-CAR-FLG-01)..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Quick Click Suggestions */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-mono text-slate-500 mr-1">Quick Select:</span>
            {quickSuggestions.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => setSearchTerm(sug)}
                className={`text-[11px] font-mono px-2 py-0.5 rounded-md border transition-colors ${
                  searchTerm.toUpperCase() === sug.toUpperCase()
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border-slate-700'
                }`}
              >
                {sug}
              </button>
            ))}
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!result || !searchTerm ? (
            <div className="text-center py-12 text-slate-500">
              <Boxes className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              <p className="text-sm">Type a part number above to find every BOM and sub-assembly where it is consumed.</p>
            </div>
          ) : result.usages.length === 0 ? (
            <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <p className="font-semibold text-white">No BOM Usages Found</p>
              <p className="text-xs text-slate-400 mt-1">
                Part <span className="font-mono text-amber-300 font-bold">{searchTerm}</span> is not currently registered in any active or draft product structure.
              </p>
            </div>
          ) : (
            <>
              {/* Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Searched Part</span>
                  <span className="text-sm font-bold font-mono text-indigo-400 truncate block">
                    {result.searchedPartNumber}
                  </span>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Total BOM Usages</span>
                  <span className="text-base font-bold font-mono text-white">
                    {result.totalUsages} locations
                  </span>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Top-Level Assemblies</span>
                  <span className="text-base font-bold font-mono text-emerald-400">
                    {result.topAssembliesCount} products affected
                  </span>
                </div>
              </div>

              {/* Usages Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs text-slate-300 border-collapse">
                  <thead className="bg-slate-950/80 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Top Assembly</th>
                      <th className="py-2.5 px-3">Direct Parent Node</th>
                      <th className="py-2.5 px-3">Depth</th>
                      <th className="py-2.5 px-3">Qty Used</th>
                      <th className="py-2.5 px-3">Revision</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {result.usages.map((item: WhereUsedItem, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-indigo-400" />
                            {item.topAssemblyPartNumber}
                          </div>
                          <div className="text-[11px] font-sans text-slate-400 truncate max-w-[200px]">
                            {item.topAssemblyName}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="text-slate-200 font-semibold">{item.parentPartNumber}</div>
                          <div className="text-[11px] font-sans text-slate-400 truncate max-w-[180px]">
                            {item.parentPartName}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            Level {item.level}
                          </span>
                        </td>

                        <td className="py-3 px-3 font-bold text-white">
                          {item.quantityUsed} {item.unit}
                        </td>

                        <td className="py-3 px-3 text-sky-400">
                          {item.revision}
                        </td>

                        <td className="py-3 px-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${
                            item.isActiveNow 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {item.isActiveNow ? 'Active' : item.revisionStatus}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              onNavigateToBom(item.bomId);
                              onClose();
                            }}
                            className="px-2.5 py-1 text-xs rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition-all flex items-center gap-1 mx-auto"
                            title="Jump to this BOM"
                          >
                            <span>Open</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Ashrey FlowOps Engineering Knowledge Base & Where-Used Tracer
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
