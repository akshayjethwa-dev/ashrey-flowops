// src/services/erpErrorQueueService.ts

import { 
  QueuedSyncErrorItem, 
  ErrorQueueConfig, 
  ErrorQueueStats,
  SyncIntegrationDomain,
  ErpTargetSystem,
  SyncFailureSeverity,
  SyncAlertRecord
} from '../types/erpErrorQueue';

const QUEUE_STORAGE_KEY = 'flowops_central_erp_error_queue_v1';
const CONFIG_STORAGE_KEY = 'flowops_central_erp_error_config_v1';

export const DEFAULT_QUEUE_CONFIG: ErrorQueueConfig = {
  autoRetryEnabled: true,
  maxAutoRetries: 4,
  baseBackoffSeconds: 15,
  maxBackoffSeconds: 300,
  alertOnFailureThreshold: 3,
  alertChannels: {
    inApp: true,
    whatsapp: true,
    email: true,
    webhook: true
  },
  itAdminWhatsAppPhone: '+91 98201 12345',
  itAdminEmail: 'it-admin@apexengineering.in',
  webhookUrl: 'https://hooks.slack.com/services/T00/B00/ERP_ALERTS',
  autoFailoverToOdbc: true
};

const SEED_ERRORS: QueuedSyncErrorItem[] = [
  {
    id: 'err_sync_001',
    tenantId: 'demo',
    domain: 'invoices_dispatch',
    erpSystem: 'oracle',
    referenceNumber: 'INV-2026-0083',
    entityTitle: 'Kirloskar Oil Engines - Flywheel Castings (MH)',
    status: 'quarantined',
    severity: 'critical',
    category: 'rate_limit_429',
    firstFailedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    lastAttemptAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    nextRetryAt: new Date(Date.now() + 25 * 1000).toISOString(), // Ready soon
    retryCount: 3,
    maxRetries: 4,
    backoffIntervalSec: 60,
    httpStatus: 429,
    errorCode: 'HTTP_429_TOO_MANY_REQUESTS',
    errorMessage: 'Oracle Financials Cloud REST API concurrency rate limit threshold exceeded (10 concurrent calls).',
    suggestedRemediation: 'Automatic exponential backoff timer is active. Scheduled to retry in 25 seconds.',
    correlationId: 'ora-ecid-error-429-kirloskar',
    payloadFormat: 'json',
    requestPayload: JSON.stringify({
      InvoiceNumber: "INV-2026-0083",
      CustomerGstin: "27AAACK1928J1ZR",
      InvoiceAmount: 354000,
      TaxableValue: 300000,
      TotalTaxAmount: 54000,
      EwayBillNumber: "241928374829",
      VehicleNumber: "MH-12-QZ-4010"
    }, null, 2),
    alertsTriggered: [
      {
        id: 'alt_001',
        channel: 'whatsapp',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        recipient: '+91 98201 12345',
        status: 'delivered',
        message: '🚨 CRITICAL ERP ALERT: Invoice INV-2026-0083 failed 3 consecutive sync attempts to Oracle Cloud. Rate limit (429) active.'
      },
      {
        id: 'alt_002',
        channel: 'in_app',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        recipient: 'IT & Production Administrators',
        status: 'delivered',
        message: 'Repeated sync failure on Oracle Cloud: Invoice INV-2026-0083 (Kirloskar Oil Engines).'
      }
    ]
  },
  {
    id: 'err_sync_002',
    tenantId: 'demo',
    domain: 'inventory_movement',
    erpSystem: 'tally',
    referenceNumber: 'GRN-2026-0105',
    entityTitle: 'AISI 4140 Forged Casting Blank (Dia 220mm)',
    status: 'quarantined',
    severity: 'high',
    category: 'network_timeout',
    firstFailedAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    lastAttemptAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    nextRetryAt: new Date(Date.now() + 45 * 1000).toISOString(),
    retryCount: 2,
    maxRetries: 4,
    backoffIntervalSec: 30,
    httpStatus: 504,
    errorCode: 'ERR_TALLY_ODBC_TIMEOUT',
    errorMessage: 'HTTP 504 Gateway Timeout while posting Receipt Note to Tally Prime XML server at localhost:9000',
    suggestedRemediation: 'Verify Tally Prime is running on port 9000 or click "Force ODBC Fallback".',
    correlationId: 'tally-sock-timeout-9000',
    payloadFormat: 'xml',
    requestPayload: `<ENVELOPE>
  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
  <BODY>
    <VOUCHER VCHTYPE="Receipt Note" ACTION="Create">
      <VOUCHERNUMBER>GRN-2026-0105</VOUCHERNUMBER>
      <ITEMNAME>AISI 4140 Forged Casting Blank (Dia 220mm)</ITEMNAME>
      <QUANTITY>30 Nos</QUANTITY>
      <RATE>5400</RATE>
      <GODOWNNAME>HEAVY-YARD-BAY-C</GODOWNNAME>
    </VOUCHER>
  </BODY>
</ENVELOPE>`,
    alertsTriggered: []
  },
  {
    id: 'err_sync_003',
    tenantId: 'demo',
    domain: 'production_confirmation',
    erpSystem: 'sap',
    referenceNumber: 'WO-2026-0002',
    entityTitle: 'WIP Heat Treatment Inward & Hardness Inspection (Op 20)',
    status: 'quarantined',
    severity: 'medium',
    category: 'locked_fiscal_period',
    firstFailedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    lastAttemptAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    nextRetryAt: new Date(Date.now() + 120 * 1000).toISOString(),
    retryCount: 1,
    maxRetries: 4,
    backoffIntervalSec: 15,
    httpStatus: 400,
    errorCode: 'SAP_BAPI_POSTING_PERIOD_LOCKED',
    errorMessage: 'Posting period 07/2026 is closed for Company Code 1010 in SAP S/4HANA.',
    suggestedRemediation: 'SAP Finance controller must open fiscal posting period for current month, or override posting date in payload.',
    correlationId: 'sap-msg-0048192-bapi',
    payloadFormat: 'json',
    requestPayload: JSON.stringify({
      ManufacturingOrder: "WO-2026-0002",
      Operation: "0020",
      YieldQuantity: "50",
      ScrapQuantity: "0",
      PostingDate: "2026-10-18"
    }, null, 2),
    alertsTriggered: []
  },
  {
    id: 'err_sync_004',
    tenantId: 'demo',
    domain: 'sales_orders',
    erpSystem: 'oracle',
    referenceNumber: 'SO-ORA-9012',
    entityTitle: 'Customer PO Bharat Forge Ltd (Qty 120 Pinion Shafts)',
    status: 'resolved',
    severity: 'high',
    category: 'auth_expired_401',
    firstFailedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    lastAttemptAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    retryCount: 2,
    maxRetries: 4,
    backoffIntervalSec: 30,
    httpStatus: 200,
    errorCode: 'ORA_OAUTH_EXPIRED',
    errorMessage: 'HTTP 401 Unauthorized: Bearer token expired on Oracle Identity Cloud Service.',
    suggestedRemediation: 'Token auto-refreshed via OAuth 2.0 Client Credentials flow. Order successfully imported.',
    correlationId: 'ora-ecid-oauth-recovered-9012',
    payloadFormat: 'json',
    requestPayload: JSON.stringify({ OrderNumber: "SO-ORA-9012", StatusCode: "OPEN" }, null, 2),
    alertsTriggered: [],
    resolvedAt: new Date(Date.now() - 44 * 60 * 1000).toISOString(),
    resolvedBy: 'Auto-Retry Worker (OAuth Refresh)',
    resolutionMethod: 'auto_retry'
  }
];

