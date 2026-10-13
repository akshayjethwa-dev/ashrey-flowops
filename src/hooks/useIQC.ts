// src/hooks/useIQC.ts

import { useState, useEffect, useCallback } from 'react';
import {
  IqcOrder,
  InspectionPlan,
  IqcFilterOptions,
  IqcKpis,
  SampleMeasurement,
  DefectPhoto,
  IqcDispositionDetails
} from '../types/iqc';
import { iqcService } from '../services/iqcService';

export const useIQC = () => {
  const [orders, setOrders] = useState<IqcOrder[]>([]);
  const [plans, setPlans] = useState<InspectionPlan[]>([]);
  const [kpis, setKpis] = useState<IqcKpis>({
    totalOrders: 0,
    pendingInspection: 0,
    inProgress: 0,
    dispositionedLots: 0,
    acceptedLots: 0,
    rejectedLots: 0,
    reworkLots: 0,
    acceptanceRatePct: 100,
    avgInspectionMinutes: 30,
    activePlansCount: 0,
    quarantinedRtvCount: 0
  });

  const [filter, setFilter] = useState<IqcFilterOptions>({
    status: 'all',
    disposition: 'all',
    searchQuery: '',
    dateRange: 'all'
  });

  const [selectedOrder, setSelectedOrder] = useState<IqcOrder | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<InspectionPlan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load orders and plans
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [fetchedOrders, fetchedPlans] = await Promise.all([
        iqcService.getOrders(filter),
        iqcService.getPlans()
      ]);
      setOrders(fetchedOrders);
      setPlans(fetchedPlans);
      setKpis(iqcService.calculateKpis());

      // If selectedOrder is set, keep it refreshed
      if (selectedOrder) {
        const updated = fetchedOrders.find(o => o.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
    } catch (err) {
      console.error('useIQC: Error loading data', err);
    } finally {
      setLoading(false);
    }
  }, [filter, selectedOrder?.id]);

  useEffect(() => {
    loadData();
  }, [filter]);

  // Save measurements for parameter
  const saveMeasurements = async (
    orderId: string,
    parameterId: string,
    samples: SampleMeasurement[]
  ) => {
    try {
      const updatedOrder = await iqcService.saveMeasurements(orderId, parameterId, samples);
      setOrders(prev => prev.map(o => (o.id === orderId ? updatedOrder : o)));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(updatedOrder);
      }
      setKpis(iqcService.calculateKpis());
      return updatedOrder;
    } catch (err) {
      console.error('Error saving measurements', err);
      throw err;
    }
  };

  // Add Defect Photo
  const addDefectPhoto = async (
    orderId: string,
    photoData: Omit<DefectPhoto, 'id' | 'timestamp'>
  ) => {
    try {
      const updatedOrder = await iqcService.addDefectPhoto(orderId, photoData);
      setOrders(prev => prev.map(o => (o.id === orderId ? updatedOrder : o)));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(updatedOrder);
      }
      return updatedOrder;
    } catch (err) {
      console.error('Error adding defect photo', err);
      throw err;
    }
  };

  // Delete Defect Photo
  const deleteDefectPhoto = async (orderId: string, photoId: string) => {
    try {
      const updatedOrder = await iqcService.deleteDefectPhoto(orderId, photoId);
      setOrders(prev => prev.map(o => (o.id === orderId ? updatedOrder : o)));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(updatedOrder);
      }
      return updatedOrder;
    } catch (err) {
      console.error('Error deleting defect photo', err);
      throw err;
    }
  };

  // Apply Disposition
  const applyDisposition = async (
    orderId: string,
    dispositionData: IqcDispositionDetails
  ) => {
    try {
      const updatedOrder = await iqcService.applyDisposition(orderId, dispositionData);
      setOrders(prev => prev.map(o => (o.id === orderId ? updatedOrder : o)));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(updatedOrder);
      }
      setKpis(iqcService.calculateKpis());
      return updatedOrder;
    } catch (err) {
      console.error('Error applying disposition', err);
      throw err;
    }
  };

  // Auto-generate from PO Receipt
  const autoGenerateFromReceipt = async (params: {
    poNumber: string;
    grnNumber?: string;
    supplierId: string;
    supplierName: string;
    partSku: string;
    partName: string;
    category?: string;
    receivedQty: number;
    unit?: string;
    heatLotNumber: string;
    mtrNumber?: string;
    inspectorName?: string;
  }) => {
    try {
      const newOrder = await iqcService.autoGenerateFromPoReceipt(params);
      setOrders(prev => [newOrder, ...prev]);
      setKpis(iqcService.calculateKpis());
      return newOrder;
    } catch (err) {
      console.error('Error auto-generating IQC Order', err);
      throw err;
    }
  };

  // Create plan
  const createPlan = async (plan: Omit<InspectionPlan, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const created = await iqcService.createPlan(plan);
      setPlans(prev => [created, ...prev]);
      setKpis(iqcService.calculateKpis());
      return created;
    } catch (err) {
      console.error('Error creating plan', err);
      throw err;
    }
  };

  // Update plan
  const updatePlan = async (id: string, updates: Partial<InspectionPlan>) => {
    try {
      const updated = await iqcService.updatePlan(id, updates);
      setPlans(prev => prev.map(p => (p.id === id ? updated : p)));
      return updated;
    } catch (err) {
      console.error('Error updating plan', err);
      throw err;
    }
  };

  // Download CSV
  const exportCsv = () => {
    const csv = iqcService.exportCsv(filter);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `IQC_Inspection_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    orders,
    plans,
    kpis,
    filter,
    setFilter,
    selectedOrder,
    setSelectedOrder,
    selectedPlan,
    setSelectedPlan,
    loading,
    refresh: loadData,
    saveMeasurements,
    addDefectPhoto,
    deleteDefectPhoto,
    applyDisposition,
    autoGenerateFromReceipt,
    createPlan,
    updatePlan,
    exportCsv
  };
};
