// src/components/bom-multilevel/BomRevisionDiffModal.tsx

import React, { useState, useMemo } from 'react';
import { 
  X, 
  FileDiff, 
  ArrowRight, 
  PlusCircle, 
  MinusCircle, 
  Edit, 
  CheckCircle2, 
  DollarSign, 
  Layers, 
  TrendingDown, 
  TrendingUp, 
  Minus 
} from 'lucide-react';
import { MultiLevelBom, BomRevisionDiff } from '../../types/multiLevelBom';
import { diffBomRevisions } from '../../services/multiLevelBomService';

interface BomRevisionDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  bom: MultiLevelBom;
  defaultRevAId?: string;
  defaultRevBId?: string;
}

export const BomRevisionDiffModal: React.FC<BomRevisionDiffModalProps> = ({
  isOpen,
  onClose,
  bom,
  defaultRevAId,
  defaultRevBId
}) => {
  const revisions = bom.revisions;

  // Defaults: earlier revision as A, later revision as B
  const [revAId, setRevAId] = useState<string>(
    defaultRevAId || (revisions.length > 1 ? revisions[0].id : revisions[0]?.id || '')
  );
  const [revBId, setRevBId] = useState<string>(
    defaultRevBId || (revisions.length > 1 ? revisions[1].id : revisions[0]?.id || '')
  );
  const [filterType, setFilterType] = useState<string>('all');

  const revA = useMemo(() => revisions.find(r => r.id === revAId), [revisions, revAId]);
  const revB = useMemo(() => revisions.find(r => r.id === revBId), [revisions, revBId]);

  const diffResult: BomRevisionDiff | null = useMemo(() => {
    if (!revA || !revB) return null;
    return diffBomRevisions(revA, revB);
  }, [revA, revB]);

  const filteredItems = useMemo(() => {
    if (!diffResult) return [];
    if (filterType === 'all') return diffResult.diffItems;
    if (filterType === 'changes_only') return diffResult.diffItems.filter(i => i.changeType !== 'unchanged');
    return diffResult.diffItems.filter(i => i.changeType === filterType);
  }, [diffResult, filterType]);

  if (!isOpen) return null;

  const costDelta = diffResult?.costDifference || 0;
  const isCostSavings = costDelta < 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <FileDiff className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                BOM Revision Comparison & Redline Diff
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {bom.assemblyPartNumber} — {bom.assemblyName}
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

        {/* Revision Selectors Bar */}
        <div className="px-6 py-3.5 bg-slate-950/60 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none">
              <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1">Base Revision (A)</label>
              <select
                value={revAId}
                onChange={(e) => setRevAId(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {revisions.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.revision} ({r.status})
                  </option>
                ))}
              </select>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-500 mt-4 shrink-0" />

            <div className="flex-1 sm:flex-none">
              <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1">Target Revision (B)</label>
              <select
                value={revBId}
                onChange={(e) => setRevBId(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {revisions.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.revision} ({r.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter options */}
          <div className="flex items-center gap-1.5 self-end sm:self-center">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 text-xs rounded-lg font-mono transition-colors ${
                filterType === 'all' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('changes_only')}
              className={`px-2.5 py-1 text-xs rounded-lg font-mono transition-colors ${
                filterType === 'changes_only' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Changes Only
            </button>
            <button
              onClick={() => setFilterType('added')}
              className={`px-2.5 py-1 text-xs rounded-lg font-mono transition-colors ${
                filterType === 'added' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Added
            </button>
            <button
              onClick={() => setFilterType('removed')}
              className={`px-2.5 py-1 text-xs rounded-lg font-mono transition-colors ${
                filterType === 'removed' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Removed
            </button>
            <button
              onClick={() => setFilterType('modified')}
              className={`px-2.5 py-1 text-xs rounded-lg font-mono transition-colors ${
                filterType === 'modified' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Modified
            </button>
          </div>
        </div>

        {/* Diff Summary Metric Chips */}
        {diffResult && (
          <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Cost Delta */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Cost Delta</span>
                <span className={`text-base font-bold font-mono ${isCostSavings ? 'text-emerald-400' : costDelta > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {costDelta > 0 ? '+' : ''}₹{costDelta.toLocaleString()}
                </span>
              </div>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCostSavings ? 'bg-emerald-500/10 text-emerald-400' : costDelta > 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
                {isCostSavings ? <TrendingDown className="w-4 h-4" /> : costDelta > 0 ? <TrendingUp className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
              </div>
            </div>

            {/* Added Parts */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Parts Added</span>
                <span className="text-base font-bold font-mono text-emerald-400">
                  +{diffResult.componentsAddedCount}
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <PlusCircle className="w-4 h-4" />
              </div>
            </div>

            {/* Removed Parts */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Parts Removed</span>
                <span className="text-base font-bold font-mono text-rose-400">
                  -{diffResult.componentsRemovedCount}
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <MinusCircle className="w-4 h-4" />
              </div>
            </div>

            {/* Modified Parts */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Parts Modified</span>
                <span className="text-base font-bold font-mono text-amber-400">
                  {diffResult.componentsModifiedCount}
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Edit className="w-4 h-4" />
              </div>
            </div>
          </div>
        )}

        {/* Diff Table */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="border border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead className="bg-slate-950/80 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Lvl</th>
                  <th className="py-2.5 px-3">Part # & Name</th>
                  <th className="py-2.5 px-3">Quantity ({revA?.revision} → {revB?.revision})</th>
                  <th className="py-2.5 px-3 text-right">Unit Cost ({revA?.revision} → {revB?.revision})</th>
                  <th className="py-2.5 px-3">Material Grade</th>
                  <th className="py-2.5 px-3">Engineering Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredItems.map((item) => {
                  let rowBg = 'hover:bg-slate-800/40';
                  let statusChip = (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      Unchanged
                    </span>
                  );

                  if (item.changeType === 'added') {
                    rowBg = 'bg-emerald-950/20 hover:bg-emerald-950/30';
                    statusChip = (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
                        <PlusCircle className="w-3 h-3" /> Added
                      </span>
                    );
                  } else if (item.changeType === 'removed') {
                    rowBg = 'bg-rose-950/20 hover:bg-rose-950/30 opacity-75';
                    statusChip = (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 w-fit">
                        <MinusCircle className="w-3 h-3" /> Removed
                      </span>
                    );
                  } else if (item.changeType === 'modified') {
                    rowBg = 'bg-amber-950/20 hover:bg-amber-950/30';
                    statusChip = (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit">
                        <Edit className="w-3 h-3" /> Modified
                      </span>
                    );
                  }

                  return (
                    <tr key={item.id} className={`${rowBg} transition-colors`}>
                      <td className="py-2.5 px-3 whitespace-nowrap">{statusChip}</td>
                      <td className="py-2.5 px-3 text-slate-400">L{item.level}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-white">{item.partNumber}</div>
                        <div className="text-[11px] font-sans text-slate-300">{item.partName}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        {item.changeType === 'removed' ? (
                          <span className="line-through text-rose-400">{item.oldQty}</span>
                        ) : item.changeType === 'added' ? (
                          <span className="text-emerald-400 font-bold">{item.newQty}</span>
                        ) : item.oldQty !== item.newQty ? (
                          <span>
                            <span className="text-slate-400">{item.oldQty}</span> →{' '}
                            <span className="text-amber-400 font-bold">{item.newQty}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">{item.newQty}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {item.changeType === 'removed' ? (
                          <span className="line-through text-rose-400">₹{(item.oldCost || 0).toLocaleString()}</span>
                        ) : item.changeType === 'added' ? (
                          <span className="text-emerald-400 font-bold">₹{(item.newCost || 0).toLocaleString()}</span>
                        ) : item.oldCost !== item.newCost ? (
                          <span>
                            <span className="text-slate-400">₹{(item.oldCost || 0).toLocaleString()}</span> →{' '}
                            <span className="text-amber-400 font-bold">₹{(item.newCost || 0).toLocaleString()}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">₹{(item.newCost || 0).toLocaleString()}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {item.newMaterial || item.oldMaterial || '—'}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-xs text-slate-400 max-w-xs truncate">
                        {item.notes || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            Comparing {revA?.revision} against {revB?.revision} • {filteredItems.length} lines shown
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Close Diff
          </button>
        </div>
      </div>
    </div>
  );
};
