// src/hooks/useSPC.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  SpcStudy,
  ControlLimits,
  ProcessCapabilityIndices,
  HistogramDistribution,
  SpcOocAlert,
  SpcKpiSummary,
  SubgroupSample
} from '../types/spc';
import { spcService } from '../services/spcService';

export function useSPC(initialStudyId?: string) {
  const [studies, setStudies] = useState<SpcStudy[]>([]);
  const [selectedStudyId, setSelectedStudyId] = useState<string>(initialStudyId || 'spc-study-001');
  const [alerts, setAlerts] = useState<SpcOocAlert[]>([]);
  const [kpis, setKpis] = useState<SpcKpiSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [subgroupWindow, setSubgroupWindow] = useState<'all' | 'last_20' | 'last_30'>('all');
  const [showZones, setShowZones] = useState<boolean>(true);

  // Load all data
  const refresh = useCallback(() => {
    try {
      const allStudies = spcService.getStudies();
      setStudies(allStudies);
      if (allStudies.length > 0 && !allStudies.find(s => s.id === selectedStudyId)) {
        setSelectedStudyId(allStudies[0].id);
      }
      setAlerts(spcService.getAlerts());
      setKpis(spcService.getKpiSummary());
    } catch (err) {
      console.error('Error loading SPC data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedStudyId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Active study details
  const activeStudyData = useMemo(() => {
    if (!selectedStudyId) return null;
    return spcService.getStudyById(selectedStudyId);
  }, [selectedStudyId, studies]);

  // Windowed subgroups for chart rendering
  const windowedSubgroups = useMemo(() => {
    if (!activeStudyData?.study.subgroups) return [];
    const all = activeStudyData.study.subgroups;
    if (subgroupWindow === 'last_20') return all.slice(-20);
    if (subgroupWindow === 'last_30') return all.slice(-30);
    return all;
  }, [activeStudyData, subgroupWindow]);

  // Add new subgroup measurement
  const addSubgroup = useCallback((subgroupData: Omit<SubgroupSample, 'id' | 'violations' | 'mean' | 'range' | 'stdDev'>) => {
    if (!selectedStudyId) return;
    const { updatedStudy, newAlerts } = spcService.addSubgroup(selectedStudyId, subgroupData);
    refresh();
    return { updatedStudy, newAlerts };
  }, [selectedStudyId, refresh]);

  // Live Simulation Trigger
  const simulateDrift = useCallback((driftOption: 'normal' | 'upward_drift' | 'downward_drift' | 'outlier') => {
    if (!selectedStudyId) return;
    const res = spcService.simulateNextSubgroup(selectedStudyId, driftOption);
    refresh();
    return res;
  }, [selectedStudyId, refresh]);

  // Save / Update Study configuration
  const saveStudy = useCallback((study: SpcStudy) => {
    const updated = spcService.saveStudy(study);
    refresh();
    return updated;
  }, [refresh]);

  // Acknowledge alert & log CAPA
  const acknowledgeAlert = useCallback((
    alertId: string,
    acknowledgedBy: string,
    rootCause?: string,
    correctiveAction?: string
  ) => {
    const res = spcService.acknowledgeAlert(alertId, acknowledgedBy, rootCause, correctiveAction);
    refresh();
    return res;
  }, [refresh]);

  // Export CSV
  const exportCsv = useCallback(() => {
    if (!selectedStudyId) return;
    const csvContent = spcService.exportStudyCsv(selectedStudyId);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SPC_Report_${selectedStudyId}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [selectedStudyId]);

  return {
    studies,
    selectedStudyId,
    setSelectedStudyId,
    activeStudyData,
    windowedSubgroups,
    subgroupWindow,
    setSubgroupWindow,
    showZones,
    setShowZones,
    alerts,
    kpis,
    loading,
    refresh,
    addSubgroup,
    simulateDrift,
    saveStudy,
    acknowledgeAlert,
    exportCsv
  };
}
