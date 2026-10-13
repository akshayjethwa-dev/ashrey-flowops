// src/services/mrpService.ts

import { db } from '../firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import {
  MrpHorizon,
  MrpRunMode,
  MrpPurchaseRecommendation,
  MrpRunRecord,
  MrpScheduleConfig,
  SafetyStockRule,
  MrpGrossDemandItem,
  MrpRecommendationUrgency
} from '../types/mrp';
import { multiLocationInventoryService } from './multiLocationInventoryService';
import { purchaseOrderService } from './purchaseOrderService';
import { StockInboundOrder, BinStockRecord } from '../types/inventoryLocation';

export const DEFAULT_SAFETY_STOCK_RULES: SafetyStockRule[] = [
  {
    id: 'rule-wr-1002',
    stockItemId: 'stock-1',
    ruleType: 'fixed_units',
    fixedBufferQty: 6.0,
    bufferDays: 7,
    minOrderQty: 4.0,
    orderMultiple: 1.0,
    shrinkageAllowancePct: 2.0,
    inspectionBufferDays: 1
  },
  {
    id: 'rule-rb-40cs',
    stockItemId: 'stock-6',
    ruleType: 'fixed_units',
    fixedBufferQty: 3.0,
    bufferDays: 5,
    minOrderQty: 2.0,
    orderMultiple: 0.5,
    shrinkageAllowancePct: 3.0,
    inspectionBufferDays: 1
  },
  {
    id: 'rule-ds-h13',
    stockItemId: 'stock-7',
    ruleType: 'fixed_units',
    fixedBufferQty: 1.2,
    bufferDays: 14,
    minOrderQty: 0.5,
    orderMultiple: 0.2,
    shrinkageAllowancePct: 1.0,
    inspectionBufferDays: 2
  },
  {
    id: 'rule-oil-hyd68',
    stockItemId: 'stock-2',
    ruleType: 'fixed_units',
    fixedBufferQty: 400,
    bufferDays: 4,
    minOrderQty: 200,
    orderMultiple: 200,
    shrinkageAllowancePct: 0.5,
    inspectionBufferDays: 1
  },
  {
    id: 'rule-fast-m12',
    stockItemId: 'stock-3',
    ruleType: 'fixed_units',
    fixedBufferQty: 2000,
    bufferDays: 5,
    minOrderQty: 1000,
    orderMultiple: 500,
    shrinkageAllowancePct: 1.0,
    inspectionBufferDays: 1
  },
  {
    id: 'rule-cool-syn20',
    stockItemId: 'stock-4',
    ruleType: 'fixed_units',
    fixedBufferQty: 250,
    bufferDays: 3,
    minOrderQty: 100,
    orderMultiple: 50,
    shrinkageAllowancePct: 0.0,
    inspectionBufferDays: 1
  }
];

export const DEFAULT_SCHEDULE_CONFIG: MrpScheduleConfig = {
  enabled: true,
  frequency: 'daily',
  timeOfDay: '06:00',
  horizonDays: 30,
  plantId: 'all',
  autoNotifyProcurement: true,
  notifyEmail: 'procurement@flowops.com',
  lastRunAt: new Date(Date.now() - 14 * 3600000).toISOString(),
  nextRunAt: new Date(Date.now() + 10 * 3600000).toISOString(),
  safetyStockMultiplier: 1.0
};

class MrpService {
  private getStorageKey(tenantId: string, entity: string): string {
    return `flowops_mrp_${entity}_${tenantId}`;
  }

