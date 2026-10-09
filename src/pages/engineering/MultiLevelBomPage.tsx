// src/pages/engineering/MultiLevelBomPage.tsx

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layers, 
  FolderTree, 
  History, 
  ShieldCheck, 
  Search, 
  Plus, 
  Download, 
  FileDiff, 
  Calendar, 
  DollarSign, 
  Boxes, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  ArrowRight, 
  Tag, 
  FileText,
  Sparkles,
  GitBranch,
  GitCommit,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useMultiLevelBom } from '../../hooks/useMultiLevelBom';
import { useAuth } from '../../hooks/useAuth';
import { BomTreeViewer } from '../../components/bom-multilevel/BomTreeViewer';
import { BomRevisionManager } from '../../components/bom-multilevel/BomRevisionManager';
import { BomRevisionDiffModal } from '../../components/bom-multilevel/BomRevisionDiffModal';
import { WhereUsedModal } from '../../components/bom-multilevel/WhereUsedModal';
import { EcoApprovalWorkflow } from '../../components/bom-multilevel/EcoApprovalWorkflow';
import { BomNodeEditorModal } from '../../components/bom-multilevel/BomNodeEditorModal';
import { CreateBomModal } from '../../components/bom-multilevel/CreateBomModal';
import { MultiLevelBomNode } from '../../types/multiLevelBom';
import { convertToCsv, downloadCsvFile } from '../../utils/csvExport';

type TabType = 'structure' | 'revisions' | 'ecos' | 'where_used';

