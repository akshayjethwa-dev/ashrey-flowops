// src/types/masterDataSync.ts

export type MasterDataEntityType = 'item' | 'bom' | 'supplier' | 'customer' | 'coa';

export type SyncDirection = 'bi_directional' | 'inbound' | 'outbound';

export type SyncExecutionStatus = 'success' | 'failed' | 'conflict' | 'in_progress' | 'partial';

export type ConflictResolutionPolicy = 
  | 'erp_wins' 
  | 'flowops_wins' 
  | 'latest_timestamp' 
  | 'manual';

export interface DifferingField {
  field: string;
  label: string;
  flowOpsValue: any;
  erpValue: any;
}

export interface MasterDataConflict {
  id: string;
  tenantId: string;
  entityType: MasterDataEntityType;
  entityId: string;
  entityIdentifier: string; // e.g. "SKU: RM-STL-4140" or "Cust: Tata Motors"
  flowOpsData: Record<string, any>;
  erpData: Record<string, any>;
  differingFields: DifferingField[];
  detectedAt: string;
  status: 'pending' | 'resolved';
  resolvedBy?: string;
  resolutionChoice?: 'flowops' | 'erp' | 'custom_merged';
  resolvedAt?: string;
  notes?: string;
}

export interface MasterDataSyncLog {
  id: string;
  tenantId: string;
  timestamp: string;
  entityType: MasterDataEntityType | 'all_master_data';
  direction: SyncDirection;
  erpSystem: 'tally' | 'oracle' | 'sap' | 'netsuite';
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  conflictsFound: number;
  status: SyncExecutionStatus;
  durationMs: number;
  triggeredBy: string;
  requestPayloadSummary?: string;
  responsePayloadSummary?: string;
  rawRequestPayload?: string;
  rawResponsePayload?: string;
  errorMessage?: string;
}

export interface ChartOfAccountRecord {
  accountCode: string;
  accountName: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parentAccount?: string;
  erpLedgerName: string;
  flowOpsUsage: string;
  balanceINR?: number;
  lastSyncedAt: string;
  syncStatus: 'synced' | 'pending' | 'conflict';
}

export interface MasterDataSyncConfig {
  erpSystem: 'tally' | 'oracle' | 'sap' | 'netsuite';
  conflictPolicy: ConflictResolutionPolicy;
  autoSyncEnabled: boolean;
  syncIntervalMinutes: number;
  entitiesEnabled: {
    items: boolean;
    boms: boolean;
    suppliers: boolean;
    customers: boolean;
    coa: boolean;
  };
  tallyConfig: {
    serverUrl: string; // e.g. http://localhost:9000
    companyName: string;
    itemGroup: string;
    exportFormat: 'XML';
    timeoutSec: number;
  };
  oracleSapConfig: {
    systemType: 'oracle' | 'sap' | 'netsuite';
    endpointUrl: string;
    businessUnit: string;
    authType: 'bearer_token' | 'basic_auth' | 'api_key';
    apiKey?: string;
    organizationId: string;
  };
  lastFullSyncTimestamp?: string;
}

export interface MasterDataEntityItem {
  id: string;
  entityType: MasterDataEntityType;
  code: string;
  name: string;
  categoryOrRevision: string;
  flowOpsUpdated: string;
  erpUpdated: string;
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
  erpReferenceId?: string;
  details: Record<string, any>;
}
