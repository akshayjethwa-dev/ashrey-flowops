// src/pages/dispatch/DispatchDashboardPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  ReadyToShipOrder, 
  DispatchScheduleEvent, 
  OnTimeDeliveryKpiSummary 
} from '../../types/dispatchManagement';
import { FqcInspectionOrder } from '../../types/fqc';
import { Order, Dispatch } from '../../types';
import { dispatchDashboardService } from '../../services/dispatchDashboardService';
import { DispatchCreateForm } from './DispatchCreateForm';
import { QuickFqcReleaseModal } from '../../components/dispatch/QuickFqcReleaseModal';
import { ScheduleDispatchModal } from '../../components/dispatch/ScheduleDispatchModal';
import { 
  Truck, 
  ShieldCheck, 
  AlertOctagon, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Plus, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Warehouse, 
  MapPin, 
  FileText, 
  Package, 
  AlertTriangle, 
  Award, 
  RefreshCw, 
  SlidersHorizontal,
  ExternalLink,
  Layers,
  ArrowUpRight,
  ClipboardList
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const DispatchDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const { toastSuccess, toastInfo } = useToast();

  // Active main tab
  const [activeTab, setActiveTab] = useState<'ready_to_ship' | 'pending_fqc' | 'calendar' | 'otd_kpi'>('ready_to_ship');

  // Loading state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [readyOrders, setReadyOrders] = useState<ReadyToShipOrder[]>([]);
  const [pendingFqcList, setPendingFqcList] = useState<FqcInspectionOrder[]>([]);
  const [scheduleEvents, setScheduleEvents] = useState<DispatchScheduleEvent[]>([]);
  const [otdKpi, setOtdKpi] = useState<OnTimeDeliveryKpiSummary | null>(null);

  // Modals & Action States
  const [isCreateDispatchOpen, setIsCreateDispatchOpen] = useState(false);
  const [preselectedOrderForDispatch, setPreselectedOrderForDispatch] = useState<Order | null>(null);

  const [selectedFqcForRelease, setSelectedFqcForRelease] = useState<FqcInspectionOrder | null>(null);
  const [isFqcReleaseModalOpen, setIsFqcReleaseModalOpen] = useState(false);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [targetOrderForSchedule, setTargetOrderForSchedule] = useState<ReadyToShipOrder | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Filters for Ready-to-Ship Queue
  const [searchRts, setSearchRts] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'urgent' | 'high' | 'normal'>('all');
  const [fqcFilter, setFqcFilter] = useState<'all' | 'cleared' | 'on_hold' | 'pending'>('all');

  // Filters for Calendar
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());
  const [bayFilter, setBayFilter] = useState<string>('all');
  const [calendarViewMode, setCalendarViewMode] = useState<'month' | 'agenda'>('month');

  // Load all dashboard components
  const loadDashboardData = async () => {
    const tenantId = tenant?.id || 'demo';
    setLoading(true);
    try {
      const [rts, fqc, sched, kpi] = await Promise.all([
        dispatchDashboardService.getReadyToShipOrders(tenantId),
        Promise.resolve(dispatchDashboardService.getPendingFqcInspections()),
        dispatchDashboardService.getDispatchSchedule(tenantId),
        dispatchDashboardService.getOnTimeDeliveryKpi(tenantId)
      ]);

      setReadyOrders(rts);
      setPendingFqcList(fqc);
      setScheduleEvents(sched);
      setOtdKpi(kpi);
    } catch (err) {
      console.error('Failed to load dispatch dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [tenant?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  // Dispatch Now handler
  const handleDispatchNow = (order: ReadyToShipOrder) => {
    setPreselectedOrderForDispatch(order.orderObj);
    setIsCreateDispatchOpen(true);
  };

  // Schedule Dispatch handler
  const handleOpenScheduleForOrder = (order: ReadyToShipOrder) => {
    setTargetOrderForSchedule(order);
    setSelectedCalendarDate(order.deliveryDueDate);
    setIsScheduleModalOpen(true);
  };

  // Release FQC handler
  const handleOpenFqcRelease = (order: FqcInspectionOrder) => {
    setSelectedFqcForRelease(order);
    setIsFqcReleaseModalOpen(true);
  };

  const handleFqcReleased = () => {
    toastSuccess('Quality Released', 'Certificate of Conformance authorized and order released for dispatch.', 4000);
    loadDashboardData();
  };

  const handleScheduleCreated = (newEvent: DispatchScheduleEvent) => {
    setScheduleEvents(prev => [newEvent, ...prev]);
    toastSuccess('Dispatch Scheduled', `Consignment for ${newEvent.customerName} scheduled on ${newEvent.scheduledDate}.`, 4000);
  };

  // Filtered Ready to Ship Orders
  const filteredReadyOrders = useMemo(() => {
    return readyOrders.filter(ord => {
      const q = searchRts.toLowerCase();
      const matchesSearch = 
        ord.orderNumber.toLowerCase().includes(q) ||
        ord.customerName.toLowerCase().includes(q) ||
        (ord.customerPoNumber && ord.customerPoNumber.toLowerCase().includes(q)) ||
        ord.itemsSummary.toLowerCase().includes(q);

      const matchesUrgency = urgencyFilter === 'all' || ord.urgency === urgencyFilter;
      const matchesFqc = fqcFilter === 'all' || ord.fqcStatus === fqcFilter;

      return matchesSearch && matchesUrgency && matchesFqc;
    });
  }, [readyOrders, searchRts, urgencyFilter, fqcFilter]);

  // Calendar month days calculation
  const calendarDays = useMemo(() => {
    const year = currentCalendarMonth.getFullYear();
    const month = currentCalendarMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Previous month padding
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: null, dateStr: '', isCurrentMonth: false });
    }
    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, dateStr, isCurrentMonth: true });
    }
    return days;
  }, [currentCalendarMonth]);

  const handlePrevMonth = () => {
    setCurrentCalendarMonth(new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentCalendarMonth(new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() + 1, 1));
  };

  const handleTodayMonth = () => {
    setCurrentCalendarMonth(new Date());
  };

  // Filtered schedule events for calendar
  const filteredScheduleEvents = useMemo(() => {
    return scheduleEvents.filter(ev => {
      if (bayFilter === 'all') return true;
      return ev.dockBay.toLowerCase().includes(bayFilter.toLowerCase());
    });
  }, [scheduleEvents, bayFilter]);

  // KPI aggregates
  const totalRtsValue = readyOrders.reduce((sum, o) => sum + o.totalValue, 0);
  const urgentOrdersCount = readyOrders.filter(o => o.urgency === 'urgent').length;
  const pendingFqcCount = pendingFqcList.length;
  const todayDateStr = new Date().toISOString().split('T')[0];
  const scheduledTodayCount = scheduleEvents.filter(e => e.scheduledDate === todayDateStr).length;

  return (
    <div className="space-y-6 font-sans select-none pb-12">
      
      {/* 1. Header Command Desk */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold text-indigo-650 uppercase tracking-widest block leading-none">
              PLANT OPERATIONS & DISPATCH CONTROL
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase">
              Live Fleet Active
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight block mt-1.5">
            Plant Dispatch & Outward Logistics Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Prioritize orders ready to ship, clear pending quality release gates (FQC & holds), manage dock schedule, and monitor On-Time Delivery (OTD).
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center flex-wrap gap-2.5 shrink-0 self-start lg:self-center">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-mono transition cursor-pointer"
            title="Refresh operational live metrics"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <button
            onClick={() => navigate('/dispatch')}
            className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-mono text-xs uppercase font-bold px-3.5 py-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            title="View full Outward Cargo Manifest table & Lorry receipts"
          >
            <ClipboardList className="h-4 w-4 text-slate-600" />
            <span>Shipping Manifest</span>
          </button>

          <button
            onClick={() => {
              setTargetOrderForSchedule(null);
              setIsScheduleModalOpen(true);
            }}
            className="border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-mono text-xs uppercase font-bold px-3.5 py-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            title="Schedule an outward dispatch truck onto the calendar"
          >
            <CalendarIcon className="h-4 w-4 text-indigo-600" />
            <span>Schedule Truck</span>
          </button>

          <button
            onClick={() => {
              setPreselectedOrderForDispatch(null);
              setIsCreateDispatchOpen(true);
            }}
            className="bg-indigo-650 hover:bg-indigo-700 text-white font-mono text-xs uppercase font-extrabold tracking-wider px-4 py-2.5 rounded-lg flex items-center space-x-1.5 transition shadow-2xs cursor-pointer"
          >
            <Plus className="h-4 w-4 text-indigo-200" />
            <span>Dispatch Cargo Now</span>
          </button>
        </div>
      </div>

      {/* 2. Executive Operational KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Ready to Ship */}
        <div 
          onClick={() => setActiveTab('ready_to_ship')}
          className={`p-4 rounded-xl border transition cursor-pointer shadow-3xs ${
            activeTab === 'ready_to_ship' 
              ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20' 
              : 'bg-white border-slate-200 hover:border-indigo-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span className="font-bold uppercase tracking-wider text-[10px]">Ready to Ship</span>
            <Package className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{readyOrders.length}</span>
            <span className="text-xs font-mono text-slate-500">Orders ({urgentOrdersCount} urgent)</span>
          </div>
          <div className="mt-1 text-[11px] font-mono text-indigo-700 font-semibold truncate">
            ₹{totalRtsValue.toLocaleString('en-IN')} staged cargo
          </div>
        </div>

        {/* Metric 2: Pending Quality Release */}
        <div 
          onClick={() => setActiveTab('pending_fqc')}
          className={`p-4 rounded-xl border transition cursor-pointer shadow-3xs ${
            activeTab === 'pending_fqc' 
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20' 
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span className="font-bold uppercase tracking-wider text-[10px]">Pending Quality Release</span>
            <ShieldCheck className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{pendingFqcCount}</span>
            <span className="text-xs font-mono text-slate-500">FQC Lots Blocked</span>
          </div>
          <div className="mt-1 text-[11px] font-mono text-amber-800 font-semibold truncate">
            Awaiting CoC authority e-sign
          </div>
        </div>

        {/* Metric 3: Today's Dock Schedule */}
        <div 
          onClick={() => setActiveTab('calendar')}
          className={`p-4 rounded-xl border transition cursor-pointer shadow-3xs ${
            activeTab === 'calendar' 
              ? 'bg-sky-50/70 border-sky-300 ring-2 ring-sky-500/20' 
              : 'bg-white border-slate-200 hover:border-sky-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span className="font-bold uppercase tracking-wider text-[10px]">Dispatch Schedule</span>
            <CalendarIcon className="h-4 w-4 text-sky-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{scheduledTodayCount}</span>
            <span className="text-xs font-mono text-slate-500">Scheduled Today</span>
          </div>
          <div className="mt-1 text-[11px] font-mono text-sky-700 font-semibold truncate">
            Across 4 plant dock bays
          </div>
        </div>

        {/* Metric 4: On-Time Delivery (OTD) KPI */}
        <div 
          onClick={() => setActiveTab('otd_kpi')}
          className={`p-4 rounded-xl border transition cursor-pointer shadow-3xs ${
            activeTab === 'otd_kpi' 
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20' 
              : 'bg-white border-slate-200 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span className="font-bold uppercase tracking-wider text-[10px]">On-Time Delivery (OTD)</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-700 tracking-tight">
              {otdKpi ? `${otdKpi.overallOtdPct}%` : '96.2%'}
            </span>
            <span className="text-[11px] font-mono text-emerald-800 font-bold">vs 95% SLA Target</span>
          </div>
          <div className="mt-1 text-[11px] font-mono text-slate-500 flex items-center space-x-1">
            <span className="text-emerald-600 font-bold">+{otdKpi?.monthOverMonthTrendPct || 2.3}%</span>
            <span>MoM improvement</span>
          </div>
        </div>

      </div>

      {/* 3. Primary Navigation Tabs (Zero-Pill Restrained Discipline) */}
      <div className="flex items-center space-x-1 border-b border-slate-200 text-xs font-mono">
        <button
          onClick={() => setActiveTab('ready_to_ship')}
          className={`py-3 px-4 font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition cursor-pointer ${
            activeTab === 'ready_to_ship'
              ? 'border-indigo-650 text-indigo-900 bg-indigo-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Package className="h-4 w-4" />
          <span>Orders Ready to Ship ({readyOrders.length})</span>
          {urgentOrdersCount > 0 && (
            <span className="bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded text-[10px] font-bold">
              {urgentOrdersCount} urgent
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('pending_fqc')}
          className={`py-3 px-4 font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition cursor-pointer ${
            activeTab === 'pending_fqc'
              ? 'border-amber-600 text-amber-900 bg-amber-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Pending Quality Release ({pendingFqcList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`py-3 px-4 font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition cursor-pointer ${
            activeTab === 'calendar'
              ? 'border-sky-600 text-sky-900 bg-sky-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <CalendarIcon className="h-4 w-4" />
          <span>Dispatch Schedule & Calendar ({scheduleEvents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('otd_kpi')}
          className={`py-3 px-4 font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition cursor-pointer ${
            activeTab === 'otd_kpi'
              ? 'border-emerald-600 text-emerald-900 bg-emerald-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>On-Time Delivery (OTD) KPI</span>
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          TAB 1: ORDERS READY TO SHIP (Acceptance Criteria 1)
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'ready_to_ship' && (
        <div className="space-y-4">
          
          {/* Filter Bar */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-3xs">
            
            <div className="flex items-center space-x-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search order #, customer, item SKU, or PO #..."
                  value={searchRts}
                  onChange={e => setSearchRts(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Urgency Filter */}
              <div className="flex items-center space-x-1 text-xs font-mono">
                <span className="text-[10px] text-slate-400 uppercase font-bold pl-1">Priority:</span>
                {(['all', 'urgent', 'high', 'normal'] as const).map(urg => (
                  <button
                    key={urg}
                    onClick={() => setUrgencyFilter(urg)}
                    className={`px-2.5 py-1 text-[11px] rounded uppercase font-bold transition cursor-pointer ${
                      urgencyFilter === urg 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {urg}
                  </button>
                ))}
              </div>
            </div>

            {/* FQC gate filter */}
            <div className="flex items-center space-x-1 text-xs font-mono">
              <span className="text-[10px] text-slate-400 uppercase font-bold">FQC Release:</span>
              {(['all', 'cleared', 'on_hold'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFqcFilter(f)}
                  className={`px-2 py-1 text-[10px] rounded uppercase font-bold transition cursor-pointer ${
                    fqcFilter === f 
                      ? 'bg-indigo-650 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f === 'all' ? 'All Gate' : f === 'cleared' ? 'Cleared (CoC)' : 'On-Hold'}
                </button>
              ))}
            </div>

          </div>

          {/* Ready to Ship Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-mono text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-4">Priority / Due Date</th>
                    <th className="py-3 px-4">Order / PO Reference</th>
                    <th className="py-3 px-4">Customer & Unloading Point</th>
                    <th className="py-3 px-4">Finished Goods & Quantity</th>
                    <th className="py-3 px-4">Quality Gate (FQC)</th>
                    <th className="py-3 px-4">Dock Bay & Packaging</th>
                    <th className="py-3 px-4 text-right">Dispatch Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReadyOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-mono text-xs">
                        No orders match the specified filters in the ready-to-ship staging yard.
                      </td>
                    </tr>
                  ) : (
                    filteredReadyOrders.map(order => (
                      <tr key={order.orderId} className="hover:bg-slate-50/80 transition-colors">
                        
                        {/* Priority / Due Date */}
                        <td className="py-3.5 px-4 font-mono">
                          <div className="flex items-center space-x-1.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              order.urgency === 'urgent' ? 'bg-rose-100 text-rose-800' :
                              order.urgency === 'high' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {order.urgency}
                            </span>
                            {order.isOverdue && (
                              <span className="text-[9px] text-rose-600 font-extrabold uppercase">Overdue</span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 block mt-1">
                            Due: {order.deliveryDueDate}
                          </span>
                        </td>

                        {/* Order & PO */}
                        <td className="py-3.5 px-4 font-mono">
                          <span className="font-bold text-slate-900 block">{order.orderNumber}</span>
                          <span className="text-[10px] text-slate-500 block truncate max-w-[140px]">
                            {order.customerPoNumber ? `PO: ${order.customerPoNumber}` : 'Standard Contract'}
                          </span>
                          <span className="text-[10px] text-indigo-700 font-semibold block">
                            ₹{order.totalValue.toLocaleString('en-IN')}
                          </span>
                        </td>

                        {/* Customer & Destination */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block truncate max-w-[190px]">
                            {order.customerName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono block truncate max-w-[190px] flex items-center space-x-1 mt-0.5">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0 inline" />
                            <span>{order.destination}</span>
                          </span>
                        </td>

                        {/* Items & Qty */}
                        <td className="py-3.5 px-4 font-mono">
                          <span className="font-bold text-slate-800 block truncate max-w-[210px]" title={order.itemsSummary}>
                            {order.itemsSummary}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            Total Units: <strong>{order.totalQuantity} Nos</strong> · {order.itemCount} line items
                          </span>
                        </td>

                        {/* FQC Status Gate */}
                        <td className="py-3.5 px-4 font-mono">
                          {order.fqcStatus === 'cleared' ? (
                            <div>
                              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                <span>Cleared for Dispatch</span>
                              </span>
                              {order.cocNumber && (
                                <span className="text-[9px] text-slate-500 block mt-0.5">
                                  {order.cocNumber}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div>
                              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded uppercase">
                                <AlertTriangle className="h-3 w-3 text-amber-600" />
                                <span>Quality Hold Active</span>
                              </span>
                              <span className="text-[9px] text-amber-700 block mt-0.5">
                                Pending QA Sign-Off
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Packaging & Dock Bay */}
                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          <span className="text-slate-800 font-medium block">
                            {order.assignedDockBay}
                          </span>
                          <span className="text-[10px] text-slate-500 uppercase block mt-0.5">
                            Pack: <strong className="text-slate-700">{order.packagingStatus}</strong>
                          </span>
                        </td>

                        {/* Dispatch Action */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleOpenScheduleForOrder(order)}
                              className="px-2.5 py-1.5 border border-slate-300 hover:border-slate-400 bg-white text-slate-700 rounded-lg font-mono text-[10px] uppercase font-bold transition cursor-pointer"
                              title="Schedule truck departure on calendar"
                            >
                              Schedule
                            </button>

                            <button
                              onClick={() => handleDispatchNow(order)}
                              className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg font-mono text-[10px] uppercase font-extrabold transition flex items-center space-x-1 shadow-2xs cursor-pointer"
                              title="Immediately create dispatch documentation & lorry receipt"
                            >
                              <Truck className="h-3.5 w-3.5" />
                              <span>Dispatch Now</span>
                            </button>
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

      {/* ═════════════════════════════════════════════════════════════
          TAB 2: PENDING QUALITY RELEASE (Acceptance Criteria 2)
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'pending_fqc' && (
        <div className="space-y-4">
          
          {/* Header Note */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 font-mono shadow-3xs">
            <div className="flex items-center space-x-3">
              <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold block">Final Quality Control (FQC) Dispatch Release Gate</span>
                <span className="text-[11px] text-amber-800 block">
                  Mandatory ISO 9001:2015 & IATF 16949 Section 8.6 release requirement. Products cannot be loaded or dispatched without authorized e-sign.
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate('/fqc')}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-[10px] uppercase font-bold rounded-lg transition flex items-center space-x-1.5 cursor-pointer shrink-0"
            >
              <span>Open Full FQC Desk</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Pending FQC Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-mono text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-4">Inspection # / Lot</th>
                    <th className="py-3 px-4">Parent Order / Customer</th>
                    <th className="py-3 px-4">Part SKU & Component Name</th>
                    <th className="py-3 px-4">Batch Qty / Sample</th>
                    <th className="py-3 px-4">Defect Diagnostics</th>
                    <th className="py-3 px-4">Hold Reason / Gate State</th>
                    <th className="py-3 px-4 text-right">Quality Authority Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingFqcList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-mono text-xs">
                        No pending quality releases. All manufactured lots have cleared inspection gates.
                      </td>
                    </tr>
                  ) : (
                    pendingFqcList.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        
                        {/* FQC & Lot */}
                        <td className="py-3.5 px-4 font-mono">
                          <span className="font-bold text-slate-900 block">{item.fqcNumber}</span>
                          <span className="text-[10px] text-slate-500 block">
                            Lot: <strong>{item.lotNumber}</strong>
                          </span>
                        </td>

                        {/* Order & Customer */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block font-mono">{item.orderNumber}</span>
                          <span className="text-[10px] text-slate-500 block truncate max-w-[160px]">
                            {item.customerName}
                          </span>
                        </td>

                        {/* Part SKU & Name */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-indigo-900 block font-mono">{item.partSku}</span>
                          <span className="text-[11px] text-slate-600 block truncate max-w-[180px]">
                            {item.partName}
                          </span>
                        </td>

                        {/* Batch Qty & Sample */}
                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          <span className="text-slate-900 font-bold block">{item.batchQuantity} Nos</span>
                          <span className="text-[10px] text-slate-500 block">
                            Sample: {item.sampleSize} units inspected
                          </span>
                        </td>

                        {/* Defect Diagnostics */}
                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          <span className={`block font-bold ${
                            item.defectSummary.critical > 0 ? 'text-rose-600' :
                            item.defectSummary.major > 0 ? 'text-amber-600' : 'text-slate-600'
                          }`}>
                            Crit: {item.defectSummary.critical} · Maj: {item.defectSummary.major} · Min: {item.defectSummary.minor}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Inspector: {item.inspectorName || 'QA Lead'}
                          </span>
                        </td>

                        {/* Hold State */}
                        <td className="py-3.5 px-4 font-mono">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-block ${
                            item.holdStatus === 'quarantined' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.holdStatus === 'quarantined' ? 'Quarantined (NCR)' : 'Auto-Hold: Pending CoC'}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-1 truncate max-w-[180px]">
                            {item.failureReason || 'Awaiting quality checklist completion'}
                          </span>
                        </td>

                        {/* Quality Release Action */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenFqcRelease(item)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-mono text-[10px] uppercase font-bold transition flex items-center space-x-1.5 ml-auto shadow-2xs cursor-pointer"
                          >
                            <Award className="h-3.5 w-3.5" />
                            <span>Inspect & Release</span>
                          </button>
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

      {/* ═════════════════════════════════════════════════════════════
          TAB 3: DISPATCH CALENDAR & DOCK ALLOCATION (Acceptance Criteria 3)
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          
          {/* Calendar Controller Bar */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-3xs font-mono">
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <h2 className="text-sm font-bold text-slate-900 w-44 text-center">
                {currentCalendarMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
              </h2>

              <button
                onClick={handleNextMonth}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                onClick={handleTodayMonth}
                className="px-2.5 py-1 text-[10px] uppercase font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
              >
                Today
              </button>
            </div>

            {/* Dock Bay filter & view mode */}
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Dock Bay:</span>
                <select
                  value={bayFilter}
                  onChange={e => setBayFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">All Dock Bays (1-4)</option>
                  <option value="Bay #1">Dock Bay #1 (South)</option>
                  <option value="Bay #2">Dock Bay #2 (West)</option>
                  <option value="Bay #3">Dock Bay #3 (North)</option>
                  <option value="Bay #4">Special Handling Bay #4</option>
                </select>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCalendarViewMode('month')}
                  className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded transition cursor-pointer ${
                    calendarViewMode === 'month' ? 'bg-indigo-650 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Month Grid
                </button>
                <button
                  onClick={() => setCalendarViewMode('agenda')}
                  className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded transition cursor-pointer ${
                    calendarViewMode === 'agenda' ? 'bg-indigo-650 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Schedule Agenda
                </button>
              </div>
            </div>

          </div>

          {/* Dock Bay Congestion Meter */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            {[
              { bay: 'Dock Bay #1 (South)', note: 'Heavy Machining & Pallets', count: scheduleEvents.filter(e => e.dockBay.includes('#1')).length },
              { bay: 'Dock Bay #2 (West)', note: 'Medium Closed Containers', count: scheduleEvents.filter(e => e.dockBay.includes('#2')).length },
              { bay: 'Dock Bay #3 (North)', note: 'Express Parcel & Fast TAT', count: scheduleEvents.filter(e => e.dockBay.includes('#3')).length },
              { bay: 'Special Bay #4', note: 'Aero Cleanroom Handling', count: scheduleEvents.filter(e => e.dockBay.includes('#4')).length }
            ].map(b => (
              <div key={b.bay} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 shadow-3xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-[11px] truncate">{b.bay}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    b.count >= 4 ? 'bg-rose-100 text-rose-800' : 'bg-indigo-50 text-indigo-700'
                  }`}>
                    {b.count} trucks
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">{b.note}</p>
              </div>
            ))}
          </div>

          {/* Month View Grid */}
          {calendarViewMode === 'month' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs font-mono">
              
              {/* Day header */}
              <div className="grid grid-cols-7 bg-slate-900 text-white text-[10px] uppercase tracking-wider py-2.5 text-center font-bold">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 border-t border-slate-200">
                {calendarDays.map((cell, idx) => {
                  if (!cell.isCurrentMonth) {
                    return (
                      <div key={`empty-${idx}`} className="h-32 bg-slate-50/50 p-1.5 text-slate-300 text-[10px]" />
                    );
                  }

                  const dayEvents = filteredScheduleEvents.filter(e => e.scheduledDate === cell.dateStr);
                  const isToday = cell.dateStr === todayDateStr;

                  return (
                    <div 
                      key={cell.dateStr} 
                      className={`h-32 p-1.5 overflow-y-auto space-y-1 transition-colors ${
                        isToday ? 'bg-indigo-50/30 ring-1 ring-inset ring-indigo-400' : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className={`px-1.5 py-0.2 rounded ${
                          isToday ? 'bg-indigo-650 text-white' : 'text-slate-700'
                        }`}>
                          {cell.day}
                        </span>
                        
                        <button
                          onClick={() => {
                            setSelectedCalendarDate(cell.dateStr);
                            setIsScheduleModalOpen(true);
                          }}
                          className="opacity-40 hover:opacity-100 text-slate-600 hover:text-indigo-600 p-0.5 cursor-pointer"
                          title="Schedule dispatch on this date"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Scheduled Truck Cards inside Day */}
                      {dayEvents.map(ev => (
                        <div
                          key={ev.id}
                          className="p-1 rounded border text-[9px] leading-tight space-y-0.5 cursor-pointer bg-white border-slate-200 hover:border-indigo-400 shadow-3xs"
                          title={`${ev.dispatchNumber}: ${ev.customerName} via ${ev.transporter} (${ev.dockBay})`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-slate-900 truncate max-w-[80px]">{ev.dispatchNumber}</span>
                            <span className={`px-1 rounded text-[8px] uppercase ${
                              ev.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                              ev.status === 'Dispatched' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {ev.status}
                            </span>
                          </div>
                          <div className="text-slate-600 truncate font-sans">{ev.customerName}</div>
                          <div className="text-[8px] text-slate-400 truncate">{ev.transporter}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* Agenda View */}
          {calendarViewMode === 'agenda' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
              <div className="divide-y divide-slate-100">
                {filteredScheduleEvents.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 font-mono text-xs">
                    No outward dispatches scheduled for the active filters.
                  </div>
                ) : (
                  filteredScheduleEvents.map(ev => (
                    <div key={ev.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 font-mono text-xs">
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl shrink-0">
                          <Truck className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900">{ev.dispatchNumber}</span>
                            <span className="text-slate-300">·</span>
                            <span className="text-slate-600 font-sans font-semibold">{ev.customerName}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                              ev.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                              ev.status === 'Dispatched' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {ev.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Scheduled Date: <strong>{ev.scheduledDate}</strong> at {ev.scheduledTime || '11:00'} · {ev.dockBay}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-right">
                        <div>
                          <span className="text-[11px] text-slate-800 font-bold block">{ev.transporter}</span>
                          <span className="text-[10px] text-slate-400 block">{ev.vehicleNumber || 'Pending Plate'} · {ev.packagesCount} Cartons</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          TAB 4: ON-TIME DELIVERY (OTD) KPI (Acceptance Criteria 4)
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'otd_kpi' && otdKpi && (
        <div className="space-y-6">
          
          {/* Executive Overview Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* OTD Radial Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs space-y-3 font-mono">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Primary OTD KPI Performance
              </span>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-black text-slate-900 tracking-tight">
                    {otdKpi.overallOtdPct}%
                  </div>
                  <span className="text-xs text-emerald-700 font-bold block mt-1">
                    Exceeding SLA Target ({otdKpi.targetOtdPct}%)
                  </span>
                </div>
                <div className="h-16 w-16 rounded-full border-4 border-emerald-500 border-t-emerald-200 flex items-center justify-center font-bold text-xs text-emerald-800 bg-emerald-50">
                  +{otdKpi.monthOverMonthTrendPct}%
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                Measured across <strong>{otdKpi.totalDispatchesAnalyzed} commercial consignments</strong>. {otdKpi.onTimeCount} delivered strictly on or before customer promised date.
              </p>
            </div>

            {/* OTIF & Transit Speed */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs space-y-4 font-mono">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                OTIF & Plant Transit Metrics
              </span>
              
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span>On-Time In-Full (OTIF)</span>
                    <span className="text-indigo-650">{otdKpi.otifPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${otdKpi.otifPct}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                  <div>
                    <span className="text-slate-400 uppercase text-[9px] block">Avg Transit Time</span>
                    <strong className="text-slate-900 block">{otdKpi.avgTransitHours} Hours</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[9px] block">Dock Turnaround (TAT)</span>
                    <strong className="text-slate-900 block">{otdKpi.avgDockTurnaroundMinutes} Mins</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Delayed Dispatches Root Cause */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs space-y-3 font-mono">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Delay Root Cause Analysis ({otdKpi.delayedCount} Delayed)
              </span>
              <div className="space-y-2 text-[11px]">
                {otdKpi.rootCauses.map(rc => (
                  <div key={rc.cause} className="space-y-1">
                    <div className="flex justify-between text-slate-700">
                      <span className="truncate max-w-[200px]">{rc.cause}</span>
                      <strong className="text-slate-900">{rc.percentage}%</strong>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${rc.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Carrier Performance Leaderboard */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs font-mono">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">
                  TRANSPORTER & 3PL SCORECARD
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  Carrier On-Time Reliability Leaderboard
                </h3>
              </div>
              <span className="text-xs text-slate-300">
                Sorted by OTD Compliance
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase">
                    <th className="py-2.5 px-4">Carrier / Freight Partner</th>
                    <th className="py-2.5 px-4 text-center">Total Shipments</th>
                    <th className="py-2.5 px-4 text-center">On-Time</th>
                    <th className="py-2.5 px-4 text-center">OTD Compliance (%)</th>
                    <th className="py-2.5 px-4 text-center">Avg Transit Delay</th>
                    <th className="py-2.5 px-4 text-right">Carrier Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {otdKpi.carrierPerformance.map(cp => (
                    <tr key={cp.carrierName} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {cp.carrierName}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-700">
                        {cp.totalShipments}
                      </td>
                      <td className="py-3 px-4 text-center text-emerald-800 font-bold">
                        {cp.onTimeShipments}
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${
                          cp.otdPct >= 95 ? 'bg-emerald-100 text-emerald-800' :
                          cp.otdPct >= 90 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {cp.otdPct}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600">
                        {cp.avgDelayHours > 0 ? `+${cp.avgDelayHours} hrs` : '0 hrs (On Schedule)'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-amber-500 font-bold">
                          {'★'.repeat(cp.otdPct >= 98 ? 5 : cp.otdPct >= 92 ? 4 : 3)}
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

      {/* ═════════════════════════════════════════════════════════════
          MODALS & SUB-FLOWS
         ═════════════════════════════════════════════════════════════ */}

      {/* 1. Dispatch Create Form */}
      {isCreateDispatchOpen && (
        <DispatchCreateForm
          isOpen={isCreateDispatchOpen}
          onClose={() => setIsCreateDispatchOpen(false)}
          availableOrders={readyOrders.map(r => r.orderObj)}
          preselectedOrder={preselectedOrderForDispatch}
          onSuccess={() => {
            loadDashboardData();
            setIsCreateDispatchOpen(false);
          }}
        />
      )}

      {/* 2. Quick FQC Release Modal */}
      {isFqcReleaseModalOpen && selectedFqcForRelease && (
        <QuickFqcReleaseModal
          isOpen={isFqcReleaseModalOpen}
          onClose={() => setIsFqcReleaseModalOpen(false)}
          fqcOrder={selectedFqcForRelease}
          onReleased={handleFqcReleased}
        />
      )}

      {/* 3. Schedule Dispatch Modal */}
      {isScheduleModalOpen && (
        <ScheduleDispatchModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          targetOrder={targetOrderForSchedule}
          selectedDate={selectedCalendarDate}
          onScheduleCreated={handleScheduleCreated}
        />
      )}

    </div>
  );
};
