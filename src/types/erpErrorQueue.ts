// src/types/erpErrorQueue.ts

export type SyncIntegrationDomain = 
  | 'sales_orders'
  | 'production_confirmation'
  | 'inventory_movement'
  | 'invoices_dispatch'
  | 'master_data'
  | 'tally_connector'
  | 'enterprise_rest_api';

export type ErpTargetSystem = 'tally' | 'oracle' | 'sap' | 'zoho' | 'custom_rest';

export type SyncFailureSeverity = 'low' | 'medium' | 'high' | 'critical';

export type SyncErrorCategory = 
  | 'network_timeout'
  | 'auth_expired_401'
  | 'rate_limit_429'
  | 'schema_validation_400'
  | 'locked_fiscal_period'
  | 'godown_unmapped'
  | 'server_error_500'
  | 'unknown';

export type QueuedItemStatus = 'quarantined' | 'retrying' | 'resolved' | 'dead_letter';

export interface SyncAlertRecord {
  id: string;
  channel: 'in_app' | 'whatsapp' | 'email' | 'webhook';
  timestamp: string;
  recipient: string;
  status: 'sent' | 'delivered' | 'failed';
  message: string;
}

export interface QueuedSyncErrorItem {
  id: string;
  tenantId: string;
  domain: SyncIntegrationDomain;
  erpSystem: ErpTargetSystem;
  referenceNumber: string;         // e.g. "INV-2026-0082", "WO-2026-0004", "GRN-2026-0104"
  entityTitle: string;             // e.g. "Bharat Forge Ltd - Spur Gears 18%"
  status: QueuedItemStatus;
  severity: SyncFailureSeverity;
  category: SyncErrorCategory;
  
  // Timestamps & Retries
  firstFailedAt: string;           // ISO timestamp
  lastAttemptAt: string;           // ISO timestamp
  nextRetryAt?: string;            // ISO timestamp for scheduled backoff
  retryCount: number;
  maxRetries: number;
  backoffIntervalSec: number;
  
  // Diagnostics
  httpStatus?: number;             // e.g. 400, 401, 429, 500
  errorCode: string;               // e.g. "ERR_TALLY_SOCKET_TIMEOUT", "ORA_WIP_LINE_LOCKED"
  errorMessage: string;
  suggestedRemediation: string;
  correlationId?: string;          // e.g. "X-Oracle-DMS-ECID", "Tally-GUID"
  
  // Payloads
  payloadFormat: 'json' | 'xml';
  requestPayload: string;
  lastResponsePayload?: string;
  
  // Alerts & Resolution
  alertsTriggered: SyncAlertRecord[];
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionMethod?: 'auto_retry' | 'manual_retry' | 'odbc_fallback' | 'payload_override';
}

export interface ErrorQueueConfig {
  autoRetryEnabled: boolean;
  maxAutoRetries: number;          // default 4
  baseBackoffSeconds: number;      // default 15
  maxBackoffSeconds: number;       // default 300
  alertOnFailureThreshold: number; // default 3 repeated failures
  alertChannels: {
    inApp: boolean;
    whatsapp: boolean;
    email: boolean;
    webhook: boolean;
  };
  itAdminWhatsAppPhone: string;
  itAdminEmail: string;
  webhookUrl: string;
  autoFailoverToOdbc: boolean;
}

export interface ErrorQueueStats {
  totalQuarantined: number;
  activeRetrying: number;
  criticalAlertCount: number;
  resolvedCount: number;
  deadLetterCount: number;
  recoveryRatePct: number;
  byDomain: Record<SyncIntegrationDomain, number>;
  bySystem: Record<ErpTargetSystem, number>;
}
