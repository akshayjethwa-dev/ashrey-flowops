// src/components/bom-multilevel/BomTreeViewer.tsx

import React, { useState, useMemo } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Layers, 
  Boxes, 
  Tag, 
  Clock, 
  Building2, 
  FileText, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Filter,
  Maximize2,
  Minimize2,
  Table,
  FolderTree,
  ExternalLink
} from 'lucide-react';
import { 
  MultiLevelBomNode, 
  BomItemType, 
  BomRevisionStatus 
} from '../../types/multiLevelBom';
import { flattenBomTree } from '../../services/multiLevelBomService';

interface BomTreeViewerProps {
  rootNode: MultiLevelBomNode | null;
  revisionStatus: BomRevisionStatus;
  asOfDate?: string;
  onAddChild: (parentNode: MultiLevelBomNode) => void;
  onEditNode: (node: MultiLevelBomNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onWhereUsedLookup: (partNumber: string) => void;
}

const ITEM_TYPE_CONFIG: Record<BomItemType, { label: string; bg: string; text: string; border: string }> = {
  assembly: {
    label: 'Assembly',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/20'
  },
  sub_assembly: {
    label: 'Sub-Assembly',
    bg: 'bg-sky-500/10',
    text: 'text-sky-400',
    border: 'border-sky-500/20'
  },
  manufactured: {
    label: 'Manufactured',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20'
  },
  raw_material: {
    label: 'Raw Material',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20'
  },
  bought_out: {
    label: 'Bought-Out',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/20'
  },
  hardware: {
    label: 'Hardware',
    bg: 'bg-slate-500/10',
    text: 'text-slate-300',
    border: 'border-slate-500/20'
  }
};

export const BomTreeViewer: React.FC<BomTreeViewerProps> = ({
  rootNode,
  revisionStatus,
  asOfDate,
  onAddChild,
  onEditNode,
  onDeleteNode,
  onWhereUsedLookup
}) => {
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set(['root']));

  const isEditable = revisionStatus === 'draft' || revisionStatus === 'in_review';

  // Extract all node IDs to support expand/collapse all
  const allNodeIds = useMemo(() => {
    if (!rootNode) return [];
    const ids: string[] = [];
    function collect(node: MultiLevelBomNode) {
      ids.push(node.id);
      if (node.children) node.children.forEach(collect);
    }
    collect(rootNode);
    return ids;
  }, [rootNode]);

  // Initial auto-expand root and level 1
  React.useEffect(() => {
    if (rootNode) {
      const initial = new Set<string>([rootNode.id]);
      if (rootNode.children) {
        rootNode.children.forEach(c => initial.add(c.id));
      }
      setExpandedNodeIds(initial);
    }
  }, [rootNode?.id]);

