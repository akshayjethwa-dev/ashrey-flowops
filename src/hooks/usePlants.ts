// src/hooks/usePlants.ts

import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  writeBatch
} from 'firebase/firestore';
import { Plant, ProductionStageConfig } from '../types';
import { handleFirestoreError, OperationType } from '../firebaseErrors';
import { useAuth } from './useAuth';

const DEFAULT_PUNE_STAGES: ProductionStageConfig[] = [
  { id: 'pune_material_cutting', name: 'Material Cutting', color: 'indigo', isFinalStage: false, order: 0 },
  { id: 'pune_heating_welding', name: 'Pre-Heating & Welding', color: 'blue', isFinalStage: false, order: 1 },
  { id: 'pune_cnc_machining', name: 'Precision CNC Machining', color: 'amber', isFinalStage: false, order: 2 },
  { id: 'pune_assembly', name: 'Shopfloor Assembly', color: 'purple', isFinalStage: false, order: 3 },
  { id: 'pune_quality_check', name: 'NDT & Quality Check', color: 'pink', isFinalStage: false, order: 4 },
  { id: 'pune_ready_dispatch', name: 'Ready for Dispatch', color: 'green', isFinalStage: true, order: 5 }
];

const DEFAULT_VADODARA_STAGES: ProductionStageConfig[] = [
  { id: 'vadodara_raw_material', name: 'Raw Material Intake', color: 'indigo', isFinalStage: false, order: 0 },
  { id: 'vadodara_casting', name: 'Casting & Molding', color: 'blue', isFinalStage: false, order: 1 },
  { id: 'vadodara_fettling', name: 'Fettling & Grinding', color: 'amber', isFinalStage: false, order: 2 },
  { id: 'vadodara_heat_treatment', name: 'Heat Treatment', color: 'purple', isFinalStage: false, order: 3 },
  { id: 'vadodara_ndt_testing', name: 'NDT Testing', color: 'pink', isFinalStage: false, order: 4 },
  { id: 'vadodara_packaging_ready', name: 'Packaging & Ready', color: 'green', isFinalStage: true, order: 5 }
];

