// src/hooks/usePurchaseOrders.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import {
  PurchaseOrder,
  PurchaseOrderStatus,
  PoAutomationRule,
  SupplierAckStatus
} from '../types/purchaseOrder';
import { purchaseOrderService } from '../services/purchaseOrderService';

export interface PoFilterState {
  status: 'all' | PurchaseOrderStatus;
  plantId: string;
  searchQuery: string;
}

export function usePurchaseOrders(initialPlantId: string = 'all') {
  const { tenant, profile } = useAuth();
  const tenantId = tenant?.id;

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [automationRule, setAutomationRule] = useState<PoAutomationRule | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<PoFilterState>({
    status: 'all',
    plantId: initialPlantId,
    searchQuery: ''
  });

  const loadData = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [list, rule] = await Promise.all([
        purchaseOrderService.getPurchaseOrders(tenantId),
        purchaseOrderService.getAutomationRules(tenantId)
      ]);
      setOrders(list);
      setAutomationRule(rule);
    } catch (err: any) {
      console.error('Failed to load purchase orders', err);
      setError(err.message || 'Failed to load purchase orders.');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('flowops:po_updated', handleUpdate);
    window.addEventListener('flowops:inventory_updated', handleUpdate);
    window.addEventListener('flowops:multilocation_updated', handleUpdate);

    return () => {
      window.removeEventListener('flowops:po_updated', handleUpdate);
      window.removeEventListener('flowops:inventory_updated', handleUpdate);
      window.removeEventListener('flowops:multilocation_updated', handleUpdate);
    };
  }, [loadData]);

  // Run Reorder Level Sweep
  const runReorderSweep = async (plantId?: string) => {
    if (!tenantId) throw new Error('Tenant context missing');
    try {
      setSubmitting(true);
      setError(null);
      const res = await purchaseOrderService.checkAndGenerateReorderPOs(tenantId, {
        plantId: plantId || filters.plantId,
        operatorId: profile?.uid || 'usr-procurement',
        operatorName: profile?.name || 'Procurement Manager'
      });
      await loadData();
      return res;
    } catch (err: any) {
      setError(err.message || 'Reorder sweep failed');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  // Approve PO
  const approvePo = async (poId: string, comments?: string) => {
    if (!tenantId) throw new Error('Tenant context missing');
    try {
      setSubmitting(true);
      setError(null);
      const res = await purchaseOrderService.approvePurchaseOrder(
        tenantId,
        poId,
        {
          uid: profile?.uid,
          name: profile?.name || 'Procurement Approver',
          role: profile?.role || 'Manager'
        },
        comments
      );
      await loadData();
      return res;
    } catch (err: any) {
      setError(err.message || 'PO approval failed');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  // Reject PO
  const rejectPo = async (poId: string, reason: string) => {
    if (!tenantId) throw new Error('Tenant context missing');
    try {
      setSubmitting(true);
      setError(null);
      const res = await purchaseOrderService.rejectPurchaseOrder(
        tenantId,
        poId,
        {
          uid: profile?.uid,
          name: profile?.name || 'Procurement Approver',
          role: profile?.role || 'Manager'
        },
        reason
      );
      await loadData();
      return res;
    } catch (err: any) {
      setError(err.message || 'PO rejection failed');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  // Issue PO to Supplier
  const issuePo = async (poId: string, channel: 'whatsapp' | 'email' | 'both' = 'whatsapp') => {
    if (!tenantId) throw new Error('Tenant context missing');
    try {
      setSubmitting(true);
      setError(null);
      const res = await purchaseOrderService.issuePoToSupplier(tenantId, poId, channel);
      await loadData();
      return res;
    } catch (err: any) {
      setError(err.message || 'PO issue failed');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  // Record Supplier Acknowledgment
  const recordAcknowledgment = async (
    poId: string,
    params: {
      status: SupplierAckStatus;
      confirmedDeliveryDate: string;
      vendorConfirmationRef?: string;
      acknowledgedByName?: string;
      notes?: string;
    }
  ) => {
    if (!tenantId) throw new Error('Tenant context missing');
    try {
      setSubmitting(true);
      setError(null);
      const res = await purchaseOrderService.recordSupplierAcknowledgment(tenantId, poId, params);
      await loadData();
      return res;
    } catch (err: any) {
      setError(err.message || 'Recording acknowledgment failed');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  // Record Supplier Dispatch
  const recordDispatch = async (
    poId: string,
    params: {
      trackingCarrier: string;
      lorryReceiptNumber: string;
      dispatchDate: string;
      expectedDeliveryDate?: string;
      notes?: string;
    }
  ) => {
    if (!tenantId) throw new Error('Tenant context missing');
    try {
      setSubmitting(true);
      setError(null);
      const res = await purchaseOrderService.recordSupplierDispatch(tenantId, poId, params);
      await loadData();
      return res;
    } catch (err: any) {
      setError(err.message || 'Recording dispatch failed');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  // Save Automation Rules
  const saveAutomationRule = async (rule: PoAutomationRule) => {
    if (!tenantId) return;
    try {
      setSubmitting(true);
      await purchaseOrderService.saveAutomationRules(tenantId, rule);
      setAutomationRule(rule);
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (filters.status !== 'all' && o.status !== filters.status) return false;
      if (filters.plantId !== 'all' && o.plantId !== filters.plantId) return false;
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchPo = o.poNumber.toLowerCase().includes(q);
        const matchSup = o.supplierName.toLowerCase().includes(q);
        const matchItem = o.items.some(
          i => i.stockItemCode.toLowerCase().includes(q) || i.stockItemName.toLowerCase().includes(q)
        );
        const matchLr = o.supplierAck.lorryReceiptNumber?.toLowerCase().includes(q);
        if (!matchPo && !matchSup && !matchItem && !matchLr) return false;
      }
      return true;
    });
  }, [orders, filters]);

  // KPIs
  const kpis = useMemo(() => {
    const openOrders = orders.filter(o => !['received', 'cancelled', 'rejected'].includes(o.status));
    const totalSpend = openOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const pendingApproval = orders.filter(o => o.status === 'pending_approval').length;
    const awaitingAck = orders.filter(o => o.status === 'issued' && o.supplierAck.status === 'pending').length;
    const inTransit = orders.filter(o => o.status === 'in_transit').length;

    const todayMs = new Date().setHours(0, 0, 0, 0);
    const overdueCount = openOrders.filter(o => {
      const expMs = new Date(o.expectedDeliveryDate).getTime();
      return expMs < todayMs;
    }).length;

    return {
      totalOpenSpend: totalSpend,
      openOrdersCount: openOrders.length,
      pendingApprovalCount: pendingApproval,
      awaitingAckCount: awaitingAck,
      inTransitCount: inTransit,
      overdueCount
    };
  }, [orders]);

  return {
    orders: filteredOrders,
    allOrders: orders,
    automationRule,
    loading,
    submitting,
    error,
    filters,
    setFilters,
    kpis,
    refresh: loadData,
    runReorderSweep,
    approvePo,
    rejectPo,
    issuePo,
    recordAcknowledgment,
    recordDispatch,
    saveAutomationRule
  };
}