  // ── 1. Fetch Safety Stock Rules ──────────────────────────────
  async getSafetyStockRules(tenantId: string): Promise<SafetyStockRule[]> {
    const isSandbox = localStorage.getItem('isSandboxMode') === 'true' || !db;
    const key = this.getStorageKey(tenantId, 'rules');

    if (isSandbox) {
      const cached = localStorage.getItem(key);
      if (cached) return JSON.parse(cached);
      localStorage.setItem(key, JSON.stringify(DEFAULT_SAFETY_STOCK_RULES));
      return DEFAULT_SAFETY_STOCK_RULES;
    }

    try {
      const snap = await getDocs(collection(db, 'tenants', tenantId, 'mrpSafetyRules'));
      if (snap.empty) {
        const batch = writeBatch(db);
        for (const r of DEFAULT_SAFETY_STOCK_RULES) {
          batch.set(doc(db, 'tenants', tenantId, 'mrpSafetyRules', r.id), r);
        }
        await batch.commit();
        return DEFAULT_SAFETY_STOCK_RULES;
      }
      const list: SafetyStockRule[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as SafetyStockRule));
      return list;
    } catch {
      const cached = localStorage.getItem(key);
      return cached ? JSON.parse(cached) : DEFAULT_SAFETY_STOCK_RULES;
    }
  }

  // ── 2. Save Safety Stock Rules ───────────────────────────────
  async saveSafetyStockRules(tenantId: string, rules: SafetyStockRule[]): Promise<void> {
    const key = this.getStorageKey(tenantId, 'rules');
    localStorage.setItem(key, JSON.stringify(rules));

    const isSandbox = localStorage.getItem('isSandboxMode') === 'true' || !db;
    if (!isSandbox && db) {
      try {
        const batch = writeBatch(db);
        for (const r of rules) {
          batch.set(doc(db, 'tenants', tenantId, 'mrpSafetyRules', r.id), r);
        }
        await batch.commit();
      } catch (err) {
        console.warn('Firestore saveSafetyStockRules error', err);
      }
    }
  }

  // ── 3. Schedule Config ───────────────────────────────────────
  async getScheduleConfig(tenantId: string): Promise<MrpScheduleConfig> {
    const key = this.getStorageKey(tenantId, 'schedule_config');
    const cached = localStorage.getItem(key);
    if (cached) return JSON.parse(cached);

    const isSandbox = localStorage.getItem('isSandboxMode') === 'true' || !db;
    if (!isSandbox && db) {
      try {
        const snap = await getDocs(collection(db, 'tenants', tenantId, 'mrpConfig'));
        if (!snap.empty) {
          const cfg = snap.docs[0].data() as MrpScheduleConfig;
          localStorage.setItem(key, JSON.stringify(cfg));
          return cfg;
        }
      } catch {}
    }

    localStorage.setItem(key, JSON.stringify(DEFAULT_SCHEDULE_CONFIG));
    return DEFAULT_SCHEDULE_CONFIG;
  }

  async saveScheduleConfig(tenantId: string, config: MrpScheduleConfig): Promise<void> {
    const key = this.getStorageKey(tenantId, 'schedule_config');
    localStorage.setItem(key, JSON.stringify(config));

    const isSandbox = localStorage.getItem('isSandboxMode') === 'true' || !db;
    if (!isSandbox && db) {
      try {
        await setDoc(doc(db, 'tenants', tenantId, 'mrpConfig', 'schedule'), config);
      } catch (err) {
        console.warn('Firestore saveScheduleConfig error', err);
      }
    }
    window.dispatchEvent(new Event('flowops:mrp_updated'));
  }

  // ── 4. Fetch MRP Run History ─────────────────────────────────
  async getRunHistory(tenantId: string): Promise<MrpRunRecord[]> {
    const key = this.getStorageKey(tenantId, 'runs');
    const cached = localStorage.getItem(key);
    if (cached) return JSON.parse(cached);

    const initialSeedRuns: MrpRunRecord[] = [
      {
        id: 'run-seed-01',
        runNumber: 'MRP-2026-0038',
        tenantId,
        plantId: 'plant-pune',
        plantName: 'Pune Heavy Forge Facility',
        triggeredAt: new Date(Date.now() - 14 * 3600000).toISOString(),
        triggeredByUserId: 'usr-scheduler',
        triggeredByName: 'Automated Nightly Scheduler',
        runMode: 'scheduled',
        horizonDays: 30,
        totalMaterialsAnalyzed: 14,
        totalDemandQty: 54.8,
        recommendationsCount: 4,
        criticalRecommendationsCount: 2,
        totalRecommendedSpend: 1845000,
        runtimeMs: 420,
        status: 'completed',
        summaryMessage: 'Automated 30-day explosion complete. 2 critical stockout risks detected.'
      }
    ];

    localStorage.setItem(key, JSON.stringify(initialSeedRuns));
    return initialSeedRuns;
  }

  // ── 5. Fetch Purchase Recommendations ────────────────────────
  async getRecommendations(tenantId: string): Promise<MrpPurchaseRecommendation[]> {
    const key = this.getStorageKey(tenantId, 'recommendations');
    const cached = localStorage.getItem(key);
    if (cached) return JSON.parse(cached);

    // Initial realistic seed recommendations matching manufacturing scenarios
    const initialSeedRecommendations = this.generateSeedRecommendations(tenantId);
    localStorage.setItem(key, JSON.stringify(initialSeedRecommendations));
    return initialSeedRecommendations;
  }

  // ── 6. Execute Full MRP Explosion Engine ─────────────────────
  async executeMrpRun(
    tenantId: string,
    params: {
      plantId?: string;
      horizonDays?: MrpHorizon;
      runMode?: MrpRunMode;
      safetyMultiplier?: number;
      operatorId?: string;
      operatorName?: string;
    }
  ): Promise<{ run: MrpRunRecord; recommendations: MrpPurchaseRecommendation[] }> {
    const startTime = performance.now();
    const horizon = params.horizonDays || 30;
    const plantId = params.plantId || 'all';
    const safetyMultiplier = params.safetyMultiplier || 1.0;
    const runMode = params.runMode || 'manual';

    // 1. Gather live inventory data
    const binStockRecords = await multiLocationInventoryService.getBinStockRecords(tenantId);
    const inboundOrders = await multiLocationInventoryService.getInboundOrders(tenantId);
    const safetyRules = await this.getSafetyStockRules(tenantId);

    // 2. Explode Master Production Schedule gross requirements
    const grossDemands = this.explodeWorkOrderDemands(tenantId, plantId, horizon);

    // 3. Materials dictionary
    const materialGroups: Record<string, MrpGrossDemandItem[]> = {};
    for (const d of grossDemands) {
      if (!materialGroups[d.stockItemId]) materialGroups[d.stockItemId] = [];
      materialGroups[d.stockItemId].push(d);
    }

    const runNumber = `MRP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const runId = `run-${Date.now()}`;
    const recommendations: MrpPurchaseRecommendation[] = [];

    // Distinct materials to analyze (all from gross demand + any items with active bin records)
    const distinctMaterialIds = Array.from(
      new Set([
        ...Object.keys(materialGroups),
        ...binStockRecords.map(b => b.stockItemId)
      ])
    );

    let totalDemandQty = 0;
    let criticalCount = 0;
    let totalRecommendedSpend = 0;

    const horizonLimitDate = new Date();
    horizonLimitDate.setDate(horizonLimitDate.getDate() + horizon);

    for (const matId of distinctMaterialIds) {
      const demands = materialGroups[matId] || [];
      const totalGrossDemand = demands.reduce((sum, d) => sum + d.quantity, 0);
      totalDemandQty += totalGrossDemand;

      // Filter bin records by target plant if scoped
      const matchingBinRecords = binStockRecords.filter(
        b => b.stockItemId === matId && (plantId === 'all' || b.plantId === plantId)
      );

      if (matchingBinRecords.length === 0 && demands.length === 0) continue;

      const representativeRec = matchingBinRecords[0] || {
        stockItemId: matId,
        stockItemCode: demands[0]?.stockItemCode || 'MAT-RAW',
        stockItemName: demands[0]?.stockItemName || 'Raw Material',
        category: 'raw_material' as const,
        unit: demands[0]?.unit || 'tonnes',
        unitCost: 65000,
        plantId: plantId === 'all' ? 'plant-pune' : plantId,
        plantName: plantId === 'plant-vadodara' ? 'Vadodara Machining Center' : 'Pune Heavy Forge Facility'
      };

      const totalOnHand = matchingBinRecords.reduce((sum, b) => sum + b.onHandQty, 0);
      const totalReserved = matchingBinRecords.reduce((sum, b) => sum + b.reservedQty, 0);
      const freeAvailable = Math.max(0, totalOnHand - totalReserved);

      // Inbound POs arriving within planning horizon
      const matchingInbounds = inboundOrders.filter(
        p => p.stockItemId === matId && (plantId === 'all' || p.tenantId === tenantId)
      );
      const scheduledInbound = matchingInbounds.reduce((sum, p) => sum + p.orderedQty, 0);

      // Safety stock rule
      const rule = safetyRules.find(r => r.stockItemId === matId) || {
        id: `default-${matId}`,
        ruleType: 'fixed_units' as const,
        fixedBufferQty: 2.0,
        bufferDays: 5,
        minOrderQty: 1.0,
        orderMultiple: 0.5,
        shrinkageAllowancePct: 2.0,
        inspectionBufferDays: 1
      };

      const safetyStockRequired = Number((rule.fixedBufferQty * safetyMultiplier).toFixed(3));

      // ── Core MRP Netting Formula ──────────────────────────────
      // Net Requirement = (Gross Demand + Safety Stock) - (Available Stock + Scheduled Inbound)
      const projectedNetRequirement = Number(
        (totalGrossDemand + safetyStockRequired - (freeAvailable + scheduledInbound)).toFixed(3)
      );

      // If net requirement > 0, we must generate a purchase recommendation!
      if (projectedNetRequirement > 0) {
        // Adjust for Minimum Order Quantity (MOQ) and Order Multiples
        let recommendedOrderQty = Math.max(rule.minOrderQty, projectedNetRequirement);
        if (rule.orderMultiple > 0) {
          recommendedOrderQty = Math.ceil(recommendedOrderQty / rule.orderMultiple) * rule.orderMultiple;
        }
        recommendedOrderQty = Number(recommendedOrderQty.toFixed(3));

        // Time Phasing & Lead Time Mathematics
        // Need-by date: Earliest work order requirement, or within 5 days if buffer breach
        let earliestNeedBy = demands.length > 0
          ? demands.reduce((earliest, d) => (new Date(d.requiredDate) < new Date(earliest) ? d.requiredDate : earliest), demands[0].requiredDate)
          : new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0];

        const leadTimeDays = this.getLeadTimeForMaterial(representativeRec.stockItemCode);
        const inspectionBufferDays = rule.inspectionBufferDays || 1;

        // Order-by date = Need-by date - Lead Time Days - Inspection Lag
        const needByMs = new Date(earliestNeedBy).getTime();
        const orderByMs = needByMs - (leadTimeDays + inspectionBufferDays) * 86400000;
        const orderByDate = new Date(orderByMs).toISOString().split('T')[0];

        // Slack Days = Days between Today and Order-By Date
        const todayMs = new Date().setHours(0, 0, 0, 0);
        const slackDays = Math.ceil((orderByMs - todayMs) / 86400000);

        // Urgency Level Determination
        let urgency: MrpRecommendationUrgency = 'planned';
        if (slackDays <= 0) {
          urgency = 'critical'; // Overdue to place order! Negative slack!
          criticalCount++;
        } else if (slackDays <= 3) {
          urgency = 'high';
        } else if (slackDays <= 7) {
          urgency = 'medium';
        }

        const unitCost = representativeRec.unitCost || 65000;
        const totalEstimatedCost = Math.round(recommendedOrderQty * unitCost);
        totalRecommendedSpend += totalEstimatedCost;

        const supplierInfo = this.getPreferredSupplierForMaterial(representativeRec.stockItemCode);

        const rec: MrpPurchaseRecommendation = {
          id: `rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          runId,
          tenantId,
          plantId: representativeRec.plantId,
          plantName: representativeRec.plantName,
          stockItemId: matId,
          stockItemCode: representativeRec.stockItemCode,
          stockItemName: representativeRec.stockItemName,
          category: representativeRec.category,
          unit: representativeRec.unit,
          unitCost,
          currentOnHand: totalOnHand,
          reservedQty: totalReserved,
          availableStock: freeAvailable,
          scheduledInbound,
          safetyStockRequired,
          grossRequirement: totalGrossDemand,
          netRequirement: projectedNetRequirement,
          recommendedOrderQty,
          totalEstimatedCost,
          leadTimeDays,
          inspectionBufferDays,
          needByDate: earliestNeedBy,
          orderByDate,
          expectedDeliveryDate: new Date(orderByMs + leadTimeDays * 86400000).toISOString().split('T')[0],
          slackDays,
          preferredSupplierId: supplierInfo.id,
          preferredSupplierName: supplierInfo.name,
          vendorPaymentTerms: supplierInfo.terms,
          moq: rule.minOrderQty,
          orderMultiple: rule.orderMultiple,
          urgency,
          status: 'pending',
          notes: slackDays <= 0
            ? `CRITICAL STOCKOUT RISK: Needed in ${Math.abs(slackDays)} days sooner than vendor lead time (${leadTimeDays}d) allows. Expedite required!`
            : `Order required by ${orderByDate} to guarantee dock delivery before shopfloor consumption on ${earliestNeedBy}.`,
          demandsBreakdown: demands.map(d => ({
            workOrderNumber: d.workOrderNumber,
            productPartName: d.productPartName,
            qty: d.quantity,
            requiredDate: d.requiredDate
          }))
        };

        recommendations.push(rec);
      }
    }

    // Sort recommendations by urgency: critical first, then high, then medium
    const urgencyWeight: Record<MrpRecommendationUrgency, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      planned: 1
    };
    recommendations.sort((a, b) => {
      const diff = urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
      if (diff !== 0) return diff;
      return a.slackDays - b.slackDays;
    });

    const runtimeMs = Math.round(performance.now() - startTime);

    const runRecord: MrpRunRecord = {
      id: runId,
      runNumber,
      tenantId,
      plantId,
      plantName: plantId === 'all' ? 'All Plants (Enterprise Horizon)' : plantId,
      triggeredAt: new Date().toISOString(),
      triggeredByUserId: params.operatorId || 'usr-procurement',
      triggeredByName: params.operatorName || (runMode === 'scheduled' ? 'Automated Scheduled Engine' : 'Procurement Manager'),
      runMode,
      horizonDays: horizon,
      totalMaterialsAnalyzed: distinctMaterialIds.length,
      totalDemandQty,
      recommendationsCount: recommendations.length,
      criticalRecommendationsCount: criticalCount,
      totalRecommendedSpend,
      runtimeMs,
      status: 'completed',
      summaryMessage: `MRP Run ${runNumber} completed in ${runtimeMs}ms. Analyzed ${distinctMaterialIds.length} materials over ${horizon}-day horizon. Generated ${recommendations.length} purchase recommendations (${criticalCount} critical stockout alerts).`
    };

    // Save run record to storage
    const runs = await this.getRunHistory(tenantId);
    runs.unshift(runRecord);
    localStorage.setItem(this.getStorageKey(tenantId, 'runs'), JSON.stringify(runs));

    // Save recommendations
    localStorage.setItem(this.getStorageKey(tenantId, 'recommendations'), JSON.stringify(recommendations));

    // Update schedule config's lastRunAt
    const config = await this.getScheduleConfig(tenantId);
    config.lastRunAt = runRecord.triggeredAt;
    // Set next run in 24 hours
    config.nextRunAt = new Date(Date.now() + 24 * 3600000).toISOString();
    await this.saveScheduleConfig(tenantId, config);

    // Cross-module reactive sync
    window.dispatchEvent(new CustomEvent('flowops:mrp_updated', { detail: { run: runRecord, recommendations } }));

    return { run: runRecord, recommendations };
  }

  // ── 7. One-Click PO Generation (Convert to Purchase Order) ──
  async convertRecommendationToPo(
    tenantId: string,
    recommendationId: string,
    params: {
      poNumber?: string;
      targetBinId?: string;
      notes?: string;
      operatorName?: string;
    }
  ): Promise<{ success: boolean; poNumber: string; updatedRecommendation: MrpPurchaseRecommendation }> {
    const recommendations = await this.getRecommendations(tenantId);
    const rec = recommendations.find(r => r.id === recommendationId);
    if (!rec) throw new Error('Recommendation was not found.');

    const generatedPo = params.poNumber?.trim().toUpperCase() ||
      `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    rec.status = 'po_created';
    rec.poNumber = generatedPo;
    rec.convertedAt = new Date().toISOString();
    rec.convertedByName = params.operatorName || 'Procurement Manager';
    if (params.notes) rec.notes = `${rec.notes} • PO Issued: ${params.notes}`;

    // Register approved inbound purchase order in multiLocationInventoryService
    const inbounds = await multiLocationInventoryService.getInboundOrders(tenantId);
    const newInboundOrder: StockInboundOrder = {
      id: `inbound-${Date.now()}`,
      tenantId,
      stockItemId: rec.stockItemId,
      stockItemCode: rec.stockItemCode,
      stockItemName: rec.stockItemName,
      poNumber: generatedPo,
      supplierName: rec.preferredSupplierName,
      orderedQty: rec.recommendedOrderQty,
      unit: rec.unit,
      unitCost: rec.unitCost,
      targetPlantId: rec.plantId || 'plant-pune',
      targetPlantName: rec.plantName || 'Pune Heavy Forge Facility',
      targetStoreId: 'store-pune-rm',
      targetStoreName: 'Main Raw Materials Store',
      expectedDeliveryDate: rec.expectedDeliveryDate,
      createdDate: new Date().toISOString(),
      status: 'confirmed'
    };

    inbounds.unshift(newInboundOrder);
    localStorage.setItem(`flowops_ml_inbound_orders_${tenantId}`, JSON.stringify(inbounds));

    // Update on-order quantity on matching bin stock records
    const binStockRecords = await multiLocationInventoryService.getBinStockRecords(tenantId);
    for (const b of binStockRecords) {
      if (b.stockItemId === rec.stockItemId) {
        b.onOrderQty = Number((b.onOrderQty + rec.recommendedOrderQty).toFixed(3));
        b.onOrderValue = b.onOrderQty * b.unitCost;
        b.updatedAt = new Date().toISOString();
      }
    }
    localStorage.setItem(`flowops_ml_bin_stock_${tenantId}`, JSON.stringify(binStockRecords));

    // Save recommendations back
    localStorage.setItem(this.getStorageKey(tenantId, 'recommendations'), JSON.stringify(recommendations));

    // Register full Purchase Order in Purchase Order Automation Engine
    try {
      await purchaseOrderService.createPoFromMrp(tenantId, rec, {
        name: params.operatorName || 'Procurement Manager'
      });
    } catch (poErr) {
      console.warn('Failed to register PO in purchaseOrderService', poErr);
    }

    // Broadcast reactive updates
    window.dispatchEvent(new CustomEvent('flowops:mrp_updated', { detail: { converted: rec } }));
    window.dispatchEvent(new CustomEvent('flowops:multilocation_updated', { detail: { poCreated: newInboundOrder } }));
    window.dispatchEvent(new Event('flowops:inventory_updated'));

    return {
      success: true,
      poNumber: generatedPo,
      updatedRecommendation: rec
    };
  }

  // ── 8. Dismiss / Snooze Recommendation ───────────────────────
  async dismissRecommendation(
    tenantId: string,
    recommendationId: string,
    reason: string
  ): Promise<void> {
    const recommendations = await this.getRecommendations(tenantId);
    const rec = recommendations.find(r => r.id === recommendationId);
    if (!rec) return;

    rec.status = 'dismissed';
    rec.notes = `${rec.notes} • Dismissed: ${reason}`;
    localStorage.setItem(this.getStorageKey(tenantId, 'recommendations'), JSON.stringify(recommendations));
    window.dispatchEvent(new Event('flowops:mrp_updated'));
  }

  // ── Helper: Explode Work Order Demands ───────────────────────
  private explodeWorkOrderDemands(tenantId: string, plantId: string, horizonDays: number): MrpGrossDemandItem[] {
    const horizonMs = Date.now() + horizonDays * 86400000;
    const items: MrpGrossDemandItem[] = [];

    // Try reading active work orders from localStorage
    try {
      const woKey = `flowops_workorders_${tenantId}`;
      const cached = localStorage.getItem(woKey);
      if (cached) {
        const orders = JSON.parse(cached);
        for (const wo of orders) {
          if (['draft', 'pending', 'ready', 'in_progress'].includes(wo.status)) {
            const dueDateMs = new Date(wo.dueDate).getTime();
            if (dueDateMs <= horizonMs) {
              if (wo.bomItems && Array.isArray(wo.bomItems)) {
                for (const bi of wo.bomItems) {
                  items.push({
                    id: `dem-${wo.id}-${bi.id || Math.random()}`,
                    stockItemId: bi.stockItemId || bi.partNumber || 'stock-1',
                    stockItemCode: bi.partNumber || 'WR-1002',
                    stockItemName: bi.description || 'Raw Material',
                    workOrderId: wo.id,
                    workOrderNumber: wo.orderNumber,
                    productPartName: wo.partName,
                    requiredDate: wo.dueDate,
                    quantity: bi.totalRequiredQuantity || 5.0,
                    unit: bi.unit || 'tonnes',
                    plantId: wo.plantId || 'plant-pune',
                    plantName: 'Pune Heavy Forge Facility'
                  });
                }
              }
            }
          }
        }
      }
    } catch {}

    // If no work orders in storage yet, supply production demand schedule
    if (items.length === 0) {
      items.push(
        {
          id: 'dem-01',
          stockItemId: 'stock-1',
          stockItemCode: 'WR-1002',
          stockItemName: 'Wire Rod — High Tensile Steel 8mm',
          workOrderId: 'wo-seed-01',
          workOrderNumber: 'WO-2026-001',
          productPartName: 'Connecting Rods (Batch A)',
          requiredDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
          quantity: 16.0,
          unit: 'tonnes',
          plantId: 'plant-pune',
          plantName: 'Pune Heavy Forge Facility'
        },
        {
          id: 'dem-02',
          stockItemId: 'stock-1',
          stockItemCode: 'WR-1002',
          stockItemName: 'Wire Rod — High Tensile Steel 8mm',
          workOrderId: 'wo-seed-02',
          workOrderNumber: 'WO-2026-003',
          productPartName: 'Forged Steering Arms',
          requiredDate: new Date(Date.now() + 11 * 86400000).toISOString().split('T')[0],
          quantity: 10.0,
          unit: 'tonnes',
          plantId: 'plant-pune',
          plantName: 'Pune Heavy Forge Facility'
        },
        {
          id: 'dem-03',
          stockItemId: 'stock-6',
          stockItemCode: 'RB-40CS',
          stockItemName: 'Round Bars - Carbon Steel CS45 40mm',
          workOrderId: 'wo-seed-03',
          workOrderNumber: 'WO-2026-002',
          productPartName: 'Flange Drive Shaft',
          requiredDate: new Date(Date.now() + 8 * 86400000).toISOString().split('T')[0],
          quantity: 6.5,
          unit: 'tonnes',
          plantId: 'plant-pune',
          plantName: 'Pune Heavy Forge Facility'
        },
        {
          id: 'dem-04',
          stockItemId: 'stock-7',
          stockItemCode: 'DS-H13',
          stockItemName: 'Die Steel Blocks H13 Premium',
          workOrderId: 'wo-seed-04',
          workOrderNumber: 'WO-2026-004',
          productPartName: 'Extrusion Die Set 500mm',
          requiredDate: new Date(Date.now() + 16 * 86400000).toISOString().split('T')[0],
          quantity: 2.4,
          unit: 'tonnes',
          plantId: 'plant-pune',
          plantName: 'Pune Heavy Forge Facility'
        },
        {
          id: 'dem-05',
          stockItemId: 'stock-2',
          stockItemCode: 'OIL-HYD68',
          stockItemName: 'Hydraulic Oil ISO VG 68',
          workOrderId: 'wo-seed-05',
          workOrderNumber: 'WO-2026-005',
          productPartName: '2000T Hydraulic Press Scheduled Overhaul',
          requiredDate: new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0],
          quantity: 600,
          unit: 'litres',
          plantId: 'plant-pune',
          plantName: 'Pune Heavy Forge Facility'
        },
        {
          id: 'dem-06',
          stockItemId: 'stock-3',
          stockItemCode: 'FAST-M12-88',
          stockItemName: 'Hex Bolts M12x60 Grade 8.8 High Tensile',
          workOrderId: 'wo-seed-06',
          workOrderNumber: 'WO-2026-006',
          productPartName: 'Bolted Sub-Assembly Housing',
          requiredDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
          quantity: 4500,
          unit: 'units',
          plantId: 'plant-pune',
          plantName: 'Pune Heavy Forge Facility'
        }
      );
    }

    return items;
  }

  // ── Lead Time Lookup ─────────────────────────────────────────
  private getLeadTimeForMaterial(code: string): number {
    const c = code.toUpperCase();
    if (c.includes('WR-') || c.includes('WIRE')) return 7;      // 7 days steel mill lead time
    if (c.includes('RB-') || c.includes('ROUND')) return 5;     // 5 days bar mill lead time
    if (c.includes('DS-') || c.includes('DIE') || c.includes('H13')) return 14; // 14 days tool steel
    if (c.includes('OIL') || c.includes('HYD')) return 3;       // 3 days industrial lubricant
    if (c.includes('FAST') || c.includes('BOLT')) return 4;     // 4 days fastener supplier
    if (c.includes('COOL') || c.includes('SYN')) return 2;      // 2 days fluid supplier
    return 6;
  }

  // ── Preferred Supplier Lookup ────────────────────────────────
  private getPreferredSupplierForMaterial(code: string): { id: string; name: string; terms: string } {
    const c = code.toUpperCase();
    if (c.includes('WR-') || c.includes('WIRE')) {
      return { id: 'sup-tata', name: 'Tata Prime Steel Ltd.', terms: 'Net 30 Days • Freight Paid' };
    }
    if (c.includes('RB-') || c.includes('ROUND')) {
      return { id: 'sup-jindal', name: 'Jindal Steel & Power Corp', terms: 'Net 45 Days • Ex-Works' };
    }
    if (c.includes('DS-') || c.includes('H13')) {
      return { id: 'sup-bharat', name: 'Bharat Forge Specialty Tooling', terms: 'Advance 20% / Balance Net 30' };
    }
    if (c.includes('OIL') || c.includes('HYD')) {
      return { id: 'sup-castrol', name: 'Castrol Industrial Lubricants', terms: 'Net 15 Days • Drum Delivery' };
    }
    if (c.includes('FAST') || c.includes('BOLT')) {
      return { id: 'sup-unbrako', name: 'Unbrako Fasteners India', terms: 'Net 30 Days' };
    }
    return { id: 'sup-std', name: 'National Industrial Supplies', terms: 'Net 30 Days' };
  }

  // ── Seed Recommendations Generation ──────────────────────────
  private generateSeedRecommendations(tenantId: string): MrpPurchaseRecommendation[] {
    const now = Date.now();
    return [
      {
        id: 'rec-seed-01',
        runId: 'run-seed-01',
        tenantId,
        plantId: 'plant-pune',
        plantName: 'Pune Heavy Forge Facility',
        stockItemId: 'stock-1',
        stockItemCode: 'WR-1002',
        stockItemName: 'Wire Rod — High Tensile Steel 8mm',
        category: 'raw_material',
        unit: 'tonnes',
        unitCost: 68500,
        currentOnHand: 14.5,
        reservedQty: 10.0,
        availableStock: 4.5,
        scheduledInbound: 15.0,
        safetyStockRequired: 6.0,
        grossRequirement: 26.0,
        netRequirement: 12.5,
        recommendedOrderQty: 14.0,
        totalEstimatedCost: 14.0 * 68500,
        leadTimeDays: 7,
        inspectionBufferDays: 1,
        needByDate: new Date(now + 5 * 86400000).toISOString().split('T')[0],
        orderByDate: new Date(now - 3 * 86400000).toISOString().split('T')[0], // Overdue!
        expectedDeliveryDate: new Date(now + 6 * 86400000).toISOString().split('T')[0],
        slackDays: -3,
        preferredSupplierId: 'sup-tata',
        preferredSupplierName: 'Tata Prime Steel Ltd.',
        vendorPaymentTerms: 'Net 30 Days • Freight Paid',
        moq: 4.0,
        orderMultiple: 1.0,
        urgency: 'critical',
        status: 'pending',
        notes: 'CRITICAL STOCKOUT RISK: Work Order WO-2026-001 connecting rod run commences in 5 days. Vendor lead time is 7 days (-3 days slack). Expedite with Tata Prime Steel immediately!',
        demandsBreakdown: [
          {
            workOrderNumber: 'WO-2026-001',
            productPartName: 'Forged Connecting Rods',
            qty: 16.0,
            requiredDate: new Date(now + 5 * 86400000).toISOString().split('T')[0]
          },
          {
            workOrderNumber: 'WO-2026-003',
            productPartName: 'Forged Steering Arms',
            qty: 10.0,
            requiredDate: new Date(now + 11 * 86400000).toISOString().split('T')[0]
          }
        ]
      },
      {
        id: 'rec-seed-02',
        runId: 'run-seed-01',
        tenantId,
        plantId: 'plant-pune',
        plantName: 'Pune Heavy Forge Facility',
        stockItemId: 'stock-6',
        stockItemCode: 'RB-40CS',
        stockItemName: 'Round Bars - Carbon Steel CS45 40mm',
        category: 'raw_material',
        unit: 'tonnes',
        unitCost: 62000,
        currentOnHand: 3.2,
        reservedQty: 2.0,
        availableStock: 1.2,
        scheduledInbound: 0,
        safetyStockRequired: 3.0,
        grossRequirement: 6.5,
        netRequirement: 5.3,
        recommendedOrderQty: 5.5,
        totalEstimatedCost: 5.5 * 62000,
        leadTimeDays: 5,
        inspectionBufferDays: 1,
        needByDate: new Date(now + 8 * 86400000).toISOString().split('T')[0],
        orderByDate: new Date(now + 2 * 86400000).toISOString().split('T')[0],
        expectedDeliveryDate: new Date(now + 7 * 86400000).toISOString().split('T')[0],
        slackDays: 2,
        preferredSupplierId: 'sup-jindal',
        preferredSupplierName: 'Jindal Steel & Power Corp',
        vendorPaymentTerms: 'Net 45 Days • Ex-Works',
        moq: 2.0,
        orderMultiple: 0.5,
        urgency: 'high',
        status: 'pending',
        notes: 'Order due in 2 days. Flange Drive Shaft production on WO-2026-002 will consume current buffer down to zero.',
        demandsBreakdown: [
          {
            workOrderNumber: 'WO-2026-002',
            productPartName: 'Flange Drive Shaft',
            qty: 6.5,
            requiredDate: new Date(now + 8 * 86400000).toISOString().split('T')[0]
          }
        ]
      },
      {
        id: 'rec-seed-03',
        runId: 'run-seed-01',
        tenantId,
        plantId: 'plant-pune',
        plantName: 'Pune Heavy Forge Facility',
        stockItemId: 'stock-7',
        stockItemCode: 'DS-H13',
        stockItemName: 'Die Steel Blocks H13 Premium',
        category: 'raw_material',
        unit: 'tonnes',
        unitCost: 385000,
        currentOnHand: 1.8,
        reservedQty: 1.0,
        availableStock: 0.8,
        scheduledInbound: 0,
        safetyStockRequired: 1.2,
        grossRequirement: 2.4,
        netRequirement: 1.6,
        recommendedOrderQty: 1.6,
        totalEstimatedCost: 1.6 * 385000,
        leadTimeDays: 14,
        inspectionBufferDays: 2,
        needByDate: new Date(now + 16 * 86400000).toISOString().split('T')[0],
        orderByDate: new Date(now).toISOString().split('T')[0],
        expectedDeliveryDate: new Date(now + 14 * 86400000).toISOString().split('T')[0],
        slackDays: 0,
        preferredSupplierId: 'sup-bharat',
        preferredSupplierName: 'Bharat Forge Specialty Tooling',
        vendorPaymentTerms: 'Advance 20% / Balance Net 30',
        moq: 0.5,
        orderMultiple: 0.2,
        urgency: 'critical',
        status: 'pending',
        notes: 'Tool steel block has 14-day forging & heat treat cycle at Bharat Forge. Order release date is TODAY.',
        demandsBreakdown: [
          {
            workOrderNumber: 'WO-2026-004',
            productPartName: 'Extrusion Die Set 500mm',
            qty: 2.4,
            requiredDate: new Date(now + 16 * 86400000).toISOString().split('T')[0]
          }
        ]
      },
      {
        id: 'rec-seed-04',
        runId: 'run-seed-01',
        tenantId,
        plantId: 'plant-pune',
        plantName: 'Pune Heavy Forge Facility',
        stockItemId: 'stock-3',
        stockItemCode: 'FAST-M12-88',
        stockItemName: 'Hex Bolts M12x60 Grade 8.8 High Tensile',
        category: 'raw_material',
        unit: 'units',
        unitCost: 48,
        currentOnHand: 2500,
        reservedQty: 1200,
        availableStock: 1300,
        scheduledInbound: 1500,
        safetyStockRequired: 2000,
        grossRequirement: 4500,
        netRequirement: 3700,
        recommendedOrderQty: 4000,
        totalEstimatedCost: 4000 * 48,
        leadTimeDays: 4,
        inspectionBufferDays: 1,
        needByDate: new Date(now + 4 * 86400000).toISOString().split('T')[0],
        orderByDate: new Date(now - 1 * 86400000).toISOString().split('T')[0],
        expectedDeliveryDate: new Date(now + 3 * 86400000).toISOString().split('T')[0],
        slackDays: -1,
        preferredSupplierId: 'sup-unbrako',
        preferredSupplierName: 'Unbrako Fasteners India',
        vendorPaymentTerms: 'Net 30 Days',
        moq: 1000,
        orderMultiple: 500,
        urgency: 'high',
        status: 'pending',
        notes: 'High tensile fasteners needed for assembly cells. Order MOQ rounded to 4,000 units.',
        demandsBreakdown: [
          {
            workOrderNumber: 'WO-2026-006',
            productPartName: 'Bolted Sub-Assembly Housing',
            qty: 4500,
            requiredDate: new Date(now + 4 * 86400000).toISOString().split('T')[0]
          }
        ]
      }
    ];
  }
}

export const mrpService = new MrpService();
