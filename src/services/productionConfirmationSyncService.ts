// src/services/productionConfirmationSyncService.ts

import { db } from '../firebase';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { 
  ProductionConfirmationRecord, 
  ProductionConfirmationStats,
  ConfirmationPostingConfig,
  ConsumedMaterialItem
} from '../types/productionConfirmationSync';

const STORAGE_KEY = 'flowops_production_confirmations_v1';
const CONFIG_KEY = 'flowops_production_confirmation_config_v1';

const DEFAULT_CONFIG: ConfirmationPostingConfig = {
  erpSystem: 'tally',
  tallyConfig: {
    mfgJournalVoucherType: 'Manufacturing Journal',
    fgLedger: 'Finished Goods Inventory - Machined Components',
    rawMaterialConsumptionLedger: 'Raw Material Consumption A/c - Shopfloor',
    scrapExpenseLedger: 'Manufacturing Scrap & Spoilage Loss A/c',
    reworkLaborLedger: 'Rework & Machine Variance Overhead A/c',
    autoPushOnFqcRelease: true
  },
  oracleConfig: {
    inventoryOrgCode: 'APEX_PUNE_MFG_01',
    wipCompletionSubinventory: 'FG-SUBINV-BAY-02',
    scrapCostCenterAccount: 'GL-5400-PUNE-SCRAP',
    reworkVarianceAccount: 'GL-5420-PUNE-REWORK',
    autoPushOnFqcRelease: true
  },
  sapConfig: {
    plantCode: 'PL01',
    storageLocationFg: 'SL01_FG',
    storageLocationRm: 'SL02_RM',
    costCenterCode: 'CC_CNC_PUNE',
    autoPushOnFqcRelease: true
  }
};