export const usePlants = (tenantId: string | undefined) => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const isSandbox = localStorage.getItem('isSandboxMode') === 'true' || !db;

    if (isSandbox) {
      try {
        const cached = localStorage.getItem(`flowops_plants_${tenantId}`);
        if (cached) {
          setPlants(JSON.parse(cached));
        } else {
          // Seed two beautiful plants
          const initialPlants: Plant[] = [
            {
              id: 'plant-pune',
              tenantId,
              name: 'Pune Heavy Forge Facility',
              location: 'Plot 104, MIDC Phase II, Chikhli, Pune, MH',
              gstin: '27AAACB1234F1Z1',
              processStages: DEFAULT_PUNE_STAGES,
              createdAt: new Date().toISOString()
            },
            {
              id: 'plant-vadodara',
              tenantId,
              name: 'Vadodara Foundry Plant',
              location: 'Plot 42, GIDC Industrial Estate, Sector 3, Vadodara, Gujarat',
              gstin: '24AAACB1234F1Z2',
              processStages: DEFAULT_VADODARA_STAGES,
              createdAt: new Date().toISOString()
            }
          ];
          localStorage.setItem(`flowops_plants_${tenantId}`, JSON.stringify(initialPlants));
          setPlants(initialPlants);
        }
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Error processing sandbox plants');
        setLoading(false);
      }
    } else {
      const colRef = collection(db, 'tenants', tenantId, 'plants');

      const unsubscribe = onSnapshot(colRef, async (snap) => {
        let list: Plant[] = [];
        snap.forEach(d => {
          list.push({ id: d.id, ...d.data() } as Plant);
        });

        if (list.length === 0) {
          // Auto-seed default plants in Firestore
          try {
            const batch = writeBatch(db);
            const initialPlants: Plant[] = [
              {
                id: 'plant-pune',
                tenantId,
                name: 'Pune Heavy Forge Facility',
                location: 'Plot 104, MIDC Phase II, Chikhli, Pune, MH',
                gstin: '27AAACB1234F1Z1',
                processStages: DEFAULT_PUNE_STAGES,
                createdAt: new Date().toISOString()
              },
              {
                id: 'plant-vadodara',
                tenantId,
                name: 'Vadodara Foundry Plant',
                location: 'Plot 42, GIDC Industrial Estate, Sector 3, Vadodara, Gujarat',
                gstin: '24AAACB1234F1Z2',
                processStages: DEFAULT_VADODARA_STAGES,
                createdAt: new Date().toISOString()
              }
            ];

            initialPlants.forEach(p => {
              const dRef = doc(db, 'tenants', tenantId, 'plants', p.id);
              batch.set(dRef, {
                tenantId: p.tenantId,
                name: p.name,
                location: p.location,
                gstin: p.gstin || '',
                processStages: p.processStages,
                createdAt: p.createdAt
              });
            });

            await batch.commit();
            list = initialPlants;
          } catch (err) {
            console.error('Error seeding default plants in Firestore', err);
          }
        }

        // Sort by name
        list.sort((a, b) => a.name.localeCompare(b.name));
        setPlants(list);
        setLoading(false);
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, `tenants/${tenantId}/plants`);
        setLoading(false);
      });

      return unsubscribe;
    }
  }, [tenantId]);

  const addPlant = useCallback(async (name: string, location: string, gstin: string = '', stages: ProductionStageConfig[] = DEFAULT_PUNE_STAGES) => {
    if (!tenantId) return false;
    if (!isAdmin) {
      throw new Error('Only administrator profile owners can establish new plants.');
    }

    const isSandbox = localStorage.getItem('isSandboxMode') === 'true' || !db;
    const plantId = 'plant-' + name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');

    const newPlant: Plant = {
      id: plantId,
      tenantId,
      name: name.trim(),
      location: location.trim(),
      gstin: gstin.trim(),
      processStages: stages.map((s, idx) => ({ ...s, order: idx })),
      createdAt: new Date().toISOString()
    };

    if (plants.some(p => p.id === plantId)) {
      throw new Error('A plant with an identical code or name already operates under this company.');
    }

    if (isSandbox) {
      const updated = [...plants, newPlant];
      localStorage.setItem(`flowops_plants_${tenantId}`, JSON.stringify(updated));
      setPlants(updated);
      return true;
    } else {
      try {
        const docRef = doc(db, 'tenants', tenantId, 'plants', plantId);
        await setDoc(docRef, {
          tenantId: newPlant.tenantId,
          name: newPlant.name,
          location: newPlant.location,
          gstin: newPlant.gstin || '',
          processStages: newPlant.processStages,
          createdAt: newPlant.createdAt
        });
        return true;
      } catch (err: any) {
        handleFirestoreError(err, OperationType.WRITE, `tenants/${tenantId}/plants/${plantId}`);
        return false;
      }
    }
  }, [tenantId, plants, isAdmin]);

  const updatePlant = useCallback(async (plantId: string, updates: Partial<Omit<Plant, 'id' | 'tenantId' | 'createdAt'>>) => {
    if (!tenantId) return false;
    if (!isAdmin) {
      throw new Error('Only administrator profile owners can alter plant configurations.');
    }

    const isSandbox = localStorage.getItem('isSandboxMode') === 'true' || !db;

    if (isSandbox) {
      const updated = plants.map(p => {
        if (p.id === plantId) {
          return { ...p, ...updates };
        }
        return p;
      });
      localStorage.setItem(`flowops_plants_${tenantId}`, JSON.stringify(updated));
      setPlants(updated);
      return true;
    } else {
      try {
        const docRef = doc(db, 'tenants', tenantId, 'plants', plantId);
        await setDoc(docRef, updates, { merge: true });
        return true;
      } catch (err: any) {
        handleFirestoreError(err, OperationType.WRITE, `tenants/${tenantId}/plants/${plantId}`);
        return false;
      }
    }
  }, [tenantId, plants, isAdmin]);

  const deletePlant = useCallback(async (plantId: string) => {
    if (!tenantId) return false;
    if (!isAdmin) {
      throw new Error('Only administrator profile owners can decommission plants.');
    }

    const isSandbox = localStorage.getItem('isSandboxMode') === 'true' || !db;

    if (isSandbox) {
      const updated = plants.filter(p => p.id !== plantId);
      localStorage.setItem(`flowops_plants_${tenantId}`, JSON.stringify(updated));
      setPlants(updated);
      return true;
    } else {
      try {
        const docRef = doc(db, 'tenants', tenantId, 'plants', plantId);
        await deleteDoc(docRef);
        return true;
      } catch (err: any) {
        handleFirestoreError(err, OperationType.WRITE, `tenants/${tenantId}/plants/${plantId}`);
        return false;
      }
    }
  }, [tenantId, plants, isAdmin]);

  return {
    plants,
    loading,
    error,
    addPlant,
    updatePlant,
    deletePlant,
    isAdmin
  };
};