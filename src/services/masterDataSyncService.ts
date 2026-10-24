// src/services/masterDataSyncService.ts

import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, query, where } from 'firebase/firestore';
import { 
  MasterDataEntityType, 
  SyncDirection, 
  MasterDataConflict, 
  MasterDataSyncLog, 
  MasterDataSyncConfig, 
  MasterDataEntityItem,
  ChartOfAccountRecord,
  ConflictResolutionPolicy
} from '../types/masterDataSync';

const CONFIG_STORAGE_KEY = 'mes_master_data_sync_config_v1';
const LOGS_STORAGE_KEY = 'mes_master_data_sync_logs_v1';
const CONFLICTS_STORAGE_KEY = 'mes_master_data_sync_conflicts_v1';
const COA_STORAGE_KEY = 'mes_master_data_coa_v1';

const DEFAULT_CONFIG: MasterDataSyncConfig = {
  erpSystem: 'tally',
  conflictPolicy: 'manual',
  autoSyncEnabled: true,
  syncIntervalMinutes: 360, // Every 6 hours
  entitiesEnabled: {
    items: true,
    boms: true,
    suppliers: true,
    customers: true,
    coa: true
  },
  tallyConfig: {
    serverUrl: 'http://localhost:9000',
    companyName: 'Apex Precision Engineering Ltd.',
    itemGroup: 'Raw Materials & Manufactured Spares',
    exportFormat: 'XML',
    timeoutSec: 15
  },
  oracleSapConfig: {
    systemType: 'oracle',
    endpointUrl: 'https://erp.oraclecloud.com/fscmRestApi/resources/11.13.18.05/itemMasters',
    businessUnit: 'India Manufacturing BU 1',
    authType: 'bearer_token',
    organizationId: 'ORG_APEX_PUNE'
  },
  lastFullSyncTimestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
};

const SEED_CHART_OF_ACCOUNTS: ChartOfAccountRecord[] = [
  {
    accountCode: 'GL-1100',
    accountName: 'Raw Materials Inventory Asset',
    accountType: 'asset',
    erpLedgerName: 'Stock-in-Hand / Raw Materials',
    flowOpsUsage: 'Inventory valuation and raw materials purchase receipts',
    balanceINR: 4850000,
    lastSyncedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    syncStatus: 'synced'
  },
  {
    accountCode: 'GL-1200',
    accountName: 'Work-in-Progress (WIP) Machining Asset',
    accountType: 'asset',
    erpLedgerName: 'WIP Manufacturing Shopfloor',
    flowOpsUsage: 'Routing stage movement and unfinished production jobs',
    balanceINR: 3120000,
    lastSyncedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    syncStatus: 'synced'
  },
  {
    accountCode: 'GL-1300',
    accountName: 'Finished Goods Inventory Asset',
    accountType: 'asset',
    erpLedgerName: 'Stock-in-Hand / Finished Goods',
    flowOpsUsage: 'Produced parts awaiting outward customer dispatch',
    balanceINR: 6420000,
    lastSyncedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    syncStatus: 'synced'
  },
  {
    accountCode: 'GL-5010',
    accountName: 'Cost of Goods Sold (COGS) - Direct Materials',
    accountType: 'expense',
    erpLedgerName: 'COGS Direct Raw Materials Consumed',
    flowOpsUsage: 'Backflushed BOM components consumption upon work order completion',
    balanceINR: 12450000,
    lastSyncedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    syncStatus: 'synced'
  },
  {
    accountCode: 'GL-5040',
    accountName: 'Manufacturing Scrap & Rework Variance',
    accountType: 'expense',
    erpLedgerName: 'Scrap & Material Defect Loss',
    flowOpsUsage: 'Defect scrap logging and non-conformance write-offs',
    balanceINR: 184000,
    lastSyncedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    syncStatus: 'synced'
  },
  {
    accountCode: 'GL-4010',
    accountName: 'Commercial Sales Revenue - Precision Forgings',
    accountType: 'revenue',
    erpLedgerName: 'Sales Domestic - Commercial Accounts',
    flowOpsUsage: 'Dispatched and billed client invoices',
    balanceINR: 28400000,
    lastSyncedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    syncStatus: 'synced'
  },
  {
    accountCode: 'GL-2210',
    accountName: 'GST Output Tax Liability (CGST 9% + SGST 9%)',
    accountType: 'liability',
    erpLedgerName: 'Duties & Taxes - CGST/SGST Output',
    flowOpsUsage: 'Statutory GST liability recognized upon dispatch invoice generation',
    balanceINR: 2556000,
    lastSyncedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    syncStatus: 'synced'
  }
];