const INITIAL_CONFIRMATIONS: ProductionConfirmationRecord[] = [
  {
    id: 'pconf-101',
    tenantId: 'demo',
    workOrderId: 'wo-101',
    workOrderNumber: 'WO-2026-0001',
    salesOrderId: 'so-tata-01',
    salesOrderNumber: 'ORD-2026-0042',
    customerPoNumber: 'PO-TATA-CVBU-8812',
    customerName: 'Tata Motors Precision CVBU',
    plantId: 'plant-pune',
    plantName: 'Pune Mega Transmission Plant',
    partCode: 'FG-SPUR-GEAR-M4',
    partName: 'Forged Steel Spur Gear (Mod 4, 32T)',
    quantityCompleted: 45,
    quantityScrapped: 2,
    uom: 'Nos',
    completionDate: new Date(Date.now() - 3 * 3600 * 1000).toISOString().split('T')[0],
    erpSystem: 'tally',
    status: 'pending_confirmation',
    completionSync: {
      fgStockItemName: 'Forged Steel Spur Gear (Mod 4, 32T)',
      targetSubinventory: 'FG-BAY-01 (Pune)',
      fgValuationINR: 184500,
      fgCostPerUnit: 4100,
      status: 'pending'
    },
    materialConsumptionSync: {
      materials: [
        {
          id: 'mat-1',
          itemCode: 'RM-EN353-RND-140',
          itemName: 'EN353 / 20MnCr5 Forged Round Billet Ø140mm',
          bomRequiredQty: 47.25,
          actualConsumedQty: 48,
          uom: 'Nos',
          scrapFactorPct: 5,
          unitCostINR: 1850,
          totalCostINR: 88800,
          lotNumber: 'LOT-EN353-2026-88',
          sourceWarehouse: 'RM-STORES-BAY-A',
          stockRelieved: false
        },
        {
          id: 'mat-2',
          itemCode: 'STD-FAST-M10X35',
          itemName: 'High-Tensile Hex Socket Head Cap Screws M10 x 35mm',
          bomRequiredQty: 180,
          actualConsumedQty: 188,
          uom: 'Nos',
          scrapFactorPct: 2,
          unitCostINR: 28,
          totalCostINR: 5264,
          lotNumber: 'LOT-FAST-GR109-41',
          sourceWarehouse: 'HARDWARE-BIN-04',
          stockRelieved: false
        }
      ],
      totalMaterialCostINR: 94064,
      status: 'pending'
    },
    scrapReworkSync: {
      quantityScrapped: 2,
      uom: 'Nos',
      scrapReasonCode: 'SCR-SETUP-TOOL',
      scrapReasonDescription: 'CNC hobbing insert chip-out during final teeth cutting',
      scrapLossAmountINR: 8200,
      reworkHours: 1.5,
      reworkLaborCostINR: 1350,
      costCenterDebit: 'Manufacturing Scrap Expense A/c (CC-CNC-PUNE)',
      status: 'pending'
    },
    qualityResultsSync: {
      fqcNumber: 'FQC-2026-0042',
      inspectionDate: new Date(Date.now() - 4 * 3600 * 1000).toISOString().split('T')[0],
      overallResult: 'pass',
      passedQuantity: 45,
      rejectedQuantity: 2,
      cocNumber: 'COC-2026-0042-TATA',
      inspectorBadgeId: 'QA-INSP-881',
      qualityHoldStatus: 'released',
      coaDocumentRef: 'COA-CERT-SPUR-GEAR-PUNE-01.pdf',
      tallyQualityRemarks: 'Passed 100% teeth pitch error test & magnetic particle inspection. CoC generated.',
      status: 'pending'
    },
    totalOrderCostINR: 103614,
    currency: 'INR'
  },
  {
    id: 'pconf-102',
    tenantId: 'demo',
    workOrderId: 'wo-102',
    workOrderNumber: 'WO-2026-0002',
    salesOrderId: 'so-kirloskar-02',
    salesOrderNumber: 'ORD-2026-0043',
    customerPoNumber: 'PO-KIRLOSKAR-7729',
    customerName: 'Kirloskar Heavy Transmission Systems',
    plantId: 'plant-pune',
    plantName: 'Pune Mega Transmission Plant',
    partCode: 'BOM-FLANGE-HSG-4140',
    partName: 'Precision CNC Flange Housing (AISI 4140)',
    quantityCompleted: 24,
    quantityScrapped: 1,
    uom: 'Nos',
    completionDate: new Date(Date.now() - 8 * 3600 * 1000).toISOString().split('T')[0],
    erpSystem: 'oracle',
    status: 'pending_confirmation',
    completionSync: {
      fgStockItemName: 'Precision CNC Flange Housing (AISI 4140)',
      targetSubinventory: 'FG-VAL-BAY-03 (Pune)',
      fgValuationINR: 342000,
      fgCostPerUnit: 14250,
      status: 'pending'
    },
    materialConsumptionSync: {
      materials: [
        {
          id: 'mat-3',
          itemCode: 'RM-AISI4140-FORG',
          itemName: 'AISI 4140 Forged Casting Blank (Dia 220mm)',
          bomRequiredQty: 25,
          actualConsumedQty: 25,
          uom: 'Nos',
          scrapFactorPct: 4,
          unitCostINR: 5400,
          totalCostINR: 135000,
          lotNumber: 'LOT-CST-4140-990',
          sourceWarehouse: 'HEAVY-CASTING-YARD',
          stockRelieved: false
        }
      ],
      totalMaterialCostINR: 135000,
      status: 'pending'
    },
    scrapReworkSync: {
      quantityScrapped: 1,
      uom: 'Nos',
      scrapReasonCode: 'SCR-CAST-POROSITY',
      scrapReasonDescription: 'Internal subsurface blowhole porosity revealed after CNC boring',
      scrapLossAmountINR: 14250,
      reworkHours: 2.0,
      reworkLaborCostINR: 1800,
      costCenterDebit: 'WIP Scrap & Rework Variance (GL-5400-PUNE-SCRAP)',
      status: 'pending'
    },
    qualityResultsSync: {
      fqcNumber: 'FQC-2026-0043',
      inspectionDate: new Date(Date.now() - 9 * 3600 * 1000).toISOString().split('T')[0],
      overallResult: 'pass',
      passedQuantity: 24,
      rejectedQuantity: 1,
      cocNumber: 'COC-2026-0043-KIRL',
      inspectorBadgeId: 'QA-INSP-904',
      qualityHoldStatus: 'released',
      coaDocumentRef: 'COA-FLANGE-HSG-4140-CERT.pdf',
      tallyQualityRemarks: 'Concentricity & bore runout within 12 microns tolerance verified on CMM.',
      status: 'pending'
    },
    totalOrderCostINR: 151050,
    currency: 'INR'
  },
  {
    id: 'pconf-103',
    tenantId: 'demo',
    workOrderId: 'wo-103',
    workOrderNumber: 'WO-2026-0003',
    salesOrderId: 'so-bharat-03',
    salesOrderNumber: 'ORD-2026-0044',
    customerPoNumber: 'PO-BHARAT-AUTO-6610',
    customerName: 'Bharat Precision Automotives Ltd.',
    plantId: 'plant-vadodara',
    plantName: 'Vadodara Forging Hub',
    partCode: 'SHAFT-SPLINED-45',
    partName: 'Splined Drive Shaft (Dia 45mm x 320mm)',
    quantityCompleted: 32,
    quantityScrapped: 0,
    uom: 'Nos',
    completionDate: new Date(Date.now() - 14 * 3600 * 1000).toISOString().split('T')[0],
    erpSystem: 'tally',
    status: 'confirmed',
    completionSync: {
      voucherNumber: 'TALLY-MFG-2026-0810',
      manufacturingJournalNumber: 'MFG-JRNL-0810',
      fgStockItemName: 'Splined Drive Shaft (Dia 45mm x 320mm)',
      targetSubinventory: 'FG-CENTRAL-STORES',
      fgValuationINR: 96800,
      fgCostPerUnit: 3025,
      status: 'posted',
      postedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
    },
    materialConsumptionSync: {
      consumptionVoucherNumber: 'TALLY-ISSUE-2026-0810',
      materials: [
        {
          id: 'mat-4',
          itemCode: 'RM-EN19-BAR-50',
          itemName: 'EN19 Bright Ground Steel Round Bar Ø50mm',
          bomRequiredQty: 32,
          actualConsumedQty: 32,
          uom: 'Nos',
          scrapFactorPct: 0,
          unitCostINR: 1420,
          totalCostINR: 45440,
          lotNumber: 'LOT-EN19-VAD-411',
          sourceWarehouse: 'VADODARA-RM-BAR-RACK',
          stockRelieved: true,
          erpStockItemRef: 'EN19 ROUND BAR 50MM'
        }
      ],
      totalMaterialCostINR: 45440,
      status: 'posted',
      postedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
    },
    scrapReworkSync: {
      scrapVoucherNumber: 'N/A-ZERO-SCRAP',
      quantityScrapped: 0,
      uom: 'Nos',
      scrapReasonCode: 'NONE',
      scrapReasonDescription: 'Zero scrap - 100% machining first pass yield',
      scrapLossAmountINR: 0,
      reworkHours: 0,
      reworkLaborCostINR: 0,
      costCenterDebit: 'Manufacturing Scrap Expense A/c',
      status: 'posted',
      postedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
    },
    qualityResultsSync: {
      fqcNumber: 'FQC-2026-0044',
      inspectionDate: new Date(Date.now() - 13 * 3600 * 1000).toISOString().split('T')[0],
      overallResult: 'pass',
      passedQuantity: 32,
      rejectedQuantity: 0,
      cocNumber: 'COC-2026-0044-BHARAT',
      inspectorBadgeId: 'QA-INSP-771',
      qualityHoldStatus: 'released',
      coaDocumentRef: 'COA-SPLINED-SHAFT-VAD.pdf',
      tallyQualityRemarks: 'All 32 splines gauge-fit verified against master go/no-go ring gage.',
      status: 'posted',
      postedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
    },
    totalOrderCostINR: 45440,
    currency: 'INR',
    lastSyncedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    syncedBy: 'Finance Controller (Auto-Sync)'
  }
];