export const MultiLevelBomPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const {
    boms,
    ecos,
    selectedBom,
    selectedRevision,
    effectiveRootNode,
    selectedBomId,
    selectedRevisionId,
    asOfDate,
    loading,
    error,
    refresh,
    selectBom,
    selectRevision,
    setAsOfDate,
    branchRevision,
    addChildNode,
    updateNode,
    deleteNode,
    createEco,
    reviewEco,
    implementEco,
    runWhereUsed,
    createNewBom
  } = useMultiLevelBom();

  const [activeTab, setActiveTab] = useState<TabType>('structure');
  const [assemblySearch, setAssemblySearch] = useState('');

  // Modals state
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isWhereUsedModalOpen, setIsWhereUsedModalOpen] = useState(false);
  const [whereUsedInitialPart, setWhereUsedInitialPart] = useState('');
  const [isCreateBomModalOpen, setIsCreateBomModalOpen] = useState(false);

  // Node editing state
  const [isNodeEditorOpen, setIsNodeEditorOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<MultiLevelBomNode | null>(null);
  const [parentNodeForAdd, setParentNodeForAdd] = useState<MultiLevelBomNode | null>(null);

  // In-page Where-Used search
  const [inPageWhereUsedPart, setInPageWhereUsedPart] = useState('STD-FST-M10X45-10.9');

  // Filtered BOMs for switcher
  const filteredBoms = useMemo(() => {
    return boms.filter(b => {
      const q = assemblySearch.toLowerCase().trim();
      return !q || 
        b.assemblyPartNumber.toLowerCase().includes(q) ||
        b.assemblyName.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q);
    });
  }, [boms, assemblySearch]);

  // Overall KPIs
  const totalAssembliesCount = boms.length;
  const activeReleasedCount = boms.reduce((acc, b) => {
    return acc + b.revisions.filter(r => r.status === 'released').length;
  }, 0);
  const pendingEcosCount = ecos.filter(e => e.status === 'pending_approval').length;
  const totalValuation = selectedRevision?.rolledUpCost || 0;
  const maxDepth = selectedRevision?.maxLevelDepth || 0;

  // Handle Node Editor actions
  const handleOpenAddChild = (parentNode: MultiLevelBomNode) => {
    setParentNodeForAdd(parentNode);
    setEditingNode(null);
    setIsNodeEditorOpen(true);
  };

  const handleOpenEditNode = (node: MultiLevelBomNode) => {
    setEditingNode(node);
    setParentNodeForAdd(null);
    setIsNodeEditorOpen(true);
  };

  const handleSaveNodeData = async (nodeData: Partial<MultiLevelBomNode>) => {
    if (!selectedBom || !selectedRevision) return;
    if (editingNode) {
      await updateNode(selectedBom.id, selectedRevision.id, editingNode.id, nodeData);
    } else if (parentNodeForAdd) {
      await addChildNode(selectedBom.id, selectedRevision.id, parentNodeForAdd.id, nodeData);
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (!selectedBom || !selectedRevision) return;
    if (window.confirm('Are you sure you want to remove this component and all its descendants from this draft revision?')) {
      await deleteNode(selectedBom.id, selectedRevision.id, nodeId);
    }
  };

  const handleTriggerWhereUsed = (partNumber: string) => {
    setWhereUsedInitialPart(partNumber);
    setIsWhereUsedModalOpen(true);
  };

  // Export current BOM to CSV
  const handleExportCsv = () => {
    if (!selectedRevision) return;
    const rows: any[] = [];
    function traverse(node: MultiLevelBomNode, parentPart = '') {
      rows.push({
        Level: node.level,
        PartNumber: node.partNumber,
        PartName: node.partName,
        ParentPart: parentPart || 'ROOT',
        ItemType: node.itemType,
        QuantityPerParent: node.quantityPerParent,
        Unit: node.unit,
        MaterialGrade: node.materialGrade || '',
        UnitCostINR: node.unitCost,
        RolledUpCostINR: node.rolledUpCost || node.unitCost,
        ScrapPercent: node.scrapFactorPercent || 0,
        WorkCenterOrSupplier: node.workCenterOrSupplier || '',
        LeadTimeDays: node.leadTimeDays || '',
        DrawingNumber: node.drawingNumber || '',
        DrawingRevision: node.drawingRevision || '',
        EffectiveFrom: node.effectiveFrom || '',
        EffectiveTo: node.effectiveTo || ''
      });
      if (node.children) {
        node.children.forEach(c => traverse(c, node.partNumber));
      }
    }
    traverse(selectedRevision.rootNode);
    const csvString = convertToCsv(rows);
    downloadCsvFile(csvString, `${selectedBom?.assemblyPartNumber}_${selectedRevision.revision}_BOM.csv`);
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header & Global Actions ───────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                Engineering & PLM
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Ashrey MES Core
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <FolderTree className="w-8 h-8 text-indigo-400" />
              Multi-Level BOM & Revision Control
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              N-tier hierarchical product structures, automated cost roll-up engines, time-travel effectivity date ranges, where-used impact lookups, and ECO sign-off workflows.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => navigate('/routings')}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
              title="View and configure manufacturing operation routings"
            >
              <GitCommit className="w-4 h-4 text-indigo-400" />
              <span>Process Routings</span>
            </button>

            <button
              type="button"
              onClick={() => handleTriggerWhereUsed('')}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Search className="w-4 h-4 text-indigo-400" />
              <span>Where-Used Tracer</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDiffModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <FileDiff className="w-4 h-4 text-sky-400" />
              <span>Compare Revisions</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
              title="Export flattened BOM hierarchy to CSV"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreateBomModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Assembly BOM</span>
            </button>
          </div>
        </div>

        {/* ── KPI Stat Row ────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800/90 rounded-2xl p-3.5">
            <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Total Assemblies</span>
            <span className="text-xl font-bold font-mono text-white">{totalAssembliesCount}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Top-level products</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/90 rounded-2xl p-3.5">
            <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Active Revisions</span>
            <span className="text-xl font-bold font-mono text-emerald-400">{activeReleasedCount}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Released in production</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/90 rounded-2xl p-3.5">
            <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Pending ECOs</span>
            <span className="text-xl font-bold font-mono text-amber-400">{pendingEcosCount}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Awaiting sign-offs</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/90 rounded-2xl p-3.5">
            <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Rolled-Up Cost</span>
            <span className="text-xl font-bold font-mono text-indigo-400">₹{totalValuation.toLocaleString()}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">{selectedRevision?.revision || 'Current rev'}</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/90 rounded-2xl p-3.5 col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Max Hierarchy Depth</span>
            <span className="text-xl font-bold font-mono text-sky-400">{maxDepth} Tiers</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Sub-assembly levels</span>
          </div>
        </div>
      </div>

      {/* ── Assembly Selector & Navigation Tabs ─────────────── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Assembly Quick Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <span className="text-xs font-mono uppercase text-slate-500 shrink-0">Product:</span>
          {boms.map((bom) => {
            const isSelected = selectedBomId === bom.id;
            return (
              <button
                key={bom.id}
                onClick={() => selectBom(bom.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono flex items-center gap-2 shrink-0 border transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-bold border-indigo-500 shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{bom.assemblyPartNumber}</span>
                <span className="text-[10px] opacity-80 font-normal">({bom.activeRevisionCode})</span>
              </button>
            );
          })}
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0 self-start lg:self-auto">
          <button
            onClick={() => setActiveTab('structure')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'structure' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Hierarchy Tree</span>
          </button>

          <button
            onClick={() => setActiveTab('revisions')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'revisions' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Revisions & Diff</span>
          </button>

          <button
            onClick={() => setActiveTab('ecos')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'ecos' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ECO Approvals</span>
            {pendingEcosCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-mono font-bold text-[10px] flex items-center justify-center">
                {pendingEcosCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('where_used')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'where_used' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Where-Used</span>
          </button>
        </div>
      </div>

      {/* ── Tab Content ────────────────────────────────────────── */}
      {selectedBom ? (
        <div className="space-y-5">
          {/* TAB 1: Hierarchical Structure */}
          {activeTab === 'structure' && (
            <div className="space-y-4">
              {/* Revision Manager Strip */}
              <BomRevisionManager
                bom={selectedBom}
                selectedRevision={selectedRevision}
                asOfDate={asOfDate}
                onSelectRevision={selectRevision}
                onSetAsOfDate={setAsOfDate}
                onBranchRevision={async (baseRevId, newRevCode, changeReason) => {
                  return await branchRevision(selectedBom.id, baseRevId, newRevCode, changeReason);
                }}
                onOpenDiffModal={() => setIsDiffModalOpen(true)}
              />

              {/* Tree Viewer */}
              <BomTreeViewer
                rootNode={effectiveRootNode}
                revisionStatus={selectedRevision?.status || 'draft'}
                asOfDate={asOfDate}
                onAddChild={handleOpenAddChild}
                onEditNode={handleOpenEditNode}
                onDeleteNode={handleDeleteNode}
                onWhereUsedLookup={handleTriggerWhereUsed}
              />
            </div>
          )}

          {/* TAB 2: Revision Control & Timeline */}
          {activeTab === 'revisions' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-indigo-400" />
                    Revision History & Change Trail
                  </h3>
                  <p className="text-xs text-slate-400">
                    Audit trail of all published and draft revisions for {selectedBom.assemblyPartNumber}.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDiffModalOpen(true)}
                    className="px-3.5 py-1.5 text-xs rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium flex items-center gap-1.5"
                  >
                    <FileDiff className="w-3.5 h-3.5" />
                    <span>Side-by-Side Diff</span>
                  </button>
                </div>
              </div>

              {/* Revision Timeline Cards */}
              <div className="space-y-4">
                {selectedBom.revisions.map((rev) => {
                  const isCurrent = rev.id === selectedBom.currentRevisionId;
                  const isViewing = rev.id === selectedRevisionId;

                  return (
                    <div
                      key={rev.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isViewing
                          ? 'bg-indigo-950/30 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30'
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-base font-bold font-mono text-white">
                            {rev.revision}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded font-mono capitalize border ${
                            rev.status === 'released'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : rev.status === 'draft'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            {rev.status}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              Active Production Baseline
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              selectRevision(rev.id);
                              setActiveTab('structure');
                            }}
                            className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                          >
                            Inspect Structure
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 mb-3">
                        <strong className="text-slate-400">Intent: </strong>
                        {rev.changeReason || rev.releaseNotes || 'No notes specified.'}
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono text-slate-400 pt-3 border-t border-slate-800/60">
                        <div>
                          <span className="text-[10px] uppercase text-slate-500 block">Effective From</span>
                          <span className="text-white">{rev.effectiveFrom}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-slate-500 block">Rolled-Up Cost</span>
                          <span className="text-emerald-400 font-bold">₹{rev.rolledUpCost.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-slate-500 block">Parts Count</span>
                          <span className="text-white">{rev.totalComponentCount} components</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-slate-500 block">Author / Approver</span>
                          <span className="text-slate-300 truncate block">{rev.approvedByName || rev.createdByName}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ECO Change Approvals */}
          {activeTab === 'ecos' && (
            <EcoApprovalWorkflow
              ecos={ecos}
              boms={boms}
              currentUserId={profile?.uid || 'usr_eng_mgr'}
              currentUserName={profile?.name || 'Engineering Manager'}
              currentUserRole={profile?.role || 'manager'}
              onReviewEco={reviewEco}
              onImplementEco={implementEco}
              onCreateEco={createEco}
            />
          )}

          {/* TAB 4: Where-Used Matrix */}
          {activeTab === 'where_used' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Search className="w-5 h-5 text-indigo-400" />
                  Global Where-Used Impact Matrix
                </h3>
                <p className="text-xs text-slate-400">
                  Search any component or hardware part number to find which top assemblies and sub-assemblies consume it.
                </p>
              </div>

              {/* Search Control */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={inPageWhereUsedPart}
                    onChange={(e) => setInPageWhereUsedPart(e.target.value)}
                    placeholder="Enter component part number..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Render Search Results */}
              {(() => {
                const res = runWhereUsed(inPageWhereUsedPart);
                if (!res || res.usages.length === 0) {
                  return (
                    <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
                      <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                      <p className="font-semibold text-white">No usages found for "{inPageWhereUsedPart}"</p>
                      <p className="text-xs text-slate-500 mt-1">Try searching for STD-FST-M10X45-10.9, STD-BRG-6208, or PRT-CAR-FLG-01</p>
                    </div>
                  );
                }

                return (
                  <div className="border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs text-slate-300 border-collapse">
                      <thead className="bg-slate-950/80 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-4">Top Assembly</th>
                          <th className="py-2.5 px-3">Parent Sub-Tier</th>
                          <th className="py-2.5 px-3">Level Depth</th>
                          <th className="py-2.5 px-3">Consumption Qty</th>
                          <th className="py-2.5 px-3">Revision</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {res.usages.map((u, i) => (
                          <tr key={i} className="hover:bg-slate-800/40">
                            <td className="py-3 px-4 font-bold text-white">
                              {u.topAssemblyPartNumber} — <span className="font-sans font-normal text-slate-300">{u.topAssemblyName}</span>
                            </td>
                            <td className="py-3 px-3 text-slate-300">
                              {u.parentPartNumber}
                            </td>
                            <td className="py-3 px-3">Level {u.level}</td>
                            <td className="py-3 px-3 font-bold text-white">{u.quantityUsed} {u.unit}</td>
                            <td className="py-3 px-3 text-sky-400">{u.revision}</td>
                            <td className="py-3 px-3">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                u.isActiveNow ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}>
                                {u.isActiveNow ? 'Active' : u.revisionStatus}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => {
                                  selectBom(u.bomId);
                                  setActiveTab('structure');
                                }}
                                className="px-2.5 py-1 text-xs rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-colors"
                              >
                                View BOM
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center text-slate-400">
          <FolderTree className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-base font-bold text-white">No Multi-Level BOMs Available</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Get started by initializing a new top-level product structure or loading sample engineering models.
          </p>
          <button
            type="button"
            onClick={() => setIsCreateBomModalOpen(true)}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
          >
            Create Initial BOM
          </button>
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────── */}
      {selectedBom && (
        <BomRevisionDiffModal
          isOpen={isDiffModalOpen}
          onClose={() => setIsDiffModalOpen(false)}
          bom={selectedBom}
        />
      )}

      <WhereUsedModal
        isOpen={isWhereUsedModalOpen}
        onClose={() => setIsWhereUsedModalOpen(false)}
        boms={boms}
        initialPartNumber={whereUsedInitialPart}
        onNavigateToBom={(bomId) => {
          selectBom(bomId);
          setActiveTab('structure');
        }}
      />

      <CreateBomModal
        isOpen={isCreateBomModalOpen}
        onClose={() => setIsCreateBomModalOpen(false)}
        onCreate={createNewBom}
      />

      <BomNodeEditorModal
        isOpen={isNodeEditorOpen}
        onClose={() => {
          setIsNodeEditorOpen(false);
          setEditingNode(null);
          setParentNodeForAdd(null);
        }}
        onSave={handleSaveNodeData}
        parentNode={parentNodeForAdd}
        existingNode={editingNode}
        isReadOnly={selectedRevision?.status !== 'draft' && selectedRevision?.status !== 'in_review'}
      />
    </div>
  );
};
