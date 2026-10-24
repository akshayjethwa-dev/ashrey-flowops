// src/types/erpSync.ts

import { QuoteItem } from '../types';

export type ErpTargetSystem = 'tally' | 'oracle' | 'sap' | 'zoho';

export type ErpSyncStatus = 'pending' | 'synced' | 'failed' | 'retrying';

export type GstSupplyType = 'intra_state' | 'inter_state';

export interface HsnTaxSummaryItem {
  hsnCode: string;
  description: string;
  taxableValue: number;
  cgstRatePercent: number;
  cgstAmount: number;
  sgstRatePercent: number;
  sgstAmount: number;
  igstRatePercent: number;
  igstAmount: number;
  totalTax: number;
}

export interface InvoiceTaxBreakdown {
  taxType: GstSupplyType;
  supplierGstin: string;
  supplierState: string;
  supplierStateCode: string;
  customerGstin: string;
  customerState: string;
  customerStateCode: string;
  placeOfSupply: string;
  taxableAmount: number;
  cgstRatePercent: number;
  cgstAmount: number;
  sgstRatePercent: number;
  sgstAmount: number;
  igstRatePercent: number;
  igstAmount: number;
  cessAmount: number;
  roundOff: number;
  grandTotal: number;
  hsnSummary: HsnTaxSummaryItem[];
}

export interface ErpSyncLog {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  system: ErpTargetSystem;
  timestamp: string;
  status: ErpSyncStatus;
  referenceId?: string; // e.g. Tally GUID or Oracle Transaction ID
  requestPayload: string; // XML or JSON
  responsePayload?: string;
  statusCode?: number;
  errorMessage?: string;
  syncedBy: string;
}

export interface TallyIntegrationConfig {
  serverUrl: string; // default: http://localhost:9000
  companyName: string;
  salesLedger: string;
  cgstLedger: string;
  sgstLedger: string;
  igstLedger: string;
  roundOffLedger: string;
  autoSyncOnDispatch: boolean;
  enabled: boolean;
}

export interface OracleSapIntegrationConfig {
  systemType: 'oracle' | 'sap';
  endpointUrl: string; // e.g. https://erp.oraclecloud.com/fscmRestApi/resources/11.13.18.05/invoices
  businessUnit: string;
  transactionSource: string;
  currencyCode: string;
  authType: 'bearer_token' | 'basic_auth' | 'api_key';
  authToken?: string;
  autoSyncOnDispatch: boolean;
  enabled: boolean;
}

export interface ErpSyncSummaryKpis {
  totalInvoices: number;
  totalRevenueRecognized: number;
  totalGstTax: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  tallySyncedCount: number;
  tallyPendingCount: number;
  oracleSyncedCount: number;
  oraclePendingCount: number;
  pendingDispatchesCount: number;
}