export const productionConfirmationSyncService = {
  /**
   * Retrieves all production confirmation records for the tenant
   */
  getConfirmations(tenantId: string): ProductionConfirmationRecord[] {
    try {
      const cached = localStorage.getItem(`${STORAGE_KEY}_${tenantId}`);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn('Error reading cached production confirmations:', e);
    }
    this.saveConfirmations(tenantId, INITIAL_CONFIRMATIONS);
    return INITIAL_CONFIRMATIONS;
  },

  /**
   * Saves confirmations array
   */
  saveConfirmations(tenantId: string, records: ProductionConfirmationRecord[]): void {
    try {
      localStorage.setItem(`${STORAGE_KEY}_${tenantId}`, JSON.stringify(records));
      window.dispatchEvent(new Event('production_confirmation_updated'));
    } catch (e) {
      console.warn('Error writing cached production confirmations:', e);
    }
  },

  /**
   * Retrieves ERP posting configuration
   */
  getConfig(tenantId: string): ConfirmationPostingConfig {
    try {
      const cached = localStorage.getItem(`${CONFIG_KEY}_${tenantId}`);
      if (cached) return JSON.parse(cached);
    } catch {
      // fallback
    }
    return DEFAULT_CONFIG;
  },

  /**
   * Saves ERP posting configuration
   */
  saveConfig(tenantId: string, config: ConfirmationPostingConfig): void {
    try {
      localStorage.setItem(`${CONFIG_KEY}_${tenantId}`, JSON.stringify(config));
    } catch (e) {
      console.warn('Error saving config:', e);
    }
  },

  /**
   * Generates Tally Prime XML for Manufacturing Journal / Production Confirmation
   */
  generateTallyMfgJournalXml(record: ProductionConfirmationRecord, config: ConfirmationPostingConfig): string {
    const dateFormatted = record.completionDate.replace(/-/g, '');
    const voucherNo = record.completionSync.voucherNumber || `TALLY-MFG-${Date.now().toString().slice(-6)}`;
    
    return `<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>Apex Precision Manufacturing Ltd.</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="${config.tallyConfig.mfgJournalVoucherType}" ACTION="Create">
            <DATE>${dateFormatted}</DATE>
            <VOUCHERTYPENAME>${config.tallyConfig.mfgJournalVoucherType}</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${voucherNo}</VOUCHERNUMBER>
            <REFERENCE>${record.workOrderNumber} / SO: ${record.salesOrderNumber}</REFERENCE>
            <PARTYNAME>${record.customerName}</PARTYNAME>
            <NARRATION>Production Completion for Work Order ${record.workOrderNumber}. FQC CoC: ${record.qualityResultsSync.cocNumber}. Inspector: ${record.qualityResultsSync.inspectorBadgeId}. ${record.qualityResultsSync.tallyQualityRemarks}</NARRATION>
            
            <!-- 1. FINISHED GOODS RECEIPT (Debit FG Inventory) -->
            <INVENTORYENTRIES.LIST>
              <STOCKITEMNAME>${record.completionSync.fgStockItemName}</STOCKITEMNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <RATE>${record.completionSync.fgCostPerUnit}</RATE>
              <AMOUNT>-${record.completionSync.fgValuationINR}</AMOUNT>
              <ACTUALQTY>${record.quantityCompleted} ${record.uom}</ACTUALQTY>
              <BILLEDQTY>${record.quantityCompleted} ${record.uom}</BILLEDQTY>
              <BATCHALLOCATIONS.LIST>
                <GODOWNNAME>${record.completionSync.targetSubinventory}</GODOWNNAME>
                <BATCHNAME>LOT-${record.workOrderNumber}</BATCHNAME>
                <AMOUNT>-${record.completionSync.fgValuationINR}</AMOUNT>
                <ACTUALQTY>${record.quantityCompleted} ${record.uom}</ACTUALQTY>
              </BATCHALLOCATIONS.LIST>
            </INVENTORYENTRIES.LIST>

            <!-- 2. RAW MATERIAL CONSUMPTION BACKFLUSH (Credit RM Stores) -->
            ${record.materialConsumptionSync.materials.map(m => `
            <INVENTORYENTRIESIN.LIST>
              <STOCKITEMNAME>${m.itemName}</STOCKITEMNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <RATE>${m.unitCostINR}</RATE>
              <AMOUNT>${m.totalCostINR}</AMOUNT>
              <ACTUALQTY>${m.actualConsumedQty} ${m.uom}</ACTUALQTY>
              <BILLEDQTY>${m.actualConsumedQty} ${m.uom}</BILLEDQTY>
              <BATCHALLOCATIONS.LIST>
                <GODOWNNAME>${m.sourceWarehouse}</GODOWNNAME>
                <BATCHNAME>${m.lotNumber}</BATCHNAME>
                <AMOUNT>${m.totalCostINR}</AMOUNT>
                <ACTUALQTY>${m.actualConsumedQty} ${m.uom}</ACTUALQTY>
              </BATCHALLOCATIONS.LIST>
            </INVENTORYENTRIESIN.LIST>`).join('')}

            <!-- 3. SCRAP & REWORK POSTING -->
            ${record.quantityScrapped > 0 ? `
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${config.tallyConfig.scrapExpenseLedger}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${record.scrapReworkSync.scrapLossAmountINR}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>` : ''}

            <!-- 4. QUALITY AUDIT STAMP -->
            <UDF:FLOWOPS_FQC_REF.LIST DESC="Quality Inspection Number">
              <UDF:FLOWOPS_FQC_REF>${record.qualityResultsSync.fqcNumber}</UDF:FLOWOPS_FQC_REF>
            </UDF:FLOWOPS_FQC_REF.LIST>
            <UDF:FLOWOPS_COC_NUMBER.LIST DESC="Certificate of Conformance">
              <UDF:FLOWOPS_COC_NUMBER>${record.qualityResultsSync.cocNumber}</UDF:FLOWOPS_COC_NUMBER>
            </UDF:FLOWOPS_COC_NUMBER.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
  },

  /**
   * Generates Oracle Cloud SCM REST payload for WIP Completion
   */
  generateOracleWipTxnJson(record: ProductionConfirmationRecord, config: ConfirmationPostingConfig): string {
    return JSON.stringify({
      TransactionType: "WipCompletionAndReturn",
      OrganizationCode: config.oracleConfig.inventoryOrgCode,
      WorkOrderNumber: record.workOrderNumber,
      InventoryItemNumber: record.partCode,
      TransactionQuantity: record.quantityCompleted,
      TransactionUnitOfMeasure: record.uom,
      SubinventoryCode: config.oracleConfig.wipCompletionSubinventory,
      TransactionDate: new Date().toISOString(),
      LotNumber: `LOT-${record.workOrderNumber}`,
      QualityInspection: {
        FqcNumber: record.qualityResultsSync.fqcNumber,
        InspectionResult: record.qualityResultsSync.overallResult.toUpperCase(),
        PassedQuantity: record.qualityResultsSync.passedQuantity,
        CertificateOfConformance: record.qualityResultsSync.cocNumber,
        InspectorId: record.qualityResultsSync.inspectorBadgeId,
        Disposition: record.qualityResultsSync.qualityHoldStatus
      },
      ComponentIssuesBackflush: record.materialConsumptionSync.materials.map(m => ({
        ComponentItemNumber: m.itemCode,
        IssueQuantity: m.actualConsumedQty,
        UnitOfMeasure: m.uom,
        SupplySubinventory: m.sourceWarehouse,
        LotNumber: m.lotNumber,
        UnitCostINR: m.unitCostINR
      })),
      ScrapAccounting: {
        ScrappedQuantity: record.quantityScrapped,
        ReasonCode: record.scrapReworkSync.scrapReasonCode,
        ScrapCostVarianceAmount: record.scrapReworkSync.scrapLossAmountINR,
        CostCenterDebitAccount: config.oracleConfig.scrapCostCenterAccount,
        ReworkLaborOverheadAmount: record.scrapReworkSync.reworkLaborCostINR
      }
    }, null, 2);
  },

  /**
   * Generates SAP S/4HANA OData / BAPI payload for Production Confirmation
   */
  generateSapGoodsReceiptJson(record: ProductionConfirmationRecord, config: ConfirmationPostingConfig): string {
    return JSON.stringify({
      bapi: "BAPI_PRODORD_CONFIRM_BATCH",
      OrderNumber: record.workOrderNumber,
      Plant: config.sapConfig.plantCode,
      Material: record.partCode,
      MovementType: "101", // GR for Production Order
      YieldQuantity: record.quantityCompleted,
      ScrapQuantity: record.quantityScrapped,
      StorageLocation: config.sapConfig.storageLocationFg,
      PostingDate: record.completionDate,
      QualityNotification: {
        InspectionLot: record.qualityResultsSync.fqcNumber,
        UsageDecision: record.qualityResultsSync.overallResult === 'pass' ? "A" : "R",
        CertificateReference: record.qualityResultsSync.cocNumber
      },
      GoodsIssue261: record.materialConsumptionSync.materials.map(m => ({
        ComponentMaterial: m.itemCode,
        Quantity: m.actualConsumedQty,
        StorageLocation: config.sapConfig.storageLocationRm,
        Batch: m.lotNumber
      })),
      CostVariancePosting: {
        CostCenter: config.sapConfig.costCenterCode,
        ScrapAmountINR: record.scrapReworkSync.scrapLossAmountINR,
        ReworkHours: record.scrapReworkSync.reworkHours
      }
    }, null, 2);
  },

  /**
   * Acceptance Criteria 1: Push Production Completion (Finished Goods Receipt)
   */
  async pushProductionCompletion(tenantId: string, confirmationId: string): Promise<ProductionConfirmationRecord> {
    const list = this.getConfirmations(tenantId);
    const idx = list.findIndex(r => r.id === confirmationId);
    if (idx === -1) throw new Error('Confirmation record not found');

    const rec = list[idx];
    const voucherRef = `${rec.erpSystem.toUpperCase()}-FG-${Date.now().toString().slice(-6)}`;

    const updated: ProductionConfirmationRecord = {
      ...rec,
      completionSync: {
        ...rec.completionSync,
        voucherNumber: voucherRef,
        manufacturingJournalNumber: `MFG-${voucherRef}`,
        status: 'posted',
        postedAt: new Date().toISOString()
      },
      status: (rec.materialConsumptionSync.status === 'posted' && rec.qualityResultsSync.status === 'posted')
        ? 'confirmed'
        : 'partially_synced',
      lastSyncedAt: new Date().toISOString(),
      syncedBy: 'Finance Manager'
    };

    list[idx] = updated;
    this.saveConfirmations(tenantId, list);
    return updated;
  },

  /**
   * Acceptance Criteria 2: Push Material Consumption (Backflushing)
   */
  async pushMaterialConsumption(tenantId: string, confirmationId: string): Promise<ProductionConfirmationRecord> {
    const list = this.getConfirmations(tenantId);
    const idx = list.findIndex(r => r.id === confirmationId);
    if (idx === -1) throw new Error('Confirmation record not found');

    const rec = list[idx];
    const voucherRef = `${rec.erpSystem.toUpperCase()}-RM-ISSUE-${Date.now().toString().slice(-6)}`;

    const updatedMaterials = rec.materialConsumptionSync.materials.map(m => ({
      ...m,
      stockRelieved: true,
      erpStockItemRef: m.itemName.toUpperCase()
    }));

    const updated: ProductionConfirmationRecord = {
      ...rec,
      materialConsumptionSync: {
        ...rec.materialConsumptionSync,
        consumptionVoucherNumber: voucherRef,
        materials: updatedMaterials,
        status: 'posted',
        postedAt: new Date().toISOString()
      },
      status: (rec.completionSync.status === 'posted' && rec.qualityResultsSync.status === 'posted')
        ? 'confirmed'
        : 'partially_synced',
      lastSyncedAt: new Date().toISOString(),
      syncedBy: 'Finance Manager'
    };

    list[idx] = updated;
    this.saveConfirmations(tenantId, list);
    return updated;
  },

  /**
   * Acceptance Criteria 3: Push Scrap & Rework Costing
   */
  async pushScrapRework(tenantId: string, confirmationId: string): Promise<ProductionConfirmationRecord> {
    const list = this.getConfirmations(tenantId);
    const idx = list.findIndex(r => r.id === confirmationId);
    if (idx === -1) throw new Error('Confirmation record not found');

    const rec = list[idx];
    const voucherRef = rec.quantityScrapped > 0 
      ? `${rec.erpSystem.toUpperCase()}-SCRAP-EXP-${Date.now().toString().slice(-6)}`
      : 'N/A-ZERO-SCRAP';

    const updated: ProductionConfirmationRecord = {
      ...rec,
      scrapReworkSync: {
        ...rec.scrapReworkSync,
        scrapVoucherNumber: voucherRef,
        status: 'posted',
        postedAt: new Date().toISOString()
      },
      lastSyncedAt: new Date().toISOString(),
      syncedBy: 'Finance Manager'
    };

    list[idx] = updated;
    this.saveConfirmations(tenantId, list);
    return updated;
  },

  /**
   * Acceptance Criteria 4: Push Quality Results
   */
  async pushQualityResults(tenantId: string, confirmationId: string): Promise<ProductionConfirmationRecord> {
    const list = this.getConfirmations(tenantId);
    const idx = list.findIndex(r => r.id === confirmationId);
    if (idx === -1) throw new Error('Confirmation record not found');

    const rec = list[idx];

    const updated: ProductionConfirmationRecord = {
      ...rec,
      qualityResultsSync: {
        ...rec.qualityResultsSync,
        status: 'posted',
        postedAt: new Date().toISOString()
      },
      status: (rec.completionSync.status === 'posted' && rec.materialConsumptionSync.status === 'posted')
        ? 'confirmed'
        : 'partially_synced',
      lastSyncedAt: new Date().toISOString(),
      syncedBy: 'Finance Manager'
    };

    list[idx] = updated;
    this.saveConfirmations(tenantId, list);
    return updated;
  },

  /**
   * Master Push: Executes all 4 confirmation pillars in an integrated atomic synchronization
   */
  async pushFullProductionConfirmation(
    tenantId: string, 
    confirmationId: string,
    actorName: string = 'Finance Manager'
  ): Promise<ProductionConfirmationRecord> {
    const list = this.getConfirmations(tenantId);
    const idx = list.findIndex(r => r.id === confirmationId);
    if (idx === -1) throw new Error('Confirmation record not found');

    const rec = list[idx];
    const config = this.getConfig(tenantId);

    // Generate specific ERP payload
    let payload = '';
    const voucherPrefix = rec.erpSystem.toUpperCase();
    const fgVoucher = `${voucherPrefix}-MFG-${Date.now().toString().slice(-6)}`;
    const rmVoucher = `${voucherPrefix}-ISSUE-${Date.now().toString().slice(-6)}`;
    const scrapVoucher = rec.quantityScrapped > 0 
      ? `${voucherPrefix}-SCRAP-${Date.now().toString().slice(-6)}` 
      : 'N/A-ZERO-SCRAP';

    if (rec.erpSystem === 'tally') {
      payload = this.generateTallyMfgJournalXml({
        ...rec,
        completionSync: { ...rec.completionSync, voucherNumber: fgVoucher }
      }, config);
    } else if (rec.erpSystem === 'oracle') {
      payload = this.generateOracleWipTxnJson(rec, config);
    } else {
      payload = this.generateSapGoodsReceiptJson(rec, config);
    }

    const updatedMaterials = rec.materialConsumptionSync.materials.map(m => ({
      ...m,
      stockRelieved: true,
      erpStockItemRef: m.itemName.toUpperCase()
    }));

    const nowIso = new Date().toISOString();

    const updatedRecord: ProductionConfirmationRecord = {
      ...rec,
      status: 'confirmed',
      completionSync: {
        ...rec.completionSync,
        voucherNumber: fgVoucher,
        manufacturingJournalNumber: `MFG-JRNL-${Date.now().toString().slice(-4)}`,
        status: 'posted',
        postedAt: nowIso
      },
      materialConsumptionSync: {
        ...rec.materialConsumptionSync,
        consumptionVoucherNumber: rmVoucher,
        materials: updatedMaterials,
        status: 'posted',
        postedAt: nowIso
      },
      scrapReworkSync: {
        ...rec.scrapReworkSync,
        scrapVoucherNumber: scrapVoucher,
        status: 'posted',
        postedAt: nowIso
      },
      qualityResultsSync: {
        ...rec.qualityResultsSync,
        status: 'posted',
        postedAt: nowIso
      },
      erpPayloadXmlOrJson: payload,
      lastSyncedAt: nowIso,
      syncedBy: actorName
    };

    list[idx] = updatedRecord;
    this.saveConfirmations(tenantId, list);
    return updatedRecord;
  },

  /**
   * Bulk push all pending production confirmations
   */
  async bulkPushAllPending(tenantId: string, actorName: string = 'Finance Manager'): Promise<ProductionConfirmationRecord[]> {
    const list = this.getConfirmations(tenantId);
    const pending = list.filter(r => r.status === 'pending_confirmation' || r.status === 'partially_synced');
    const updatedList: ProductionConfirmationRecord[] = [];

    for (const item of pending) {
      const res = await this.pushFullProductionConfirmation(tenantId, item.id, actorName);
      updatedList.push(res);
    }

    return updatedList;
  },

  /**
   * Computes KPI statistics for the dashboard
   */
  getStats(tenantId: string): ProductionConfirmationStats {
    const list = this.getConfirmations(tenantId);
    const pendingConfirmationsCount = list.filter(r => r.status === 'pending_confirmation' || r.status === 'partially_synced').length;
    const confirmedCount = list.filter(r => r.status === 'confirmed').length;

    const totalFgValuationINR = list
      .filter(r => r.completionSync.status === 'posted')
      .reduce((sum, r) => sum + r.completionSync.fgValuationINR, 0);

    const totalMaterialRelievedINR = list
      .filter(r => r.materialConsumptionSync.status === 'posted')
      .reduce((sum, r) => sum + r.materialConsumptionSync.totalMaterialCostINR, 0);

    const totalScrapBookedINR = list
      .filter(r => r.scrapReworkSync.status === 'posted')
      .reduce((sum, r) => sum + r.scrapReworkSync.scrapLossAmountINR, 0);

    const passCount = list.filter(r => r.qualityResultsSync.overallResult === 'pass').length;
    const qualityPassedPct = list.length > 0 ? Math.round((passCount / list.length) * 100) : 100;

    return {
      pendingConfirmationsCount,
      confirmedCount,
      totalFgValuationINR,
      totalMaterialRelievedINR,
      totalScrapBookedINR,
      qualityPassedPct
    };
  }
};