export const erpErrorQueueService = {
  /**
   * Retrieves configuration
   */
  getConfig(tenantId: string): ErrorQueueConfig {
    try {
      const cached = localStorage.getItem(`${CONFIG_STORAGE_KEY}_${tenantId}`);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.warn('Error reading error queue config:', e);
    }
    return DEFAULT_QUEUE_CONFIG;
  },

  /**
   * Saves configuration
   */
  saveConfig(tenantId: string, config: ErrorQueueConfig): void {
    try {
      localStorage.setItem(`${CONFIG_STORAGE_KEY}_${tenantId}`, JSON.stringify(config));
      window.dispatchEvent(new Event('erp_error_queue_updated'));
    } catch (e) {
      console.warn('Error saving error queue config:', e);
    }
  },

  /**
   * Retrieves all queued error records
   */
  getQueueItems(tenantId: string): QueuedSyncErrorItem[] {
    try {
      const cached = localStorage.getItem(`${QUEUE_STORAGE_KEY}_${tenantId}`);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.warn('Error reading error queue:', e);
    }
    this.saveQueueItems(tenantId, SEED_ERRORS);
    return SEED_ERRORS;
  },

  /**
   * Saves queue items
   */
  saveQueueItems(tenantId: string, items: QueuedSyncErrorItem[]): void {
    try {
      localStorage.setItem(`${QUEUE_STORAGE_KEY}_${tenantId}`, JSON.stringify(items));
      window.dispatchEvent(new Event('erp_error_queue_updated'));
    } catch (e) {
      console.warn('Error saving error queue items:', e);
    }
  },

  /**
   * Acceptance Criteria 1: Enqueues a failed sync into the central Error Queue
   */
  enqueueError(
    tenantId: string, 
    errorData: Omit<QueuedSyncErrorItem, 'id' | 'status' | 'retryCount' | 'backoffIntervalSec' | 'alertsTriggered'>
  ): QueuedSyncErrorItem {
    const config = this.getConfig(tenantId);
    const initialBackoff = config.baseBackoffSeconds;
    const nextRetry = new Date(Date.now() + initialBackoff * 1000).toISOString();

    const newItem: QueuedSyncErrorItem = {
      ...errorData,
      id: `err_sync_${Date.now()}`,
      status: 'quarantined',
      retryCount: 0,
      maxRetries: config.maxAutoRetries,
      backoffIntervalSec: initialBackoff,
      nextRetryAt: nextRetry,
      alertsTriggered: []
    };

    const queue = this.getQueueItems(tenantId);
    const updated = [newItem, ...queue];
    this.saveQueueItems(tenantId, updated);

    return newItem;
  },

  /**
   * Acceptance Criteria 2: Executes an automated retry with exponential backoff
   */
  async executeAutoRetry(tenantId: string, itemId: string): Promise<QueuedSyncErrorItem> {
    const queue = this.getQueueItems(tenantId);
    const idx = queue.findIndex(i => i.id === itemId);
    if (idx === -1) throw new Error('Queued item not found');

    const item = queue[idx];
    const config = this.getConfig(tenantId);
    const nowIso = new Date().toISOString();

    // Mark as retrying
    item.status = 'retrying';
    item.lastAttemptAt = nowIso;
    this.saveQueueItems(tenantId, queue);

    // Simulate real network attempt
    await new Promise(res => setTimeout(res, 600));

    // Simulated recovery on next attempt
    const newRetryCount = item.retryCount + 1;
    
    // If it was attempt 3 or 4, simulate success to show resolved recovery flow
    if (newRetryCount >= 2) {
      item.status = 'resolved';
      item.resolvedAt = nowIso;
      item.resolvedBy = 'Auto-Retry Backoff Engine';
      item.resolutionMethod = 'auto_retry';
      item.httpStatus = 200;
      item.lastResponsePayload = JSON.stringify({
        Status: "SUCCESS_RECOVERED",
        Message: `ERP connection re-established. Transaction successfully committed to ${item.erpSystem.toUpperCase()}.`,
        Timestamp: nowIso
      }, null, 2);
    } else {
      // Re-quarantine with increased backoff
      const nextBackoff = Math.min(item.backoffIntervalSec * 2, config.maxBackoffSeconds);
      item.status = 'quarantined';
      item.retryCount = newRetryCount;
      item.backoffIntervalSec = nextBackoff;
      item.nextRetryAt = new Date(Date.now() + nextBackoff * 1000).toISOString();

      // Check Acceptance Criteria 4: Alert on repeated failure
      if (item.retryCount >= config.alertOnFailureThreshold) {
        this.dispatchRepeatedFailureAlert(tenantId, item, config);
      }
    }

    queue[idx] = item;
    this.saveQueueItems(tenantId, queue);
    return item;
  },

  /**
   * Acceptance Criteria 3: Manual Retry for single item
   */
  async manualRetryItem(
    tenantId: string, 
    itemId: string, 
    editedPayload?: string
  ): Promise<QueuedSyncErrorItem> {
    const queue = this.getQueueItems(tenantId);
    const idx = queue.findIndex(i => i.id === itemId);
    if (idx === -1) throw new Error('Queued item not found');

    const item = queue[idx];
    const nowIso = new Date().toISOString();

    if (editedPayload) {
      item.requestPayload = editedPayload;
    }

    // Mark as retrying
    item.status = 'retrying';
    item.lastAttemptAt = nowIso;
    this.saveQueueItems(tenantId, queue);

    // Network delay simulation
    await new Promise(res => setTimeout(res, 750));

    // Manual retry resolves the error
    item.status = 'resolved';
    item.resolvedAt = nowIso;
    item.resolvedBy = 'IT Administrator (Manual Action)';
    item.resolutionMethod = editedPayload ? 'payload_override' : 'manual_retry';
    item.httpStatus = 200;
    item.retryCount = item.retryCount + 1;
    item.lastResponsePayload = JSON.stringify({
      Status: "RESOLVED_MANUAL_RETRY",
      ERP: item.erpSystem.toUpperCase(),
      Reference: item.referenceNumber,
      Message: `Voucher successfully imported into ${item.erpSystem.toUpperCase()} database.`,
      CommittedAt: nowIso
    }, null, 2);

    queue[idx] = item;
    this.saveQueueItems(tenantId, queue);

    return item;
  },

  /**
   * Acceptance Criteria 3: Manual Retry for all quarantined items
   */
  async manualRetryAll(tenantId: string): Promise<QueuedSyncErrorItem[]> {
    const queue = this.getQueueItems(tenantId);
    const quarantinedItems = queue.filter(i => i.status === 'quarantined' || i.status === 'dead_letter');
    const results: QueuedSyncErrorItem[] = [];

    for (const item of quarantinedItems) {
      const res = await this.manualRetryItem(tenantId, item.id);
      results.push(res);
    }

    return results;
  },

  /**
   * Acceptance Criteria 4: Dispatches multi-channel alerts upon repeated failures
   */
  dispatchRepeatedFailureAlert(
    tenantId: string, 
    item: QueuedSyncErrorItem, 
    config: ErrorQueueConfig
  ): void {
    const nowIso = new Date().toISOString();
    const alertId = `alt_${Date.now()}`;
    const newAlerts: SyncAlertRecord[] = [];

    // 1. WhatsApp Alert
    if (config.alertChannels.whatsapp && config.itAdminWhatsAppPhone) {
      newAlerts.push({
        id: `${alertId}_wa`,
        channel: 'whatsapp',
        timestamp: nowIso,
        recipient: config.itAdminWhatsAppPhone,
        status: 'delivered',
        message: `🚨 CRITICAL ERP SYNC ALERT: ${item.referenceNumber} (${item.entityTitle}) has reached ${item.retryCount} failed attempts on ${item.erpSystem.toUpperCase()}. Error: ${item.errorMessage}`
      });
    }

    // 2. In-App Notification
    if (config.alertChannels.inApp) {
      newAlerts.push({
        id: `${alertId}_app`,
        channel: 'in_app',
        timestamp: nowIso,
        recipient: 'IT Admin & Production Managers',
        status: 'delivered',
        message: `Repeated sync failure on ${item.erpSystem.toUpperCase()}: ${item.referenceNumber} (${item.domain}). Immediate triage required.`
      });
    }

    // 3. Webhook Alert (Slack / PagerDuty)
    if (config.alertChannels.webhook && config.webhookUrl) {
      newAlerts.push({
        id: `${alertId}_hook`,
        channel: 'webhook',
        timestamp: nowIso,
        recipient: config.webhookUrl,
        status: 'delivered',
        message: `POST webhook alert payload dispatched to ${config.webhookUrl}`
      });
    }

    item.severity = 'critical';
    item.alertsTriggered = [...item.alertsTriggered, ...newAlerts];

    // Fire application level custom event for instant notification toasts
    window.dispatchEvent(new CustomEvent('erp_repeated_failure_alert', { 
      detail: { item, alert: newAlerts[0] } 
    }));
  },

  /**
   * Computes KPI statistics for the IT Administrator Dashboard
   */
  getStats(tenantId: string): ErrorQueueStats {
    const queue = this.getQueueItems(tenantId);
    const totalQuarantined = queue.filter(i => i.status === 'quarantined').length;
    const activeRetrying = queue.filter(i => i.status === 'retrying').length;
    const resolvedCount = queue.filter(i => i.status === 'resolved').length;
    const deadLetterCount = queue.filter(i => i.status === 'dead_letter').length;
    const criticalAlertCount = queue.filter(i => i.severity === 'critical' && i.status === 'quarantined').length;

    const totalHistorical = queue.length;
    const recoveryRatePct = totalHistorical > 0 ? Math.round((resolvedCount / totalHistorical) * 100) : 100;

    const byDomain: Record<SyncIntegrationDomain, number> = {
      sales_orders: queue.filter(i => i.domain === 'sales_orders' && i.status === 'quarantined').length,
      production_confirmation: queue.filter(i => i.domain === 'production_confirmation' && i.status === 'quarantined').length,
      inventory_movement: queue.filter(i => i.domain === 'inventory_movement' && i.status === 'quarantined').length,
      invoices_dispatch: queue.filter(i => i.domain === 'invoices_dispatch' && i.status === 'quarantined').length,
      master_data: queue.filter(i => i.domain === 'master_data' && i.status === 'quarantined').length,
      tally_connector: queue.filter(i => i.domain === 'tally_connector' && i.status === 'quarantined').length,
      enterprise_rest_api: queue.filter(i => i.domain === 'enterprise_rest_api' && i.status === 'quarantined').length,
    };

    const bySystem: Record<ErpTargetSystem, number> = {
      tally: queue.filter(i => i.erpSystem === 'tally' && i.status === 'quarantined').length,
      oracle: queue.filter(i => i.erpSystem === 'oracle' && i.status === 'quarantined').length,
      sap: queue.filter(i => i.erpSystem === 'sap' && i.status === 'quarantined').length,
      zoho: queue.filter(i => i.erpSystem === 'zoho' && i.status === 'quarantined').length,
      custom_rest: queue.filter(i => i.erpSystem === 'custom_rest' && i.status === 'quarantined').length,
    };

    return {
      totalQuarantined,
      activeRetrying,
      criticalAlertCount,
      resolvedCount,
      deadLetterCount,
      recoveryRatePct,
      byDomain,
      bySystem
    };
  }
};
