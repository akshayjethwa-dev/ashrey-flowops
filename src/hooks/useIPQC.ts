// src/hooks/useIPQC.ts

import { useState, useEffect, useCallback } from 'react';
import {
  QualityControlPointConfig,
  IpqcTask,
  IpqcFilterOptions,
  IpqcKpis,
  IpqcTaskSampleReading,
  IpqcPartPhoto
} from '../types/ipqc';
import { ipqcService } from '../services/ipqcService';

export const useIPQC = () => {
  const [tasks, setTasks] = useState<IpqcTask[]>([]);
  const [configs, setConfigs] = useState<QualityControlPointConfig[]>([]);
  const [kpis, setKpis] = useState<IpqcKpis>({
    totalTasks: 0,
    pendingInspection: 0,
    inProgress: 0,
    passedTasks: 0,
    failedHoldTasks: 0,
    passRatePct: 100,
    activeQcpPoints: 0,
    avgResolutionMinutes: 15
  });

  const [filter, setFilter] = useState<IpqcFilterOptions>({
    status: 'all',
    triggerType: 'all',
    searchQuery: ''
  });

  const [selectedTask, setSelectedTask] = useState<IpqcTask | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<QualityControlPointConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [fetchedTasks, fetchedConfigs] = await Promise.all([
        ipqcService.getTasks(filter),
        ipqcService.getConfigs()
      ]);
      setTasks(fetchedTasks);
      setConfigs(fetchedConfigs);
      setKpis(ipqcService.calculateKpis());

      if (selectedTask) {
        const updated = fetchedTasks.find(t => t.id === selectedTask.id);
        if (updated) setSelectedTask(updated);
      }
    } catch (e) {
      console.error('useIPQC: Error loading data', e);
    } finally {
      setLoading(false);
    }
  }, [filter, selectedTask?.id]);

  useEffect(() => {
    loadData();
  }, [filter]);

  const saveMeasurement = async (
    taskId: string,
    parameterId: string,
    samples: IpqcTaskSampleReading[]
  ) => {
    try {
      const updated = await ipqcService.saveMeasurement(taskId, parameterId, samples);
      setTasks(prev => prev.map(t => (t.id === taskId ? updated : t)));
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(updated);
      }
      setKpis(ipqcService.calculateKpis());
      return updated;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const attachPhoto = async (
    taskId: string,
    photoData: Omit<IpqcPartPhoto, 'id' | 'timestamp'>
  ) => {
    try {
      const updated = await ipqcService.attachPartPhoto(taskId, photoData);
      setTasks(prev => prev.map(t => (t.id === taskId ? updated : t)));
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(updated);
      }
      return updated;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const deletePhoto = async (taskId: string, photoId: string) => {
    try {
      const updated = await ipqcService.deletePartPhoto(taskId, photoId);
      setTasks(prev => prev.map(t => (t.id === taskId ? updated : t)));
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(updated);
      }
      return updated;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const signOffTask = async (
    taskId: string,
    data: {
      result: 'pass' | 'hold' | 'fail';
      inspectorName: string;
      badgeId: string;
      notes?: string;
      holdReason?: string;
    }
  ) => {
    try {
      const updated = await ipqcService.signOffTask(taskId, data);
      setTasks(prev => prev.map(t => (t.id === taskId ? updated : t)));
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(updated);
      }
      setKpis(ipqcService.calculateKpis());
      return updated;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const autoGenerateTask = async (params: any) => {
    try {
      const created = await ipqcService.autoGenerateTask(params);
      setTasks(prev => [created, ...prev]);
      setKpis(ipqcService.calculateKpis());
      return created;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const saveQcpConfig = async (configData: any) => {
    try {
      const saved = await ipqcService.saveConfig(configData);
      setConfigs(prev => {
        const idx = prev.findIndex(c => c.id === saved.id);
        if (idx !== -1) {
          const cp = [...prev];
          cp[idx] = saved;
          return cp;
        }
        return [saved, ...prev];
      });
      setKpis(ipqcService.calculateKpis());
      return saved;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const exportCsv = () => {
    const csv = ipqcService.exportCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `IPQC_InProcess_Quality_Log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    tasks,
    configs,
    kpis,
    filter,
    setFilter,
    selectedTask,
    setSelectedTask,
    selectedConfig,
    setSelectedConfig,
    loading,
    refresh: loadData,
    saveMeasurement,
    attachPhoto,
    deletePhoto,
    signOffTask,
    autoGenerateTask,
    saveQcpConfig,
    exportCsv
  };
};
