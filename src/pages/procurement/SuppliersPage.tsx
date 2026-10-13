// src/pages/procurement/SuppliersPage.tsx

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  Building2,
  Clock,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Scale,
  Printer,
  ChevronRight,
  Eye,
  Edit,
  Sliders,
  DollarSign,
  FileCheck,
  Cpu,
  RefreshCw,
  Star,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowUpDown,
  Tag,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePlants } from '../../hooks/usePlants';
import { useSupplierScorecards } from '../../hooks/useSupplierScorecards';
import {
  SupplierWithMetrics,
  SupplierCategory,
  SupplierTier,
  SupplierStatus
} from '../../types/supplierScorecard';
import { SupplierFormModal } from '../../components/suppliers/SupplierFormModal';
import { SupplierScorecardDrawer } from '../../components/suppliers/SupplierScorecardDrawer';
import { SupplierCompareModal } from '../../components/suppliers/SupplierCompareModal';
import { SupplierScorecardPrintModal } from '../../components/suppliers/SupplierScorecardPrintModal';

export const SuppliersPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const { plants = [] } = usePlants(tenant?.id);

  const {
    suppliers,
    allSuppliers,
    loading,
    submitting,
    error,
    filters,
    setFilters,
    kpis,
    refresh,
    saveSupplier,
    logIncident,
    updateCapa
  } = useSupplierScorecards();

  // Active view tab
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'master' | 'at_risk'>('leaderboard');

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedSupplierForForm, setSelectedSupplierForForm] = useState<SupplierWithMetrics | null>(null);
  const [selectedSupplierForDrawer, setSelectedSupplierForDrawer] = useState<SupplierWithMetrics | null>(null);
  const [selectedSupplierForPrint, setSelectedSupplierForPrint] = useState<SupplierWithMetrics | null>(null);

  // Multi-selection for comparative sourcing matrix
  const [selectedSupplierIdsForCompare, setSelectedSupplierIdsForCompare] = useState<string[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const getTierBadge = (tier: SupplierTier) => {
    switch (tier) {
      case 'tier_1':
        return {
          label: 'Tier 1 • Platinum Partner',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
      case 'tier_2':
        return {
          label: 'Tier 2 • Gold Approved',
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200'
        };
      case 'tier_3':
        return {
          label: 'Tier 3 • Silver Conditional',
          bg: 'bg-amber-50 text-amber-800 border-amber-200'
        };
      case 'tier_4':
        return {
          label: 'Tier 4 • Bronze At-Risk',
          bg: 'bg-rose-50 text-rose-700 border-rose-200'
        };
    }
  };

  const toggleSelectForCompare = (supplierId: string) => {
    if (selectedSupplierIdsForCompare.includes(supplierId)) {
      setSelectedSupplierIdsForCompare(selectedSupplierIdsForCompare.filter(id => id !== supplierId));
    } else {
      if (selectedSupplierIdsForCompare.length >= 3) {
        alert('You can compare a maximum of 3 suppliers side-by-side.');
        return;
      }
      setSelectedSupplierIdsForCompare([...selectedSupplierIdsForCompare, supplierId]);
    }
  };

  const suppliersForCompare = useMemo(() => {
    return allSuppliers.filter(s => selectedSupplierIdsForCompare.includes(s.id));
  }, [allSuppliers, selectedSupplierIdsForCompare]);

  // Tab filtered items
  const tabSuppliers = useMemo(() => {
    if (activeTab === 'at_risk') {
      return suppliers.filter(s => s.metrics.compositeScore < 75 || s.status === 'probation');
    }
    return suppliers;
  }, [suppliers, activeTab]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 space-y-6 select-none font-sans text-slate-800">
      
      {/* ── 1. Page Header & Actions ──────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono uppercase text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded font-bold tracking-wider">
              Procurement & Supply Chain
            </span>
            <span className="text-xs font-mono uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded font-bold tracking-wider flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              AVL Health: {kpis.tier1Count} Platinum Tier-1 Partners
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-2 flex items-center gap-2.5">
            <Award className="h-7 w-7 text-indigo-600" />
            Supplier Management & Scorecards
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track on-time delivery, quality acceptance rates, and responsiveness to make data-driven sourcing allocations.
          </p>
        </div>

        {/* Header Action Controls */}
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => navigate('/purchase-orders')}
            id="btn-goto-pos"
            className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-mono uppercase py-2.5 px-3.5 rounded-xl font-bold shadow-xs transition-all cursor-pointer"
            title="Go to Purchase Orders Automation"
          >
            <FileCheck className="h-4 w-4 text-emerald-600" />
            Purchase Orders
          </button>

          <button
            onClick={() => navigate('/iqc')}
            id="btn-goto-iqc"
            className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-mono uppercase py-2.5 px-3.5 rounded-xl font-bold shadow-xs transition-all cursor-pointer"
            title="Inspect incoming material lots against supplier plans"
          >
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            Incoming IQC
          </button>

          {selectedSupplierIdsForCompare.length >= 2 && (
            <button
              onClick={() => setCompareModalOpen(true)}
              id="btn-compare-suppliers"
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono uppercase py-2.5 px-3.5 rounded-xl font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer animate-pulse"
              title="Compare selected suppliers side-by-side"
            >
              <Scale className="h-4 w-4" />
              Compare Sourcing ({selectedSupplierIdsForCompare.length})
            </button>
          )}

          <button
            onClick={() => {
              setSelectedSupplierForForm(null);
              setFormModalOpen(true);
            }}
            id="btn-add-supplier"
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono uppercase py-2.5 px-4 rounded-xl font-bold shadow-md transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Register Supplier
          </button>
        </div>
      </div>

      {/* ── 2. Performance Metrics Dashboard (Acceptance Criteria) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* KPI 1: Fleet Average On-Time Delivery (OTD %) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-sky-600 font-bold">
              Fleet On-Time Delivery
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-black text-slate-900 font-mono">
                {kpis.fleetAvgOtd}%
              </h3>
              <span className="text-[10px] font-mono text-slate-500">Target ≥ 95%</span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Weighted delivery schedule compliance
            </p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 2: Quality Acceptance Rate (QAR %) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 font-bold">
              Quality Acceptance Rate
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-black text-emerald-600 font-mono">
                {kpis.fleetAvgQuality}%
              </h3>
              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">
                Dock Inward
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Passed inspection vs quarantined lots
            </p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 3: Commercial Responsiveness SLA */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-indigo-600 font-bold">
              Responsiveness SLA
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-black text-indigo-600 font-mono">
                {kpis.fleetAvgResponsiveness}%
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              PO acknowledgment & RFQ turnarounds
            </p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 4: Total Spend Managed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
              Total Spend Managed
            </p>
            <h3 className="text-2xl font-black text-slate-900 font-mono mt-1">
              {formatCurrency(kpis.totalSpendManaged)}
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Across {kpis.totalSuppliersCount} contracted suppliers
            </p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 5: At-Risk Suppliers & Open CAPAs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-rose-500 font-bold">
              At-Risk & Open CAPA
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-black text-rose-600 font-mono">
                {kpis.atRiskSuppliersCount}
              </h3>
              {kpis.openCapasCount > 0 && (
                <span className="text-[10px] font-mono font-bold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded">
                  {kpis.openCapasCount} 8D CAPA
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Suppliers with score &lt; 75%
            </p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* ── 3. Filters Toolbar & Navigation ────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Tab switchers */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'leaderboard'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            Rankings & Leaderboard ({suppliers.length})
          </button>

          <button
            onClick={() => setActiveTab('master')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'master'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            Supplier Master Directory
          </button>

          <button
            onClick={() => setActiveTab('at_risk')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'at_risk'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            At-Risk / CAPA Watchlist ({allSuppliers.filter(s => s.metrics.compositeScore < 75).length})
          </button>
        </div>

        {/* Filter Selectors & Search Input */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Category Dropdown */}
          <div className="flex items-center space-x-1.5 bg-slate-100 rounded-xl px-3 py-1.5 text-xs">
            <Tag className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={filters.category}
              onChange={e => setFilters(prev => ({ ...prev, category: e.target.value as any }))}
              className="bg-transparent border-none text-xs font-bold text-slate-800 p-0 pr-4 focus:ring-0 cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="raw_materials">Raw Materials</option>
              <option value="tooling_dies">Tooling & Dies</option>
              <option value="consumables">Consumables & Oils</option>
              <option value="fasteners_hardware">Fasteners & Hardware</option>
              <option value="subcontract_processing">Subcontract Processing</option>
              <option value="packaging_logistics">Packaging</option>
            </select>
          </div>

          {/* Tier Dropdown */}
          <div className="flex items-center space-x-1.5 bg-slate-100 rounded-xl px-3 py-1.5 text-xs">
            <Star className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={filters.tier}
              onChange={e => setFilters(prev => ({ ...prev, tier: e.target.value as any }))}
              className="bg-transparent border-none text-xs font-bold text-slate-800 p-0 pr-4 focus:ring-0 cursor-pointer"
            >
              <option value="all">All Tiers</option>
              <option value="tier_1">Tier 1 (Platinum ≥90%)</option>
              <option value="tier_2">Tier 2 (Gold 80-89%)</option>
              <option value="tier_3">Tier 3 (Silver 70-79%)</option>
              <option value="tier_4">Tier 4 (Bronze &lt;70%)</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search vendor, code, GSTIN..."
              value={filters.searchQuery}
              onChange={e => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="bg-slate-100 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44 sm:w-52"
            />
          </div>
        </div>
      </div>

      {/* ── 4. Main Body: Supplier Leaderboard & Ranking Grid ──── */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 font-mono text-xs">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-500 mb-2" />
          Loading supplier scorecards & rankings...
        </div>
      ) : tabSuppliers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Award className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Suppliers Match Filter Criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your category or tier filters to view the complete Approved Vendor List.
          </p>
        </div>
      ) : activeTab === 'master' ? (
        /* ── View 2: Supplier Master Directory Table ────────── */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Supplier Name & Code</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Contact & Key Rep</th>
                  <th className="py-3 px-4">Commercial Terms</th>
                  <th className="py-3 px-4">Certifications</th>
                  <th className="py-3 px-4 text-center">Score & Tier</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {tabSuppliers.map(s => {
                  const tBadge = getTierBadge(s.tier);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-sans font-bold text-slate-900 text-sm">
                          {s.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {s.code} • GSTIN: {s.gstin}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        <span className="capitalize px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 font-medium">
                          {s.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-sans text-xs">
                        <div className="font-semibold text-slate-800">{s.contactPerson}</div>
                        <div className="text-slate-500 text-[11px]">{s.email}</div>
                        <div className="text-slate-400 text-[10px] font-mono">{s.phone}</div>
                      </td>
                      <td className="py-3.5 px-4 font-sans text-xs text-slate-700">
                        <div>{s.paymentTerms}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">Lead Time: {s.leadTimeDays}d</div>
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {s.certifications.slice(0, 2).map(c => (
                            <span key={c} className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600 font-mono">
                              {c}
                            </span>
                          ))}
                          {s.certifications.length > 2 && (
                            <span className="text-[10px] text-indigo-600 font-mono font-bold">
                              +{s.certifications.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="font-black text-slate-900 text-sm">
                          {s.metrics.compositeScore} / 100
                        </div>
                        <span className={`px-2 py-0.2 rounded text-[10px] font-bold border mt-0.5 inline-block ${tBadge.bg}`}>
                          Rank #{s.metrics.rank}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedSupplierForDrawer(s)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            title="View Performance Scorecard"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSupplierForForm(s);
                              setFormModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            title="Edit Supplier Profile"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── View 1 & 3: Supplier Ranking & Scorecard Cards Grid ─── */
        <div className="space-y-4">
          {tabSuppliers.map(s => {
            const tBadge = getTierBadge(s.tier);
            const isSelectedForCompare = selectedSupplierIdsForCompare.includes(s.id);

            return (
              <div
                key={s.id}
                className={`bg-white rounded-2xl border transition-all hover:shadow-md ${
                  s.metrics.compositeScore < 75
                    ? 'border-rose-300 ring-1 ring-rose-300/40 bg-rose-50/10'
                    : isSelectedForCompare
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                    : 'border-slate-200'
                }`}
              >
                {/* Header row with Rank badge */}
                <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Checkbox for comparative sourcing */}
                    <input
                      type="checkbox"
                      checked={isSelectedForCompare}
                      onChange={() => toggleSelectForCompare(s.id)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      title="Select for comparative sourcing matrix"
                    />

                    {/* Rank Badge */}
                    <div className="h-8 w-8 rounded-xl bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      #{s.metrics.rank}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedSupplierForDrawer(s)}
                          className="text-base font-black text-slate-900 font-sans hover:text-indigo-600 transition-colors cursor-pointer text-left"
                        >
                          {s.name}
                        </button>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${tBadge.bg}`}>
                          {tBadge.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono">
                        {s.code} • {s.category.replace('_', ' ')} • Agreed Lead Time: {s.leadTimeDays}d
                      </p>
                    </div>
                  </div>

                  {/* Composite Score Pill & Actions */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                        Composite Score
                      </span>
                      <div className="text-2xl font-black font-mono text-slate-900">
                        {s.metrics.compositeScore}
                        <span className="text-xs text-slate-400 font-normal"> / 100</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedSupplierForDrawer(s)}
                      className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Scorecard
                    </button>
                  </div>
                </div>

                {/* Performance Metrics Bar (The 3 Core Acceptance Criteria + Price) */}
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                  
                  {/* Metric 1: On-Time Delivery */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono uppercase text-slate-500 font-bold flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-sky-500" />
                        On-Time Delivery
                      </span>
                      <span className="text-sm font-mono font-black text-sky-600">
                        {s.metrics.onTimeDeliveryRatePct}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-sky-500 h-full rounded-full"
                        style={{ width: `${s.metrics.onTimeDeliveryRatePct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Avg delay: {s.metrics.avgDelayDays}d • Target ≥95%
                    </p>
                  </div>

                  {/* Metric 2: Quality Acceptance Rate */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono uppercase text-slate-500 font-bold flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                        Quality Acceptance
                      </span>
                      <span className="text-sm font-mono font-black text-emerald-600">
                        {s.metrics.qualityAcceptanceRatePct}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${s.metrics.qualityAcceptanceRatePct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Defect rate: {s.metrics.ppmDefectRate} PPM
                    </p>
                  </div>

                  {/* Metric 3: Responsiveness SLA */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono uppercase text-slate-500 font-bold flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5 text-indigo-500" />
                        Responsiveness
                      </span>
                      <span className="text-sm font-mono font-black text-indigo-600">
                        {s.metrics.responsivenessScorePct}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full"
                        style={{ width: `${s.metrics.responsivenessScorePct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">
                      PO acknowledgment ≤ 4h SLA
                    </p>
                  </div>

                  {/* Metric 4: Spend & Incidents */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-[11px] font-mono uppercase text-slate-500 font-bold block">
                      Procurement Spend
                    </span>
                    <div className="text-sm font-mono font-black text-slate-900">
                      {formatCurrency(s.metrics.totalSpend)}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between pt-1">
                      <span>{s.metrics.totalOrdersFulfilled} POs fulfilled</span>
                      {s.metrics.recentIncidents.length > 0 && (
                        <span className="text-rose-600 font-bold">
                          {s.metrics.recentIncidents.length} issue(s)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer details row */}
                <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 rounded-b-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-3 text-slate-600">
                    <span>
                      Contact: <strong>{s.contactPerson}</strong> ({s.role})
                    </span>
                    <span>•</span>
                    <span>Terms: {s.paymentTerms}</span>
                    <span>•</span>
                    <span>Plants: {s.primaryPlants.join(', ')}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedSupplierForPrint(s)}
                      className="px-3 py-1.5 rounded-xl font-mono text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Print Official Scorecard Audit Report"
                    >
                      <Printer className="h-3.5 w-3.5 text-slate-500" />
                      Print Scorecard
                    </button>
                    <button
                      onClick={() => {
                        setSelectedSupplierForForm(s);
                        setFormModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl font-mono text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit className="h-3.5 w-3.5 text-slate-500" />
                      Edit Profile
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modals Mount ───────────────────────────────────────── */}
      <SupplierFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setSelectedSupplierForForm(null);
        }}
        supplier={selectedSupplierForForm}
        onSave={saveSupplier}
      />

      <SupplierScorecardDrawer
        isOpen={Boolean(selectedSupplierForDrawer)}
        onClose={() => setSelectedSupplierForDrawer(null)}
        supplier={selectedSupplierForDrawer}
        onEditSupplier={sup => {
          setSelectedSupplierForDrawer(null);
          setSelectedSupplierForForm(sup);
          setFormModalOpen(true);
        }}
        onOpenPrintModal={sup => setSelectedSupplierForPrint(sup)}
        onLogIncident={logIncident}
        onUpdateCapa={updateCapa}
      />

      <SupplierCompareModal
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        suppliers={suppliersForCompare}
      />

      <SupplierScorecardPrintModal
        isOpen={Boolean(selectedSupplierForPrint)}
        onClose={() => setSelectedSupplierForPrint(null)}
        supplier={selectedSupplierForPrint}
      />
    </div>
  );
};
