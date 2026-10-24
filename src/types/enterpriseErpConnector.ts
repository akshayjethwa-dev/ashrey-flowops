// src/types/enterpriseErpConnector.ts

export type EnterpriseErpSystem = 'oracle_fusion' | 'sap_s4hana';

export type EnterpriseAuthType = 
  | 'oauth2_client_credentials' 
  | 'oauth2_jwt_bearer' 
  | 'basic_auth' 
  | 'api_key';

export type EnterpriseRestOperation = 
  | 'oauth_token' 
  | 'so_pull' 
  | 'production_push' 
  | 'inventory_sync' 
  | 'master_data_sync';

export type RestTransactionStatus = 'success' | 'failed' | 'retrying' | 'queued';

export interface EnterpriseOAuthConfig {
  tokenUrl: string;                // e.g. "https://idcs-xyz.identity.oraclecloud.com/oauth2/v1/token"
  clientId: string;
  clientSecret: string;
  scope: string;                   // e.g. "urn:opc:resource:consumer:all" or "https://api.s4hana.ondemand.com/.default"
  audience?: string;
  accessToken?: string;
  tokenType: string;               // "Bearer"
  expiresAt?: string;              // ISO string
  lastRefreshedAt?: string;
  status: 'active' | 'expired' | 'refreshing' | 'unconfigured' | 'error';
  errorMessage?: string;
}

export interface EnterpriseEndpointConfig {
  system: EnterpriseErpSystem;
  systemName: string;              // e.g. "Oracle Fusion Cloud SCM 24B" or "SAP S/4HANA Cloud 2023"
  baseUrl: string;                 // e.g. "https://fa-epms-saasfaprod1.fa.ocs.oraclecloud.com"
  businessUnit: string;            // e.g. "BU_INDIA_MFG_01" or Plant "1010"
  organizationCode: string;        // e.g. "ORG_APEX_PUNE" or Storage Loc "101A"
  authType: EnterpriseAuthType;
  oauth: EnterpriseOAuthConfig;
  
  // Specific Resource Endpoints
  soPullEndpoint: string;          // e.g. "/fscmRestApi/resources/11.13.18.05/salesOrdersForOrderHub"
  productionPushEndpoint: string;  // e.g. "/fscmRestApi/resources/11.13.18.05/wipOperations"
  inventorySyncEndpoint: string;   // e.g. "/fscmRestApi/resources/11.13.18.05/inventoryTransactions"
  
  timeoutMs: number;
  maxRetries: number;
  autoSyncEnabled: boolean;
  syncIntervalMinutes: number;
}

export interface EnterpriseRestTransaction {
  id: string;
  tenantId: string;
  system: EnterpriseErpSystem;
  operation: EnterpriseRestOperation;
  title: string;                   // e.g. "Pull Sales Orders: Bharat Forge (SO-901)"
  referenceId: string;             // e.g. "ORA-SO-4410", "SAP-WIP-0081"
  endpointPath: string;            // e.g. "/fscmRestApi/resources/11.13.18.05/wipOperations"
  httpMethod: 'GET' | 'POST' | 'PUT' | 'PATCH';
  httpStatus: number;              // 200, 201, 400, 401, 429, 500
  status: RestTransactionStatus;
  timestamp: string;
  durationMs: number;
  
  // Payloads
  requestHeaders: Record<string, string>;
  requestBody?: string;            // Formatted JSON string
  responseBody?: string;           // Formatted JSON string
  
  // Error handling & Correlation
  correlationId?: string;          // e.g. "X-Oracle-DMS-ECID: 005yY... " or "sap-message-id"
  errorCode?: string;              // e.g. "ERR_OAUTH_EXPIRED", "ERR_WIP_LINE_LOCKED"
  errorMessage?: string;
  suggestedFix?: string;
  retryCount: number;
}

export interface EnterpriseConnectorStats {
  totalCalls: number;
  successCount: number;
  failedCount: number;
  retryingCount: number;
  successRatePct: number;
  avgLatencyMs: number;
  soPulledCount: number;
  productionPushedCount: number;
  inventorySyncedCount: number;
  oauthValid: boolean;
}

export interface EnterpriseErpDualConfig {
  activeSystem: EnterpriseErpSystem;
  oracle: EnterpriseEndpointConfig;
  sap: EnterpriseEndpointConfig;
}
