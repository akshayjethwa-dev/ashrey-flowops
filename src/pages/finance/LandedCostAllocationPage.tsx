// src/pages/finance/LandedCostAllocationPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import {
  Ship,
  Plus,
  Download,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  RotateCcw,
  Eye,
  Edit3,
  Layers,
  Scale,
  DollarSign,
  TrendingUp,
  FileCheck,
  Building2,
  Calendar,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  PieChart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  LandedCostVoucher,
  LandedCostVoucherStatus,
  LandedCostAllocationRule
} from '../../types/landedCost';
import {
  landedCostService,
  ALLOCATION_RULES_METADATA,
  COMPONENT_LABELS
} from '../../services/landedCostService';
import { LandedCostKpiCards } from '../../components/landed-cost/LandedCostKpiCards';
import { LandedCostComponentBreakdownCard } from '../../components/landed-cost/LandedCostComponentBreakdownCard';
import { LandedCostRuleVisualizer } from '../../components/landed-cost/LandedCostRuleVisualizer';
import { LandedCostDetailDrawer } from '../../components/landed-cost/LandedCostDetailDrawer';
import { LandedCostVoucherModal } from '../../components/landed-cost/LandedCostVoucherModal';

export const LandedCostAllocationPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [vouchers, setVouchers] = useState<LandedCostVoucher[]>([]);
  const [activeTab, setActiveTab] = useState<'vouchers' | 'lots' | 'rules'>('vouchers');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ruleFilter, setRuleFilter] = useState<string>('all');

  // Modals & Drawers
  const [selectedVoucherForDrawer, setSelectedVoucherForDrawer] = useState<LandedCostVoucher | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [voucherToEdit, setVoucherToEdit] = useState<LandedCostVoucher | null>(null);

  // Load vouchers
  const loadData = () => {
    const list = landedCostService.getVouchers();
    setVouchers(list);
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('flowops_landed_cost_updated', handleUpdate);
    return () => {
      window.removeEventListener('flowops_landed_cost_updated', handleUpdate);
    };
  }, []);

  // Compute KPIs
  const kpis = useMemo(() => {
    return landedCostService.getSummaryKpis();
  }, [vouchers]);

  // Filter vouchers
  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      const matchesSearch =
        v.voucherNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.shipmentRef && v.shipmentRef.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (v.carrierName && v.carrierName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        v.lotLines.some((l) =>
          l.lotNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.itemName.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
      const matchesRule = ruleFilter === 'all' || v.defaultAllocationRule === ruleFilter;

      return matchesSearch && matchesStatus && matchesRule;
    });
  }, [vouchers, searchQuery, statusFilter, ruleFilter]);

  // Flattened lots for the Lots Audit Matrix Tab
  const allLotsMatrix = useMemo(() => {
    const rows: {
      voucherNumber: string;
      voucherDate: string;
      voucherStatus: LandedCostVoucherStatus;
      rule: LandedCostAllocationRule;
      lotNumber: string;
      itemCode: string;
      itemName: string;
      quantity: number;
      uom: string;
      weightKg: number;
      baseUnitCost: number;
      allocatedCostPerUnit: number;
      trueLandedCostPerUnit: number;
      landedMarkupPercent: number;
      totalAllocatedAmount: number;
    }[] = [];

    vouchers.forEach((v) => {
      v.lotLines.forEach((l) => {
        rows.push({
          voucherNumber: v.voucherNumber,
          voucherDate: v.voucherDate,
          voucherStatus: v.status,
          rule: v.defaultAllocationRule,
          lotNumber: l.lotNumber,
          itemCode: l.itemCode,
          itemName: l.itemName,
          quantity: l.quantity,
          uom: l.uom,
          weightKg: l.weightKg,
          baseUnitCost: l.baseUnitCost,
          allocatedCostPerUnit: l.allocatedCostPerUnit,
          trueLandedCostPerUnit: l.trueLandedCostPerUnit,
          landedMarkupPercent: l.landedMarkupPercent,
          totalAllocatedAmount: l.allocatedChargeAmount
        });
      });
    });

    return rows.filter((r) => {
      const matchesSearch =
        r.lotNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.voucherNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || r.voucherStatus === statusFilter;
      const matchesRule = ruleFilter === 'all' || r.rule === ruleFilter;
      return matchesSearch && matchesStatus && matchesRule;
    });
  }, [vouchers, searchQuery, statusFilter, ruleFilter]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  // Actions
  const handleOpenNewVoucher = () => {
    setVoucherToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditVoucher = (voucher: LandedCostVoucher) => {
    setVoucherToEdit(voucher);
    setIsModalOpen(true);
  };

  const handleOpenDetail = (voucher: LandedCostVoucher) => {
    setSelectedVoucherForDrawer(voucher);
    setIsDrawerOpen(true);
  };

  const handleSaveVoucher = (voucherData: Partial<LandedCostVoucher>, andPost?: boolean) => {
    const saved = landedCostService.saveVoucher(voucherData);
    if (andPost) {
      landedCostService.postVoucher(saved.id);
    }
    loadData();
    setIsModalOpen(false);
  };

  const handlePostVoucher = (id: string) => {
    landedCostService.postVoucher(id);
    loadData();
    if (selectedVoucherForDrawer?.id === id) {
      setSelectedVoucherForDrawer(landedCostService.getVoucherById(id) || null);
    }
  };

  const handleReverseVoucher = (id: string) => {
    landedCostService.reverseVoucher(id);
    loadData();
    if (selectedVoucherForDrawer?.id === id) {
      setSelectedVoucherForDrawer(landedCostService.getVoucherById(id) || null);
    }
  };

  const handleExportCsv = () => {
    const csvContent = landedCostService.exportAuditCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `flowops_landed_cost_audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner / Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Finance & Cost Control</span>
            <span>/</span>
            <span className="text-cyan-400 font-semibold">Landed Cost Allocation</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 text-white shadow-lg shadow-cyan-950">
              <Ship className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Landed Cost Allocation Engine
              </h1>
              <p className="text-xs text-slate-400">
                Capitalize freight, customs duties, port handling, and transit insurance directly into material lot unit costs (Ind AS 2 / IAS 2)
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigate('/aging-valuation')}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition"
            title="Inspect how landed costs capitalize into Stock Aging & Valuation"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Inventory Valuation</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Export Audit CSV</span>
          </button>

          <button
            onClick={handleOpenNewVoucher}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-cyan-950 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Landed Cost Voucher</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <LandedCostKpiCards
        kpis={kpis}
        onOpenNewVoucher={handleOpenNewVoucher}
        onQuickFilterStatus={(st) => setStatusFilter(st)}
      />

      {/* Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('vouchers')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'vouchers'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            Landed Cost Vouchers ({vouchers.length})
          </button>

          <button
            onClick={() => setActiveTab('lots')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'lots'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            Lot Capitalization Matrix ({allLotsMatrix.length})
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'rules'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Scale className="w-4 h-4" />
            Rule Visualizer & Components
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lot, voucher, carrier..."
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 outline-none w-48 sm:w-60"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="posted">Posted (In Inventory)</option>
            <option value="draft">Draft (Unposted)</option>
            <option value="reversed">Reversed</option>
          </select>

          <select
            value={ruleFilter}
            onChange={(e) => setRuleFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 outline-none"
          >
            <option value="all">All Allocation Rules</option>
            <option value="by_weight">By Weight (kg/MT)</option>
            <option value="by_value">By Value (INR)</option>
            <option value="by_quantity">By Quantity (Pcs)</option>
          </select>
        </div>
      </div>

      {/* TAB 1: Vouchers Ledger */}
      {activeTab === 'vouchers' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Voucher No & Date</th>
                    <th className="py-3 px-4">Consignment & Carrier</th>
                    <th className="py-3 px-4">Allocation Rule</th>
                    <th className="py-3 px-4">Charges & Lots</th>
                    <th className="py-3 px-4 text-right">Landed Cost Absorbed</th>
                    <th className="py-3 px-4 text-right">Effective Markup</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredVouchers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        No landed cost vouchers match your active filters.
                      </td>
                    </tr>
                  ) : (
                    filteredVouchers.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleOpenDetail(v)}
                            className="font-bold text-cyan-300 hover:text-cyan-200 text-left block"
                          >
                            {v.voucherNumber}
                          </button>
                          <span className="text-[11px] text-slate-500 block font-normal">
                            {v.voucherDate}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-sans">
                          <div className="text-slate-200 font-medium line-clamp-1">{v.title}</div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                            {v.originLocation.split(',')[0]} → {v.destinationPlant.split(' ')[0]}
                            {v.shipmentRef && <span>• {v.shipmentRef}</span>}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-sans">
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md">
                            <Scale className="w-3 h-3 text-cyan-400" />
                            {ALLOCATION_RULES_METADATA[v.defaultAllocationRule]?.name}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-300 font-mono">
                          <div>{v.charges.length} Invoices</div>
                          <div className="text-[11px] text-slate-500">
                            {v.lotLines.length} Lots Capitalized
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="font-bold text-cyan-300">
                            +{formatCurrency(v.totalLandedCharges)}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Base: {formatCurrency(v.totalBaseValue)}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <span className="inline-flex items-center gap-0.5 text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded text-[11px] border border-amber-800/50">
                            <TrendingUp className="w-3 h-3" />
                            +{v.effectiveMarkupPercent.toFixed(1)}%
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              v.status === 'posted'
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
                                : v.status === 'reversed'
                                ? 'bg-rose-950/80 text-rose-300 border-rose-800/80'
                                : 'bg-amber-950/80 text-amber-300 border-amber-800/80'
                            }`}
                          >
                            {v.status === 'posted' ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" /> Capitalized
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3" /> {v.status.toUpperCase()}
                              </>
                            )}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 font-sans">
                            <button
                              onClick={() => handleOpenDetail(v)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                              title="View voucher audit breakdown"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {v.status === 'draft' && (
                              <>
                                <button
                                  onClick={() => handleEditVoucher(v)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                                  title="Edit draft voucher"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handlePostVoucher(v.id)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition shadow-sm"
                                  title="Post to inventory layers"
                                >
                                  <CheckCircle2 className="w-3 h-3" /> Post
                                </button>
                              </>
                            )}

                            {v.status === 'posted' && (
                              <button
                                onClick={() => handleReverseVoucher(v.id)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 transition"
                                title="Reverse voucher allocation"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Lot Capitalization Matrix */}
      {activeTab === 'lots' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Item Lot Capitalization Audit Matrix
                </h3>
                <p className="text-xs text-slate-400">
                  Full ledger of physical inventory lots with base PO price, allocated landed cost, and true capitalized unit cost
                </p>
              </div>
              <button
                onClick={handleExportCsv}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition"
              >
                <Download className="w-3 h-3" /> Export Matrix
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Lot Number</th>
                    <th className="py-3 px-4">Item & Code</th>
                    <th className="py-3 px-4">Voucher No</th>
                    <th className="py-3 px-4 text-right">Quantity & Weight</th>
                    <th className="py-3 px-4 text-right">Base Invoice Cost</th>
                    <th className="py-3 px-4 text-right">Allocated Surcharge</th>
                    <th className="py-3 px-4 text-right">True Landed Cost</th>
                    <th className="py-3 px-4 text-right">Cost Markup %</th>
                    <th className="py-3 px-4">Valuation Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {allLotsMatrix.map((lot, idx) => (
                    <tr key={`${lot.lotNumber}-${idx}`} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 font-bold text-cyan-300">
                        {lot.lotNumber}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className="text-slate-200 font-medium block">{lot.itemName}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{lot.itemCode}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {lot.voucherNumber}
                        <span className="text-[10px] text-slate-500 block font-sans">
                          {ALLOCATION_RULES_METADATA[lot.rule]?.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-300">
                        {lot.quantity} {lot.uom}
                        <span className="text-[10px] text-slate-500 block">
                          {lot.weightKg.toLocaleString()} kg
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400">
                        {formatCurrency(lot.baseUnitCost)}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-400 font-semibold">
                        +{formatCurrency(lot.allocatedCostPerUnit)}/{lot.uom}
                        <span className="text-[10px] text-slate-500 block font-normal">
                          Tot: {formatCurrency(lot.totalAllocatedAmount)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-white bg-slate-900/40">
                        {formatCurrency(lot.trueLandedCostPerUnit)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-0.5 text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded text-[10px] border border-amber-800/50">
                          <TrendingUp className="w-2.5 h-2.5" />
                          +{lot.landedMarkupPercent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                            lot.voucherStatus === 'posted'
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
                              : 'bg-amber-950/80 text-amber-300 border-amber-800/80'
                          }`}
                        >
                          {lot.voucherStatus === 'posted' ? 'In FIFO / WAC' : 'Pending Post'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Component Breakdown & Allocation Rules Visualizer */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          <LandedCostComponentBreakdownCard
            byComponent={kpis.byComponent}
            totalAbsorbed={kpis.totalLandedCostsAbsorbed}
          />

          {vouchers.length > 0 && (
            <LandedCostRuleVisualizer
              voucher={vouchers[0]}
              onApplyRule={(rule) => {
                landedCostService.saveVoucher({
                  id: vouchers[0].id,
                  defaultAllocationRule: rule
                });
                loadData();
              }}
            />
          )}
        </div>
      )}

      {/* Modals & Drawers */}
      <LandedCostDetailDrawer
        voucher={selectedVoucherForDrawer}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onPostVoucher={handlePostVoucher}
        onReverseVoucher={handleReverseVoucher}
        onEditVoucher={handleEditVoucher}
        onExportCsv={handleExportCsv}
      />

      <LandedCostVoucherModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveVoucher}
        initialVoucher={voucherToEdit}
      />
    </div>
  );
};
