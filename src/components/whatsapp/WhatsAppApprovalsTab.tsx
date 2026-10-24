// src/components/whatsapp/WhatsAppApprovalsTab.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { 
  WhatsAppApprovalRequest, 
  WhatsAppApprovalAuditEntry, 
  WhatsAppApprovalStats,
  ApprovalRequestType,
  ApprovalUrgency 
} from './types';
import { 
  whatsappApprovalsService, 
  SEED_APPROVAL_REQUESTS 
} from '../../services/whatsappApprovalsService';
import { useToast } from '../../context/ToastContext';
import { 
  CheckCheck, 
  Check, 
  Clock, 
  AlertTriangle, 
  Send, 
  Plus, 
  RefreshCw, 
  FileCheck, 
  ShoppingBag, 
  Smartphone, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  ShieldCheck, 
  Copy, 
  Eye, 
  Search, 
  Filter, 
  Sparkles, 
  Bot, 
  Sliders, 
  X,
  ExternalLink,
  Layers,
  TrendingUp,
  Percent,
  DollarSign
} from 'lucide-react';

interface Props {
  tenantId: string;
}

export const WhatsAppApprovalsTab: React.FC<Props> = ({ tenantId }) => {
  const { toastSuccess, toastInfo, toastError } = useToast();

  // State
  const [requests, setRequests] = useState<WhatsAppApprovalRequest[]>([]);
  const [audits, setAudits] = useState<WhatsAppApprovalAuditEntry[]>([]);
  const [stats, setStats] = useState<WhatsAppApprovalStats>(whatsappApprovalsService.getStats(tenantId));
  
  // Selected for Phone Simulator
  const [selectedRequestId, setSelectedRequestId] = useState<string>('appr-req-1');
  const [simulatorReply, setSimulatorReply] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ApprovalRequestType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [auditSearch, setAuditSearch] = useState('');

  // New Request Modal
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newType, setNewType] = useState<ApprovalRequestType>('purchase_order');
  const [newRef, setNewRef] = useState(`PO-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [newTitle, setNewTitle] = useState('Urgent Raw Material Sourcing for Heavy Forging');
  const [newEntity, setNewEntity] = useState('Tata Prime Steel Ltd.');
  const [newAmount, setNewAmount] = useState(385000);
  const [newDiscount, setNewDiscount] = useState(0);
  const [newUrgency, setNewUrgency] = useState<ApprovalUrgency>('urgent');
  const [newJustification, setNewJustification] = useState('Stock level fell below safety buffer. Immediate PO authorization required to maintain shopfloor uptime.');
  const [newApproverName, setNewApproverName] = useState('Rajesh Kulkarni');
  const [newApproverRole, setNewApproverRole] = useState<'manager' | 'management' | 'admin'>('manager');
  const [newApproverPhone, setNewApproverPhone] = useState('+91 98201 12345');

  // Load Data
  const refreshData = () => {
    const loadedRequests = whatsappApprovalsService.getRequests(tenantId);
    setRequests(loadedRequests);
    setAudits(whatsappApprovalsService.getAuditLogs(tenantId));
    setStats(whatsappApprovalsService.getStats(tenantId));

    if (!selectedRequestId && loadedRequests.length > 0) {
      setSelectedRequestId(loadedRequests[0].id);
    }
  };

  useEffect(() => {
    refreshData();
  }, [tenantId]);

  // Selected Request for Phone
  const activeRequest = useMemo(() => {
    return requests.find(r => r.id === selectedRequestId) || requests[0] || null;
  }, [requests, selectedRequestId]);

  // Filtered Requests Queue
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const matchSearch = r.referenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.entityName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = typeFilter === 'all' || r.requestType === typeFilter;
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [requests, searchQuery, typeFilter, statusFilter]);

  // Filtered Audit Logs
  const filteredAudits = useMemo(() => {
    return audits.filter(a => {
      return a.referenceId.toLowerCase().includes(auditSearch.toLowerCase()) ||
        a.approverName.toLowerCase().includes(auditSearch.toLowerCase()) ||
        a.comments.toLowerCase().includes(auditSearch.toLowerCase()) ||
        a.title.toLowerCase().includes(auditSearch.toLowerCase());
    });
  }, [audits, auditSearch]);

  // Handle WhatsApp Button Action
  const handleAction = async (action: 'approve' | 'reject' | 'revise', comments: string = '') => {
    if (!activeRequest) return;

    try {
      const res = await whatsappApprovalsService.executeApprovalAction(
        tenantId,
        activeRequest.id,
        action,
        {
          name: activeRequest.approverName,
          role: activeRequest.approverRole === 'manager' ? 'Procurement / Sales Manager' : 'Executive Director',
          phone: activeRequest.approverPhone
        },
        comments,
        'whatsapp_interactive_button'
      );

      setSimulatorReply(res.confirmationReply);
      refreshData();

      if (action === 'approve') {
        toastSuccess(`Approved ${activeRequest.referenceId} via WhatsApp! ERP state synchronized.`);
      } else if (action === 'reject') {
        toastInfo(`Rejected ${activeRequest.referenceId} via WhatsApp. Requester notified.`);
      } else {
        toastInfo(`Revision requested for ${activeRequest.referenceId}.`);
      }
    } catch (err: any) {
      toastError(err.message || 'Action failed.');
    }
  };

  // Handle Create New Approval Request
  const handleCreateRequest = async () => {
    try {
      const req = await whatsappApprovalsService.dispatchApprovalRequest(tenantId, {
        tenantId,
        requestType: newType,
        referenceId: newRef,
        title: newTitle,
        entityName: newEntity,
        amount: Number(newAmount),
        discountPercent: newDiscount > 0 ? Number(newDiscount) : undefined,
        requestedBy: {
          name: 'Current User',
          role: 'Procurement / Commercial Desk',
          phone: '+91 98201 00000'
        },
        approverRole: newApproverRole,
        approverName: newApproverName,
        approverPhone: newApproverPhone,
        urgency: newUrgency,
        justification: newJustification
      });

      setSelectedRequestId(req.id);
      setSimulatorReply(null);
      setNewModalOpen(false);
      refreshData();
      toastSuccess(`Approval request for ${req.referenceId} dispatched to ${req.approverName} via WhatsApp!`);
    } catch (err: any) {
      toastError(err.message || 'Failed to dispatch request.');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toastSuccess(`Copied ${label} to clipboard!`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6">

      {/* 1. TOP BENTO KPI BAR */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-3xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">Pending Queue</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">{stats.pendingCount}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">Awaiting Manager Tap</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-3xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">Approved Value</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">{formatCurrency(stats.totalApprovedValue)}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">{stats.approvedCount} Authorizations</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-3xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">Turnaround Time</span>
            <TrendingUp className="h-4 w-4 text-sky-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">{stats.avgResponseTimeMinutes} mins</div>
          <div className="text-[10px] text-sky-600 mt-0.5">vs 4.8 hrs via Email</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-3xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">WhatsApp Response</span>
            <CheckCheck className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">{stats.responseRatePercent}%</div>
          <div className="text-[10px] text-indigo-600 mt-0.5">Button Action Rate</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-3xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">Audit Integrity</span>
            <ShieldCheck className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">100% SHA256</div>
          <div className="text-[10px] text-purple-600 mt-0.5">Cryptographic Proof</div>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN WORKBENCH: PHONE SIMULATOR & PENDING QUEUE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT: LIVE WHATSAPP PHONE SIMULATOR (5 COLS) */}
        <div className="lg:col-span-5 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Smartphone className="h-4 w-4 text-emerald-600" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                Manager's WhatsApp Screen
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
              ● Live Button Interaction
            </span>
          </div>

          {/* Smartphone Frame */}
          <div className="w-full max-w-sm mx-auto bg-slate-900 rounded-[32px] p-3 shadow-2xl border-4 border-slate-800">
            {/* Screen Top Bar */}
            <div className="bg-emerald-800 text-white rounded-t-[20px] px-3.5 py-2.5 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-[10px] border border-emerald-400">
                  FO
                </div>
                <div>
                  <div className="font-bold text-[11px] leading-tight">FlowOps Approvals Desk</div>
                  <div className="text-[9px] text-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 inline-block animate-pulse"></span>
                    Verified Business Account
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-emerald-200">24/7 Gate</span>
            </div>

            {/* Chat Screen Body */}
            <div className="bg-[#E5DDD5] h-[480px] overflow-y-auto p-3 space-y-3 font-sans text-xs">
              
              {/* WhatsApp Date Divider */}
              <div className="flex justify-center my-1">
                <span className="bg-white/80 text-slate-600 text-[10px] px-2 py-0.5 rounded-md shadow-3xs font-mono">
                  Today
                </span>
              </div>

              {/* Incoming Approval Request Card */}
              {activeRequest ? (
                <div className="space-y-2">
                  <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-emerald-500 max-w-[95%] space-y-2">
                    
                    {/* Urgency & Type */}
                    <div className="flex items-center justify-between text-[10px] font-mono border-b border-slate-100 pb-1.5">
                      <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                        activeRequest.urgency === 'critical' ? 'bg-rose-100 text-rose-800' :
                        activeRequest.urgency === 'urgent' ? 'bg-amber-100 text-amber-800' :
                        'bg-sky-100 text-sky-800'
                      }`}>
                        {activeRequest.urgency === 'critical' ? '🔴 Critical' : activeRequest.urgency === 'urgent' ? '🟠 Urgent' : '🟡 Standard'}
                      </span>
                      <span className="text-slate-400 font-mono">
                        {activeRequest.requestType.toUpperCase().replace('_', ' ')}
                      </span>
                    </div>

                    {/* Content */}
                    <div>
                      <div className="font-bold text-slate-900 text-xs">
                        {activeRequest.referenceId}
                      </div>
                      <div className="text-[11px] text-slate-700 font-semibold mt-0.5">
                        {activeRequest.title}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Beneficiary: <strong className="text-slate-700">{activeRequest.entityName}</strong>
                      </div>
                    </div>

                    {/* Financial Pill */}
                    <div className="bg-slate-50 border border-slate-200 rounded p-2 flex items-center justify-between">
                      <div>
                        <div className="text-[9px] text-slate-400 uppercase font-mono">Authorized Value</div>
                        <div className="text-sm font-bold text-slate-900 font-mono">
                          {formatCurrency(activeRequest.amount)}
                        </div>
                      </div>
                      {activeRequest.discountPercent && (
                        <div className="text-right">
                          <div className="text-[9px] text-slate-400 uppercase font-mono">Discount</div>
                          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            {activeRequest.discountPercent}% OFF
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Justification quote */}
                    <div className="text-[10px] text-slate-600 bg-emerald-50/50 p-2 rounded border border-emerald-100 italic">
                      "{activeRequest.justification}"
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 font-mono">
                      <span>By: {activeRequest.requestedBy.name}</span>
                      <span>10:32 AM</span>
                    </div>
                  </div>

                  {/* Interactive WhatsApp Quick Action Buttons */}
                  <div className="space-y-1 max-w-[95%]">
                    {activeRequest.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleAction('approve', 'Approved via WhatsApp Quick Button')}
                          className="w-full bg-white hover:bg-emerald-50 active:bg-emerald-100 text-emerald-700 border border-emerald-300 font-bold py-2 rounded-lg text-xs shadow-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span>✅ APPROVE (Authorize Immediately)</span>
                        </button>

                        <div className="grid grid-cols-2 gap-1">
                          <button
                            onClick={() => handleAction('reject', 'Rejected via WhatsApp Quick Button')}
                            className="bg-white hover:bg-rose-50 active:bg-rose-100 text-rose-700 border border-rose-300 font-bold py-1.5 rounded-lg text-[11px] shadow-xs flex items-center justify-center space-x-1 transition cursor-pointer"
                          >
                            <XCircle className="h-3.5 w-3.5 text-rose-600" />
                            <span>❌ REJECT</span>
                          </button>

                          <button
                            onClick={() => handleAction('revise', 'Revision requested on pricing/delivery')}
                            className="bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-700 border border-slate-300 font-bold py-1.5 rounded-lg text-[11px] shadow-xs flex items-center justify-center space-x-1 transition cursor-pointer"
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
                            <span>💬 REQUEST INFO</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="bg-white border rounded-lg p-2.5 text-center text-xs font-mono">
                        <span className={`inline-flex items-center gap-1 font-bold ${
                          activeRequest.status === 'approved' ? 'text-emerald-700' :
                          activeRequest.status === 'rejected' ? 'text-rose-700' :
                          'text-slate-600'
                        }`}>
                          {activeRequest.status === 'approved' && <CheckCircle2 className="h-4 w-4" />}
                          {activeRequest.status === 'rejected' && <XCircle className="h-4 w-4" />}
                          STATUS: {activeRequest.status.toUpperCase()}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Executed by {activeRequest.actionTakenBy?.name || activeRequest.approverName}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Outgoing WhatsApp Confirmation Bubble */}
                  {simulatorReply && (
                    <div className="flex justify-end pt-2">
                      <div className="bg-[#DCF8C6] text-slate-900 rounded-lg p-2.5 shadow-sm max-w-[90%] text-[10px] space-y-1">
                        <div className="font-mono whitespace-pre-line leading-relaxed">
                          {simulatorReply}
                        </div>
                        <div className="flex items-center justify-end space-x-1 text-[9px] text-slate-500 font-mono">
                          <span>Just now</span>
                          <CheckCheck className="h-3 w-3 text-sky-600" />
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="text-center text-slate-500 text-xs py-12">
                  No approval request selected.
                </div>
              )}

            </div>

            {/* Bottom Phone Bar */}
            <div className="bg-slate-800 rounded-b-[20px] p-2 flex items-center justify-center">
              <div className="w-24 h-1 bg-slate-600 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* RIGHT: PENDING APPROVALS QUEUE & FILTER CONTROLS (7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Pending Approvals Queue</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Managers receive instant WhatsApp interactive cards; actions sync to ERP in real-time.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={refreshData}
                className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600 transition cursor-pointer"
                title="Refresh Queue"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => setNewModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold uppercase px-3 py-2 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Trigger New Approval</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-3xs flex flex-col md:flex-row gap-2 font-mono text-xs">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reference #, title, supplier/customer..."
                className="w-full bg-transparent focus:outline-none text-slate-800"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="border border-slate-200 rounded px-2 py-1 bg-white text-slate-700 text-xs focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value="purchase_order">Purchase Orders</option>
                <option value="quote">Commercial Quotes</option>
                <option value="discount">Special Discounts</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="border border-slate-200 rounded px-2 py-1 bg-white text-slate-700 text-xs focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Requests List */}
          <div className="space-y-3">
            {filteredRequests.map((req) => {
              const isSelected = req.id === activeRequest?.id;

              return (
                <div
                  key={req.id}
                  onClick={() => {
                    setSelectedRequestId(req.id);
                    setSimulatorReply(null);
                  }}
                  className={`bg-white border rounded-xl p-4 transition cursor-pointer shadow-3xs hover:border-emerald-400 ${
                    isSelected ? 'border-emerald-600 ring-2 ring-emerald-500/10 bg-emerald-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        req.requestType === 'purchase_order' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        req.requestType === 'quote' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {req.requestType.replace('_', ' ')}
                      </span>

                      <span className="font-mono font-bold text-slate-900 text-xs">
                        #{req.referenceId}
                      </span>

                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                        req.urgency === 'critical' ? 'text-rose-700 bg-rose-50' :
                        req.urgency === 'urgent' ? 'text-amber-700 bg-amber-50' :
                        'text-slate-600 bg-slate-100'
                      }`}>
                        {req.urgency}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        req.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        req.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {req.status}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-900">
                        {formatCurrency(req.amount)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5">
                    <h4 className="text-xs font-bold text-slate-900">{req.title}</h4>
                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                      {req.justification}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 font-mono gap-2">
                    <div className="flex items-center space-x-3">
                      <span>Entity: <strong className="text-slate-700">{req.entityName}</strong></span>
                      <span>Approver: <strong className="text-slate-700">{req.approverName}</strong></span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {req.status === 'pending' && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                          📱 Tap on phone screen to approve
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredRequests.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500">
                No approval requests found matching the selected filters.
              </div>
            )}
          </div>

        </div>

      </div>

      {/* 3. AUDIT LOG TABLE (Acceptance Criteria: Audit Log) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-3xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">WhatsApp Approval Audit Log</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable record of all management authorizations, timestamps, approver phones, and cryptographic hashes.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Search audit trail..."
                className="pl-8 pr-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none text-slate-700"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 border-b border-slate-200 font-mono text-[10px] text-slate-500 uppercase">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Document Ref</th>
                <th className="py-2.5 px-3">Approver & Role</th>
                <th className="py-2.5 px-3">Value</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Channel</th>
                <th className="py-2.5 px-3">Audit Hash</th>
                <th className="py-2.5 px-3">Comments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredAudits.map((aud) => (
                <tr key={aud.id} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                    {new Date(aud.timestamp).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                    #{aud.referenceId}
                    <div className="text-[10px] text-slate-400 font-normal uppercase">
                      {aud.requestType.replace('_', ' ')}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="font-bold text-slate-800">{aud.approverName}</div>
                    <div className="text-[10px] text-slate-500">{aud.approverPhone} • {aud.approverRole}</div>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                    {formatCurrency(aud.amount)}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                      aud.action === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      aud.action === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {aud.action === 'approved' && <Check className="h-3 w-3" />}
                      {aud.action === 'rejected' && <X className="h-3 w-3" />}
                      {aud.action.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-700">
                      {aud.channel === 'whatsapp_interactive_button' ? '📱 WA Button' : '💬 WA Command'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                    <button
                      onClick={() => copyToClipboard(aud.auditHash, 'Audit Hash')}
                      className="flex items-center gap-1 hover:text-slate-800 cursor-pointer"
                      title={aud.auditHash}
                    >
                      <span>{aud.auditHash.substring(0, 16)}...</span>
                      <Copy className="h-3 w-3 text-slate-400" />
                    </button>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={aud.comments}>
                    {aud.comments}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL: TRIGGER NEW APPROVAL REQUEST */}
      {newModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                  <Send className="h-4 w-4" />
                </span>
                <h4 className="text-sm font-bold text-slate-900">
                  Trigger WhatsApp Approval Request
                </h4>
              </div>
              <button
                onClick={() => setNewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                  Approval Request Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => {
                    const t = e.target.value as ApprovalRequestType;
                    setNewType(t);
                    setNewRef(t === 'purchase_order' ? `PO-2026-${Math.floor(1000 + Math.random() * 9000)}` :
                      t === 'quote' ? `QT-2026-${Math.floor(1000 + Math.random() * 9000)}` :
                      `DISC-2026-${Math.floor(10 + Math.random() * 90)}`);
                  }}
                  className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800 focus:outline-none"
                >
                  <option value="purchase_order">Purchase Order (PO)</option>
                  <option value="quote">Commercial Quotation</option>
                  <option value="discount">Special Pricing / Volume Discount</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    Document Ref #
                  </label>
                  <input
                    type="text"
                    value={newRef}
                    onChange={(e) => setNewRef(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800 font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    Urgency Level
                  </label>
                  <select
                    value={newUrgency}
                    onChange={(e) => setNewUrgency(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800 focus:outline-none"
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="critical">Critical (Immediate Shopfloor Need)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                  Title / Subject
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    Entity (Supplier / Customer)
                  </label>
                  <input
                    type="text"
                    value={newEntity}
                    onChange={(e) => setNewEntity(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    Authorized Amount (₹ INR)
                  </label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800 font-bold focus:outline-none"
                  />
                </div>
              </div>

              {newType !== 'purchase_order' && (
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    Discount Percentage (% If applicable)
                  </label>
                  <input
                    type="number"
                    value={newDiscount}
                    onChange={(e) => setNewDiscount(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800 focus:outline-none"
                    placeholder="e.g. 18"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    Designated Approver Name
                  </label>
                  <input
                    type="text"
                    value={newApproverName}
                    onChange={(e) => setNewApproverName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    Approver WhatsApp Phone
                  </label>
                  <input
                    type="text"
                    value={newApproverPhone}
                    onChange={(e) => setNewApproverPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                  Justification & Notes
                </label>
                <textarea
                  value={newJustification}
                  onChange={(e) => setNewJustification(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 font-mono text-xs">
              <button
                onClick={() => setNewModalOpen(false)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRequest}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center space-x-1.5 cursor-pointer shadow-3xs"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send WhatsApp Request</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default WhatsAppApprovalsTab;
