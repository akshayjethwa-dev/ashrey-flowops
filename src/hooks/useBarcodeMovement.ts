// src/hooks/useBarcodeMovement.ts

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  ScanMovementLog,
  ScanToReceiveParams,
  ScanToIssueParams,
  ScanToReturnParams,
  BarcodeMovementType
} from '../types/barcodeMovement';
import { barcodeMovementService } from '../services/barcodeMovementService';

export function useBarcodeMovement() {
  const { tenant, profile } = useAuth();
  const tenantId = tenant?.id;

  const [logs, setLogs] = useState<ScanMovementLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const list = await barcodeMovementService.getMovementLogs(tenantId);
      setLogs(list);
    } catch (err: any) {
      console.error('Failed to load barcode movement logs', err);
      setError(err.message || 'Failed to load movement logs');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadLogs();

    const handleUpdate = () => {
      loadLogs();
    };

    window.addEventListener('flowops:multilocation_updated', handleUpdate);
    window.addEventListener('flowops:inventory_updated', handleUpdate);

    return () => {
      window.removeEventListener('flowops:multilocation_updated', handleUpdate);
      window.removeEventListener('flowops:inventory_updated', handleUpdate);
    };
  }, [loadLogs]);

  // Sound feedback utility (subtle pleasant web-audio chime for warehouse scanners)
  const playScanBeep = (type: 'success' | 'warning' | 'error' = 'success') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.08); // D6
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.22);
      } else if (type === 'warning') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      }

      if (navigator.vibrate) {
        navigator.vibrate(type === 'success' ? [40, 30, 60] : 120);
      }
    } catch {}
  };

  // 1. Scan to Receive
  const receiveMaterial = async (
    params: Omit<ScanToReceiveParams, 'operatorId' | 'operatorName'>
  ) => {
    if (!tenantId) throw new Error('Tenant context missing');
    try {
      setSubmitting(true);
      setError(null);
      const res = await barcodeMovementService.executeScanToReceive(tenantId, {
        ...params,
        operatorId: profile?.uid || 'usr-store',
        operatorName: profile?.name || profile?.email || 'Store Keeper'
      });
      playScanBeep('success');
      await loadLogs();
      return res;
    } catch (err: any) {
      playScanBeep('error');
      setError(err.message || 'Scan to receive failed');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Scan to Issue
  const issueMaterial = async (
    params: Omit<ScanToIssueParams, 'operatorId' | 'operatorName'>
  ) => {
    if (!tenantId) throw new Error('Tenant context missing');
    try {
      setSubmitting(true);
      setError(null);
      const res = await barcodeMovementService.executeScanToIssue(tenantId, {
        ...params,
        operatorId: profile?.uid || 'usr-store',
        operatorName: profile?.name || profile?.email || 'Store Keeper'
      });
      playScanBeep('success');
      await loadLogs();
      return res;
    } catch (err: any) {
      playScanBeep('error');
      setError(err.message || 'Scan to issue failed');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Scan to Return
  const returnMaterial = async (
    params: Omit<ScanToReturnParams, 'operatorId' | 'operatorName'>
  ) => {
    if (!tenantId) throw new Error('Tenant context missing');
    try {
      setSubmitting(true);
      setError(null);
      const res = await barcodeMovementService.executeScanToReturn(tenantId, {
        ...params,
        operatorId: profile?.uid || 'usr-store',
        operatorName: profile?.name || profile?.email || 'Store Keeper'
      });
      playScanBeep('success');
      await loadLogs();
      return res;
    } catch (err: any) {
      playScanBeep('error');
      setError(err.message || 'Scan to return failed');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    logs,
    loading,
    submitting,
    error,
    refresh: loadLogs,
    receiveMaterial,
    issueMaterial,
    returnMaterial,
    playScanBeep
  };
}