  const toggleExpand = (id: string) => {
    setExpandedNodeIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExpandAll = () => {
    setExpandedNodeIds(new Set(allNodeIds));
  };

  const handleCollapseAll = () => {
    if (rootNode) setExpandedNodeIds(new Set([rootNode.id]));
    else setExpandedNodeIds(new Set());
  };

  // Helper to check effectivity status of a node relative to asOfDate or current time
  const getEffectivityStatus = (node: MultiLevelBomNode) => {
    const checkTime = asOfDate ? new Date(asOfDate).getTime() : Date.now();
    const fromTime = node.effectiveFrom ? new Date(node.effectiveFrom).getTime() : null;
    const toTime = node.effectiveTo ? new Date(node.effectiveTo).getTime() : null;

    if (fromTime && fromTime > checkTime) {
      return { status: 'future', label: `Starts ${node.effectiveFrom}`, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    }
    if (toTime && toTime < checkTime) {
      return { status: 'expired', label: `Expired ${node.effectiveTo}`, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
    }
    return { status: 'active', label: 'Active', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
  };

  // Flattened tree for table view & metrics
  const flatNodes = useMemo(() => {
    if (!rootNode) return [];
    return flattenBomTree(rootNode);
  }, [rootNode]);

  // Filtered nodes
  const filteredFlatNodes = useMemo(() => {
    return flatNodes.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || 
        item.partNumber.toLowerCase().includes(q) ||
        item.partName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.materialGrade && item.materialGrade.toLowerCase().includes(q)) ||
        (item.workCenterOrSupplier && item.workCenterOrSupplier.toLowerCase().includes(q));

      const matchType = selectedTypeFilter === 'all' || item.itemType === selectedTypeFilter;
      return matchQuery && matchType;
    });
  }, [flatNodes, searchQuery, selectedTypeFilter]);

  if (!rootNode) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
        <FolderTree className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-base font-semibold text-slate-300">No BOM Structure Found</p>
        <p className="text-sm mt-1">Select an active assembly or create a new BOM to view hierarchical structure.</p>
      </div>
    );
  }

  // ── Recursive Tree Node Renderer ────────────────────────────────
  const renderTreeNode = (node: MultiLevelBomNode, depth: number = 0, isLastChild: boolean = false) => {
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const isExpanded = expandedNodeIds.has(node.id);
    const itemTypeConf = ITEM_TYPE_CONFIG[node.itemType] || ITEM_TYPE_CONFIG.manufactured;
    const effectivity = getEffectivityStatus(node);

    // Filter check for highlighting
    const q = searchQuery.toLowerCase().trim();
    const isMatch = q && (
      node.partNumber.toLowerCase().includes(q) ||
      node.partName.toLowerCase().includes(q) ||
      node.description.toLowerCase().includes(q)
    );

    const matchesType = selectedTypeFilter === 'all' || node.itemType === selectedTypeFilter;

    return (
      <div key={node.id} className="relative group">
        {/* Row Card */}
        <div 
          className={`flex items-start justify-between py-2.5 px-3 rounded-xl border transition-all ${
            isMatch 
              ? 'bg-indigo-950/40 border-indigo-500/50 shadow-xs' 
              : !matchesType 
                ? 'opacity-40 bg-slate-900/40 border-slate-800/60'
                : 'hover:bg-slate-800/60 border-slate-800/80 bg-slate-900/50'
          }`}
          style={{ marginLeft: `${Math.min(depth * 28, 200)}px` }}
        >
          {/* Left Column: Indent Chevron + Identity */}
          <div className="flex items-start gap-2.5 flex-1 min-w-0 pr-3">
            {/* Expand / Collapse or leaf icon */}
            <div className="pt-0.5 shrink-0">
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(node.id)}
                  className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
                  title={isExpanded ? 'Collapse sub-assembly' : 'Expand sub-assembly'}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-200" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              ) : (
                <div className="w-6 h-6 flex items-center justify-center text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                </div>
              )}
            </div>

            {/* Part Level & Type Badges */}
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  L{node.level}
                </span>

                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${itemTypeConf.bg} ${itemTypeConf.text} ${itemTypeConf.border}`}>
                  {itemTypeConf.label}
                </span>

                <span className="font-mono text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                  {node.partNumber}
                  {node.drawingRevision && (
                    <span className="text-[10px] font-mono text-slate-400 font-normal">
                      (Rev {node.drawingRevision})
                    </span>
                  )}
                </span>

                {/* Effectivity Status Chip */}
                <span className={`text-[10px] px-1.5 py-0.2 rounded border font-mono ${effectivity.color}`}>
                  {effectivity.label}
                </span>

                {node.isSubcontracted && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded border font-mono text-cyan-400 bg-cyan-500/10 border-cyan-500/30">
                    Subcontracted
                  </span>
                )}
              </div>

              {/* Part Name & Description */}
              <div className="text-sm font-medium text-slate-200 truncate">
                {node.partName}
              </div>

              {node.description && (
                <div className="text-xs text-slate-400 truncate max-w-xl mt-0.5">
                  {node.description}
                </div>
              )}

              {/* Material & Work Center Attributes */}
              <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 flex-wrap font-mono">
                {node.materialGrade && (
                  <span className="text-slate-300">
                    Mat: <strong className="text-slate-200">{node.materialGrade}</strong>
                  </span>
                )}
                {node.workCenterOrSupplier && (
                  <span className="text-slate-400">
                    Loc: <strong className="text-slate-300">{node.workCenterOrSupplier}</strong>
                  </span>
                )}
                {node.leadTimeDays ? (
                  <span className="text-slate-400">
                    Lead: <strong className="text-slate-300">{node.leadTimeDays}d</strong>
                  </span>
                ) : null}
                {node.drawingNumber && (
                  <span className="text-slate-400">
                    Dwg: <strong className="text-slate-300">{node.drawingNumber}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Quantities, Cost, and Actions */}
          <div className="flex items-center gap-4 shrink-0 pl-2">
            {/* Quantity */}
            <div className="text-right min-w-[70px]">
              <div className="text-xs font-mono font-bold text-white">
                {node.quantityPerParent} {node.unit}
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                {node.scrapFactorPercent ? `+${node.scrapFactorPercent}% scrap` : 'net qty'}
              </div>
            </div>

            {/* Cost Roll-up Block */}
            <div className="text-right min-w-[110px] bg-slate-950/60 border border-slate-800/80 px-2.5 py-1.5 rounded-lg">
              <div className="text-xs font-mono font-bold text-emerald-400">
                ₹{(node.rolledUpCost || node.unitCost || 0).toLocaleString()}
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                {hasChildren ? 'Rolled-up / unit' : `₹${(node.unitCost || 0).toLocaleString()} direct`}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              {/* Where Used Lookup */}
              <button
                type="button"
                onClick={() => onWhereUsedLookup(node.partNumber)}
                className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors"
                title="Find Where Used across all products"
              >
                <Search className="w-3.5 h-3.5" />
              </button>

              {/* Add Child Node (Available if editable) */}
              {isEditable && (
                <button
                  type="button"
                  onClick={() => onAddChild(node)}
                  className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Add child component under this assembly"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Edit Node */}
              <button
                type="button"
                onClick={() => onEditNode(node)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isEditable 
                    ? 'text-slate-400 hover:text-sky-400 hover:bg-slate-800' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                }`}
                title={isEditable ? 'Edit component specs' : 'View specifications'}
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>

              {/* Delete Node (only for child components in draft) */}
              {isEditable && node.level > 0 && (
                <button
                  type="button"
                  onClick={() => onDeleteNode(node.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Delete component from this revision"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Children Render */}
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {node.children!.map((child, idx) =>
              renderTreeNode(child, depth + 1, idx === node.children!.length - 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Control Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
        {/* Search & Filter */}
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search part #, name, material..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Item Types</option>
            <option value="assembly">Assemblies</option>
            <option value="sub_assembly">Sub-Assemblies</option>
            <option value="manufactured">Manufactured</option>
            <option value="raw_material">Raw Materials</option>
            <option value="bought_out">Bought-Out</option>
            <option value="hardware">Hardware</option>
          </select>
        </div>

        {/* View Switcher & Expand Controls */}
        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={handleExpandAll}
            className="px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700/80 transition-colors flex items-center gap-1.5"
            title="Expand all tree levels"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Expand All</span>
          </button>

          <button
            type="button"
            onClick={handleCollapseAll}
            className="px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700/80 transition-colors flex items-center gap-1.5"
            title="Collapse tree to root"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Collapse</span>
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Tree / Table Mode */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('tree')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'tree'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Hierarchical Tree View"
            >
              <FolderTree className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tabular Flat View"
            >
              <Table className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Render Mode: Tree vs Flattened Table */}
      {viewMode === 'tree' ? (
        <div className="space-y-1.5">
          {renderTreeNode(rootNode, 0)}
        </div>
      ) : (
        /* Tabular Flat Indented View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead className="bg-slate-950/80 text-[11px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Level & Part Number</th>
                  <th className="py-3 px-3">Part Name & Specs</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Qty / Parent</th>
                  <th className="py-3 px-3 text-right">Unit Cost</th>
                  <th className="py-3 px-3 text-right">Rolled Cost</th>
                  <th className="py-3 px-3">Work Center / Supplier</th>
                  <th className="py-3 px-3">Effectivity</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredFlatNodes.map((item) => {
                  const typeConf = ITEM_TYPE_CONFIG[item.itemType] || ITEM_TYPE_CONFIG.manufactured;
                  const effectivity = getEffectivityStatus(item);

                  return (
                    <tr 
                      key={item.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-2.5 px-4 font-bold text-white">
                        <div 
                          className="flex items-center gap-1.5"
                          style={{ paddingLeft: `${item.depth * 18}px` }}
                        >
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-1 py-0.2 rounded border border-slate-700">
                            L{item.level}
                          </span>
                          <span>{item.partNumber}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <div className="font-medium text-slate-200">{item.partName}</div>
                        {item.description && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">{item.description}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${typeConf.bg} ${typeConf.text} ${typeConf.border}`}>
                          {typeConf.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-200">
                        {item.quantityPerParent} {item.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-300">
                        ₹{(item.unitCost || 0).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                        ₹{(item.rolledUpCost || item.unitCost || 0).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 truncate max-w-[140px]">
                        {item.workCenterOrSupplier || '—'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${effectivity.color}`}>
                          {effectivity.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onWhereUsedLookup(item.partNumber)}
                            className="p-1 hover:text-indigo-400 rounded transition-colors"
                            title="Where Used"
                          >
                            <Search className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditNode(item)}
                            className="p-1 hover:text-sky-400 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {isEditable && item.level > 0 && (
                            <button
                              onClick={() => onDeleteNode(item.id)}
                              className="p-1 hover:text-rose-400 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