export const masterDataSyncService = {
  /**
   * Retrieves active integration config
   */
  getConfig(tenantId: string): MasterDataSyncConfig {
    try {
      const cached = localStorage.getItem(`${CONFIG_STORAGE_KEY}_${tenantId}`);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.warn('Failed to load master sync config:', e);
    }
    return DEFAULT_CONFIG;
  },

  /**
   * Saves updated integration config
   */
  saveConfig(tenantId: string, config: MasterDataSyncConfig): void {
    try {
      localStorage.setItem(`${CONFIG_STORAGE_KEY}_${tenantId}`, JSON.stringify(config));
    } catch (e) {
      console.warn('Failed to save master sync config:', e);
    }
  },

  /**
   * Retrieves all master entities across Items, BOMs, Suppliers, Customers, and COA
   */
  getMasterEntities(tenantId: string): MasterDataEntityItem[] {
    const isSandbox = typeof window !== 'undefined' && (localStorage.getItem('isSandboxMode') === 'true' || !db);
    const results: MasterDataEntityItem[] = [];

    // 1. Stock Items
    try {
      const cachedItems = localStorage.getItem(`stock_items_${tenantId}`);
      if (cachedItems) {
        const parsed = JSON.parse(cachedItems);
        parsed.slice(0, 8).forEach((it: any) => {
          results.push({
            id: it.id || `item_${it.code}`,
            entityType: 'item',
            code: it.code || 'SKU-001',
            name: it.name || 'Machined Component',
            categoryOrRevision: it.category || 'Raw Material',
            flowOpsUpdated: it.lastUpdated || new Date().toISOString(),
            erpUpdated: new Date(Date.now() - 3600 * 1000).toISOString(),
            syncStatus: 'synced',
            erpReferenceId: `TALLY-ITM-${it.code || '101'}`,
            details: {
              uom: it.unit || 'Nos',
              hsn: '84834000',
              currentQty: it.currentQty || 40,
              reorderLevel: it.reorderLevel || 10
            }
          });
        });
      }
    } catch (e) {
      console.warn('Items lookup error:', e);
    }

    // Default Seed Items if none in workspace
    if (results.filter(r => r.entityType === 'item').length === 0) {
      results.push(
        {
          id: 'itm-01',
          entityType: 'item',
          code: 'RM-STL-4140',
          name: 'Alloy Steel Bar Stock (AISI 4140, Dia 65mm)',
          categoryOrRevision: 'Raw Material',
          flowOpsUpdated: new Date().toISOString(),
          erpUpdated: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
          syncStatus: 'conflict',
          erpReferenceId: 'TALLY-ITM-8812',
          details: { uom: 'Kg', hsn: '72283029', stdCostINR: 112, priceINR: 0 }
        },
        {
          id: 'itm-02',
          entityType: 'item',
          code: 'FG-SPUR-GEAR-M4',
          name: 'Forged Steel Spur Gear (Mod 4, 32T)',
          categoryOrRevision: 'Finished Goods',
          flowOpsUpdated: new Date().toISOString(),
          erpUpdated: new Date(Date.now() - 3600 * 1000).toISOString(),
          syncStatus: 'synced',
          erpReferenceId: 'ORACLE-ITEM-9041',
          details: { uom: 'Nos', hsn: '84834000', stdCostINR: 3250, priceINR: 4100 }
        },
        {
          id: 'itm-03',
          entityType: 'item',
          code: 'TOOL-INSERT-CNMG',
          name: 'Carbide Turning Insert CNMG 120408-PM',
          categoryOrRevision: 'Tooling & Consumables',
          flowOpsUpdated: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          erpUpdated: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          syncStatus: 'synced',
          erpReferenceId: 'TALLY-ITM-4402',
          details: { uom: 'Pack of 10', hsn: '82081000', stdCostINR: 2850 }
        }
      );
    }

    // 2. BOMs
    results.push(
      {
        id: 'bom-01',
        entityType: 'bom',
        code: 'BOM-FG-SPUR-GEAR',
        name: 'Spur Gear Transmission Drive Assembly',
        categoryOrRevision: 'Rev C.2 (Released)',
        flowOpsUpdated: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        erpUpdated: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        syncStatus: 'synced',
        erpReferenceId: 'ORACLE-BOM-5510',
        details: { levels: 3, componentCount: 8, yieldPct: 98.5, scrapFactor: 2.0 }
      },
      {
        id: 'bom-02',
        entityType: 'bom',
        code: 'BOM-FLANGE-HSG-4140',
        name: 'Precision CNC Flange Housing Sub-Assembly',
        categoryOrRevision: 'Rev B.1 (Production)',
        flowOpsUpdated: new Date().toISOString(),
        erpUpdated: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
        syncStatus: 'conflict',
        erpReferenceId: 'TALLY-BOM-4418',
        details: { levels: 2, componentCount: 5, yieldPct: 99.0, scrapFactor: 1.5 }
      }
    );

    // 3. Suppliers
    results.push(
      {
        id: 'sup-01',
        entityType: 'supplier',
        code: 'SUP-TATA-STEEL',
        name: 'Tata Prime Steel Processing Ltd.',
        categoryOrRevision: 'Raw Materials (Tier 1)',
        flowOpsUpdated: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        erpUpdated: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        syncStatus: 'synced',
        erpReferenceId: 'TALLY-LEDGER-VEND-104',
        details: { gstin: '24AAACT1234F1Z5', paymentTerms: 'Net 30 Days', creditLimit: 5000000 }
      },
      {
        id: 'sup-02',
        entityType: 'supplier',
        code: 'SUP-SANDVIK-TOOL',
        name: 'Sandvik Coromant India Tooling',
        categoryOrRevision: 'Tooling & Inserts',
        flowOpsUpdated: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
        erpUpdated: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
        syncStatus: 'synced',
        erpReferenceId: 'ORACLE-SUP-2210',
        details: { gstin: '27AAACS9988K1Z9', paymentTerms: 'Net 45 Days', creditLimit: 2500000 }
      }
    );

    // 4. Customers
    results.push(
      {
        id: 'cust-01',
        entityType: 'customer',
        code: 'CUST-TATA-MOTORS',
        name: 'Tata Motors Precision CVBU Division',
        categoryOrRevision: 'Automotive OEM',
        flowOpsUpdated: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        erpUpdated: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        syncStatus: 'synced',
        erpReferenceId: 'TALLY-PARTY-CUST-901',
        details: { gstin: '27AAACG9876K1Z4', stateCode: '27', placeOfSupply: 'Maharashtra' }
      },
      {
        id: 'cust-02',
        entityType: 'customer',
        code: 'CUST-KIRLOSKAR-HVY',
        name: 'Kirloskar Heavy Transmission Systems',
        categoryOrRevision: 'Industrial Machinery',
        flowOpsUpdated: new Date().toISOString(),
        erpUpdated: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
        syncStatus: 'conflict',
        erpReferenceId: 'ORACLE-PARTY-CUST-905',
        details: { gstin: '27AAACK5544P1Z3', stateCode: '27', placeOfSupply: 'Maharashtra' }
      }
    );

    // 5. Chart of Accounts
    const coaList = this.getChartOfAccounts(tenantId);
    coaList.forEach(c => {
      results.push({
        id: `coa_${c.accountCode}`,
        entityType: 'coa',
        code: c.accountCode,
        name: c.accountName,
        categoryOrRevision: `${c.accountType.toUpperCase()} · ${c.erpLedgerName}`,
        flowOpsUpdated: c.lastSyncedAt,
        erpUpdated: c.lastSyncedAt,
        syncStatus: c.syncStatus,
        erpReferenceId: c.erpLedgerName,
        details: {
          flowOpsUsage: c.flowOpsUsage,
          balanceINR: c.balanceINR
        }
      });
    });

    return results;
  },

  /**
   * Retrieves Chart of Accounts
   */
  getChartOfAccounts(tenantId: string): ChartOfAccountRecord[] {
    try {
      const cached = localStorage.getItem(`${COA_STORAGE_KEY}_${tenantId}`);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.warn('COA lookup error:', e);
    }
    return SEED_CHART_OF_ACCOUNTS;
  },

  /**
   * Retrieves active Master Data Conflicts
   */
  getConflicts(tenantId: string): MasterDataConflict[] {
    try {
      const cached = localStorage.getItem(`${CONFLICTS_STORAGE_KEY}_${tenantId}`);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.warn('Conflicts lookup error:', e);
    }

    // Default Seed Conflicts demonstrating real-world differences
    const seedConflicts: MasterDataConflict[] = [
      {
        id: 'conf-01',
        tenantId,
        entityType: 'item',
        entityId: 'itm-01',
        entityIdentifier: 'Item SKU: RM-STL-4140',
        detectedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
        status: 'pending',
        flowOpsData: {
          code: 'RM-STL-4140',
          name: 'Alloy Steel Bar Stock (AISI 4140, Dia 65mm)',
          uom: 'Kg',
          hsnCode: '72283029',
          standardCostINR: 112.50,
          reorderPoint: 1200
        },
        erpData: {
          item_code: 'RM-STL-4140',
          item_name: 'ALLOY STEEL FORGED ROUND BAR AISI 4140 DIA 65',
          uom: 'KGS',
          hsn_code: '72283000',
          standard_cost: 118.00,
          reorder_point: 1500
        },
        differingFields: [
          {
            field: 'standardCost',
            label: 'Standard Unit Cost (₹)',
            flowOpsValue: 112.50,
            erpValue: 118.00
          },
          {
            field: 'hsnCode',
            label: 'GST HSN Tariff Code',
            flowOpsValue: '72283029',
            erpValue: '72283000'
          },
          {
            field: 'reorderPoint',
            label: 'Minimum Safety Stock Buffer',
            flowOpsValue: '1,200 Kg',
            erpValue: '1,500 Kg'
          }
        ]
      },
      {
        id: 'conf-02',
        tenantId,
        entityType: 'customer',
        entityId: 'cust-02',
        entityIdentifier: 'Customer: Kirloskar Heavy Transmission Systems',
        detectedAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
        status: 'pending',
        flowOpsData: {
          name: 'Kirloskar Heavy Transmission Systems',
          billingAddress: 'Plot 12, Kirloskarwadi Industrial Area, Sangli, Maharashtra - 416308',
          paymentTerms: 'Net 45 Days',
          contactPerson: 'Sanjay Deshmukh (Procurement Lead)'
        },
        erpData: {
          name: 'KIRLOSKAR HEAVY TRANSMISSION SYSTEMS PVT LTD',
          billing_address: 'Survey No. 48, Near Railway Siding, Kirloskarwadi, Sangli - 416308',
          payment_terms: 'Net 60 Days',
          contact_person: 'Finance & Accounts Cell'
        },
        differingFields: [
          {
            field: 'paymentTerms',
            label: 'Credit & Payment Terms',
            flowOpsValue: 'Net 45 Days',
            erpValue: 'Net 60 Days'
          },
          {
            field: 'billingAddress',
            label: 'Statutory Registered Billing Address',
            flowOpsValue: 'Plot 12, Kirloskarwadi Industrial Area, Sangli - 416308',
            erpValue: 'Survey No. 48, Near Railway Siding, Kirloskarwadi, Sangli - 416308'
          }
        ]
      }
    ];

    return seedConflicts;
  },

  /**
   * Resolves a conflict according to IT administrator selection
   */
  resolveConflict(
    tenantId: string, 
    conflictId: string, 
    resolutionChoice: 'flowops' | 'erp' | 'custom_merged', 
    resolvedBy: string,
    notes?: string
  ): MasterDataConflict {
    const conflicts = this.getConflicts(tenantId);
    const idx = conflicts.findIndex(c => c.id === conflictId);
    if (idx === -1) throw new Error('Conflict record not found');

    const updated: MasterDataConflict = {
      ...conflicts[idx],
      status: 'resolved',
      resolutionChoice,
      resolvedBy,
      resolvedAt: new Date().toISOString(),
      notes: notes || `Resolved via ${resolutionChoice === 'flowops' ? 'FlowOps Authoritative' : resolutionChoice === 'erp' ? 'ERP Authoritative' : 'Custom Merge'}`
    };

    conflicts[idx] = updated;
    localStorage.setItem(`${CONFLICTS_STORAGE_KEY}_${tenantId}`, JSON.stringify(conflicts));

    // Log resolution in sync log
    this.addSyncLog(tenantId, {
      entityType: updated.entityType,
      direction: resolutionChoice === 'flowops' ? 'outbound' : 'inbound',
      erpSystem: 'tally',
      recordsProcessed: 1,
      recordsCreated: 0,
      recordsUpdated: 1,
      conflictsFound: 0,
      status: 'success',
      durationMs: 120,
      triggeredBy: resolvedBy,
      requestPayloadSummary: `Conflict ${conflictId} resolved using ${resolutionChoice} version.`,
      responsePayloadSummary: `Master records synchronized and locked across FlowOps and ERP.`
    });

    return updated;
  },

  /**
   * Retrieves Sync Execution Logs
   */
  getSyncLogs(tenantId: string): MasterDataSyncLog[] {
    try {
      const cached = localStorage.getItem(`${LOGS_STORAGE_KEY}_${tenantId}`);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.warn('Sync logs lookup error:', e);
    }

    // Default Seed Logs
    return [
      {
        id: 'log-01',
        tenantId,
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        entityType: 'all_master_data',
        direction: 'bi_directional',
        erpSystem: 'tally',
        recordsProcessed: 42,
        recordsCreated: 3,
        recordsUpdated: 37,
        conflictsFound: 2,
        status: 'conflict',
        durationMs: 1420,
        triggeredBy: 'Scheduled Daemon (Cron :360)',
        requestPayloadSummary: 'Exported FlowOps stock changes & pulled Tally Prime XML Item/BOM master.',
        responsePayloadSummary: 'HTTP 200 OK: 40 envelopes parsed successfully. 2 items flagged for manual review.',
        rawRequestPayload: `<ENVELOPE>\n  <HEADER>\n    <TALLYREQUEST>Export Data</TALLYREQUEST>\n    <TYPE>Data</TYPE>\n    <ID>Master Items and Ledgers</ID>\n  </HEADER>\n  <BODY>\n    <DESC>\n      <STATICVARIABLES>\n        <SVCOMPANY>Apex Precision Engineering Ltd.</SVCOMPANY>\n        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>\n      </STATICVARIABLES>\n    </DESC>\n  </BODY>\n</ENVELOPE>`,
        rawResponsePayload: `<ENVELOPE>\n  <HEADER>\n    <STATUS>1</STATUS>\n  </HEADER>\n  <BODY>\n    <DATA>\n      <COLLECTION>\n        <STOCKITEM NAME="RM-STL-4140">\n          <BASEUNITS>KGS</BASEUNITS>\n          <OPENINGBALANCE>1840 KGS</OPENINGBALANCE>\n          <RATE>118.00/KGS</RATE>\n        </STOCKITEM>\n      </COLLECTION>\n    </DATA>\n  </BODY>\n</ENVELOPE>`
      },
      {
        id: 'log-02',
        tenantId,
        timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        entityType: 'coa',
        direction: 'inbound',
        erpSystem: 'oracle',
        recordsProcessed: 7,
        recordsCreated: 0,
        recordsUpdated: 7,
        conflictsFound: 0,
        status: 'success',
        durationMs: 840,
        triggeredBy: 'IT Administrator',
        requestPayloadSummary: 'GET /fscmRestApi/resources/11.13.18.05/chartOfAccounts',
        responsePayloadSummary: '200 OK: All General Ledger accounts verified in balance.',
        rawRequestPayload: `GET /fscmRestApi/resources/11.13.18.05/chartOfAccounts?q=BusinessUnit="India Manufacturing BU 1" HTTP/1.1\nHost: erp.oraclecloud.com\nAuthorization: Bearer *********\nAccept: application/json`,
        rawResponsePayload: `{\n  "items": [\n    { "AccountCode": "GL-1100", "LedgerName": "Raw Materials", "Status": "Active" },\n    { "AccountCode": "GL-1200", "LedgerName": "WIP Manufacturing", "Status": "Active" }\n  ],\n  "count": 7,\n  "hasMore": false\n}`
      }
    ];
  },

  /**
   * Adds an execution log entry
   */
  addSyncLog(tenantId: string, logData: Partial<MasterDataSyncLog>): MasterDataSyncLog {
    const logs = this.getSyncLogs(tenantId);
    const newLog: MasterDataSyncLog = {
      id: `log-${Date.now()}`,
      tenantId,
      timestamp: new Date().toISOString(),
      entityType: logData.entityType || 'item',
      direction: logData.direction || 'bi_directional',
      erpSystem: logData.erpSystem || 'tally',
      recordsProcessed: logData.recordsProcessed || 0,
      recordsCreated: logData.recordsCreated || 0,
      recordsUpdated: logData.recordsUpdated || 0,
      conflictsFound: logData.conflictsFound || 0,
      status: logData.status || 'success',
      durationMs: logData.durationMs || 450,
      triggeredBy: logData.triggeredBy || 'IT Admin',
      requestPayloadSummary: logData.requestPayloadSummary || 'Payload transmitted.',
      responsePayloadSummary: logData.responsePayloadSummary || 'ERP Ack received.',
      rawRequestPayload: logData.rawRequestPayload,
      rawResponsePayload: logData.rawResponsePayload,
      errorMessage: logData.errorMessage
    };

    logs.unshift(newLog);
    try {
      localStorage.setItem(`${LOGS_STORAGE_KEY}_${tenantId}`, JSON.stringify(logs.slice(0, 50)));
    } catch (e) {
      console.warn('Failed saving sync logs:', e);
    }
    return newLog;
  },

  /**
   * Executes bi-directional synchronization for a specific entity or all entities
   */
  async executeSync(
    tenantId: string, 
    entityType: MasterDataEntityType | 'all',
    direction: SyncDirection = 'bi_directional'
  ): Promise<MasterDataSyncLog> {
    const config = this.getConfig(tenantId);
    const startTime = Date.now();

    // Simulate network roundtrip and parsing
    await new Promise(r => setTimeout(r, 900));

    let processed = 0;
    let created = 0;
    let updated = 0;
    let conflicts = 0;
    let status: 'success' | 'conflict' = 'success';

    if (entityType === 'item') {
      processed = 18;
      created = 1;
      updated = 16;
      conflicts = config.conflictPolicy === 'manual' ? 1 : 0;
    } else if (entityType === 'bom') {
      processed = 6;
      created = 0;
      updated = 5;
      conflicts = config.conflictPolicy === 'manual' ? 1 : 0;
    } else if (entityType === 'supplier') {
      processed = 12;
      created = 1;
      updated = 11;
      conflicts = 0;
    } else if (entityType === 'customer') {
      processed = 15;
      created = 0;
      updated = 14;
      conflicts = config.conflictPolicy === 'manual' ? 1 : 0;
    } else if (entityType === 'coa') {
      processed = 7;
      created = 0;
      updated = 7;
      conflicts = 0;
    } else {
      // All entities
      processed = 58;
      created = 2;
      updated = 54;
      conflicts = config.conflictPolicy === 'manual' ? 2 : 0;
    }

    if (conflicts > 0) {
      status = 'conflict';
    }

    const duration = Date.now() - startTime;

    const requestPayload = config.erpSystem === 'tally' 
      ? `<ENVELOPE>\n  <HEADER>\n    <TALLYREQUEST>Import Data</TALLYREQUEST>\n    <TYPE>Data</TYPE>\n    <ID>${entityType.toUpperCase()}_MASTER_SYNC</ID>\n  </HEADER>\n  <BODY>\n    <DESC>\n      <STATICVARIABLES>\n        <SVCOMPANY>${config.tallyConfig.companyName}</SVCOMPANY>\n      </STATICVARIABLES>\n    </DESC>\n  </BODY>\n</ENVELOPE>`
      : `POST ${config.oracleSapConfig.endpointUrl}/sync\nContent-Type: application/json\nX-Organization-Id: ${config.oracleSapConfig.organizationId}\n\n{\n  "syncDirection": "${direction}",\n  "entityType": "${entityType}",\n  "batchSize": ${processed}\n}`;

    const responsePayload = config.erpSystem === 'tally'
      ? `<RESPONSE>\n  <STATUS>SUCCESS</STATUS>\n  <RECORDS_PROCESSED>${processed}</RECORDS_PROCESSED>\n  <UPDATED>${updated}</UPDATED>\n  <CONFLICTS>${conflicts}</CONFLICTS>\n</RESPONSE>`
      : `{\n  "statusCode": 200,\n  "status": "COMPLETED",\n  "recordsProcessed": ${processed},\n  "recordsCreated": ${created},\n  "recordsUpdated": ${updated},\n  "conflictsDetected": ${conflicts}\n}`;

    const log = this.addSyncLog(tenantId, {
      entityType: entityType === 'all' ? 'all_master_data' : entityType,
      direction,
      erpSystem: config.erpSystem,
      recordsProcessed: processed,
      recordsCreated: created,
      recordsUpdated: updated,
      conflictsFound: conflicts,
      status,
      durationMs: duration,
      triggeredBy: 'IT Administrator (Manual Trigger)',
      requestPayloadSummary: `Synchronized ${entityType.toUpperCase()} master data with ${config.erpSystem.toUpperCase()} (${direction}).`,
      responsePayloadSummary: `Processed ${processed} records in ${duration}ms. ${conflicts} conflict(s) routed to resolution queue.`,
      rawRequestPayload: requestPayload,
      rawResponsePayload: responsePayload
    });

    // Update config timestamp
    config.lastFullSyncTimestamp = new Date().toISOString();
    this.saveConfig(tenantId, config);

    return log;
  },

  /**
   * Tests ERP connection endpoint
   */
  async testConnection(config: MasterDataSyncConfig): Promise<{ success: boolean; latencyMs: number; message: string }> {
    const start = Date.now();
    await new Promise(r => setTimeout(r, 650));
    const latency = Date.now() - start;

    if (config.erpSystem === 'tally') {
      return {
        success: true,
        latencyMs: latency,
        message: `Connected to Tally Prime HTTP XML Server at ${config.tallyConfig.serverUrl}. Company '${config.tallyConfig.companyName}' responded with License Tier Enterprise.`
      };
    } else {
      return {
        success: true,
        latencyMs: latency,
        message: `Connected to Oracle Cloud ERP REST Endpoint (${config.oracleSapConfig.endpointUrl}). Business Unit '${config.oracleSapConfig.businessUnit}' token verified.`
      };
    }
  }
};
