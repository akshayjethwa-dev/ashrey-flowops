// src/hooks/useWorkInstructions.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  WorkInstructionDocument,
  WorkInstructionStep,
  StepSignOffRecord,
  OfflineSyncStatus
} from '../types/workInstruction';
import { workInstructionService } from '../services/workInstructionService';

export function useWorkInstructions(workOrderNumber?: string, operationCodeOrName?: string) {
  const [instructions, setInstructions] = useState<WorkInstructionDocument[]>(() =>
    workInstructionService.getAllInstructions()
  );
  const [offlineStatus, setOfflineStatus] = useState<OfflineSyncStatus>(() =>
    workInstructionService.getOfflineSyncStatus()
  );
  const [selectedInstructionId, setSelectedInstructionId] = useState<string>(
    instructions[0]?.id || ''
  );
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  // Sync state with service listener
  useEffect(() => {
    const unsubscribe = workInstructionService.subscribe(() => {
      setInstructions(workInstructionService.getAllInstructions());
      setOfflineStatus(workInstructionService.getOfflineSyncStatus());
    });
    return unsubscribe;
  }, []);

  // Update selected instruction if props change
  useEffect(() => {
    if (operationCodeOrName) {
      const match = workInstructionService.getInstructionForOperation(operationCodeOrName);
      if (match) {
        setSelectedInstructionId(match.id);
        setActiveStepIndex(0);
      }
    }
  }, [operationCodeOrName]);

  const currentInstruction = useMemo(() => {
    return instructions.find(i => i.id === selectedInstructionId) || instructions[0] || null;
  }, [instructions, selectedInstructionId]);

  const currentStep = useMemo(() => {
    if (!currentInstruction || !currentInstruction.steps) return null;
    return currentInstruction.steps[activeStepIndex] || currentInstruction.steps[0] || null;
  }, [currentInstruction, activeStepIndex]);

  // Signoffs for current instruction / work order
  const signOffsForCurrent = useMemo(() => {
    if (!currentInstruction) return [];
    return workInstructionService.getSignOffsForOperation(
      workOrderNumber || 'WO-2026-0001',
      currentInstruction.routingOperationId || currentInstruction.operationCode
    );
  }, [currentInstruction, workOrderNumber, instructions]);

  const currentStepSignOff = useMemo(() => {
    if (!currentStep) return undefined;
    return signOffsForCurrent.find(s => s.stepId === currentStep.id);
  }, [signOffsForCurrent, currentStep]);

  // Check if step is accessible (all prior mandatory steps signed off)
  const isStepLocked = useCallback(
    (stepIndex: number): boolean => {
      if (stepIndex === 0) return false;
      if (!currentInstruction) return false;
      // All steps prior to stepIndex must have passed/override sign-offs
      for (let i = 0; i < stepIndex; i++) {
        const prevStep = currentInstruction.steps[i];
        if (prevStep.signOffRequired) {
          const so = signOffsForCurrent.find(s => s.stepId === prevStep.id);
          if (!so || (so.status !== 'passed' && so.status !== 'override_approved')) {
            return true;
          }
        }
      }
      return false;
    },
    [currentInstruction, signOffsForCurrent]
  );

  const completedStepsCount = useMemo(() => {
    if (!currentInstruction) return 0;
    return currentInstruction.steps.filter(st => {
      const so = signOffsForCurrent.find(s => s.stepId === st.id);
      return so && (so.status === 'passed' || so.status === 'override_approved');
    }).length;
  }, [currentInstruction, signOffsForCurrent]);

  const totalStepsCount = currentInstruction?.steps.length || 0;
  const progressPercent = totalStepsCount > 0 ? Math.round((completedStepsCount / totalStepsCount) * 100) : 0;

  return {
    instructions,
    currentInstruction,
    selectedInstructionId,
    setSelectedInstructionId,
    activeStepIndex,
    setActiveStepIndex,
    currentStep,
    currentStepSignOff,
    signOffsForCurrent,
    isStepLocked,
    completedStepsCount,
    totalStepsCount,
    progressPercent,
    offlineStatus,
    syncOfflineQueue: workInstructionService.syncOfflineQueue.bind(workInstructionService),
    setSimulatedOffline: workInstructionService.setSimulatedOffline.bind(workInstructionService),
    precacheWorkOrder: workInstructionService.cacheWorkOrderForOffline.bind(workInstructionService)
  };
}
