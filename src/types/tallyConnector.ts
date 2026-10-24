// src/types/tallyConnector.ts

export type TallyConnectionMode = 'xml_http' | 'odbc_fallback';

export type TallyVoucherCategory = 
  | 'sales_order'         // Customer Sales Order
  | 'dispatch_invoice'    // GST Tax Invoice on Lorry Dispatch
  | 'goods_receipt'       // Inward Material Receipt Note (GRN)
  | 'material_issue'      // Work Center Material Issue
  | 'finished_goods';     // Manufacturing Journal inward to FG Godown

export type TallySyncStatus = 'pending' | 'synced' | 'failed' | 'fallback_odbc';

export interface TallyGatewayConfig {
  serverHost: string;              // e.g. "localhost" or "192.168.1.100"
  serverPort: number;              // default 9000
  protocol: 'http' | 'https';
  companyName: string;             // e.g. "Apex Precision Manufacturing Ltd."
  timeoutMs: number;               // default 5000
  enableAutoSync: boolean;
  
  // ODBC Fallback settings
  enableOdbcFallback: boolean;
  odbcDsn: string;                 // default "TallyODBC64_9000"
  odbcDriverName: string;          // e.g. "Tally ODBC Driver64"
  odbcQueryTimeoutSec: number;
  
  // GST Ledger Mappings
  salesLedgerDomestic: string;     // e.g. "Sales - Domestic Industrial 18%"
  salesLedgerInterstate: string;   // e.g. "Sales - Inter-State Industrial 18%"
  cgstLedger: string;              // e.g. "Output CGST @ 9%"
  sgstLedger: string;              // e.g. "Output SGST @ 9%"
  igstLedger: string;              // e.g. "Output IGST @ 18%"
  roundOffLedger: string;          // e.g. "Round Off Account"
  defaultGodown: string;           // e.g. "Main Godown (Sanand)"
  fgGodown: string;                // e.g. "FG Central Godown"
  wipGodown: string;               // e.g. "Shop Floor WIP"
}

export interface TallyGatewayHealth {
  isOnline: boolean;
  activeMode: TallyConnectionMode;
  latencyMs: number;
  lastPingTimestamp: string;
  tallyVersion?: string;           // e.g. "TallyPrime 4.1 (64-bit)"
  activeCompanyName?: string;
  odbcServerAvailable: boolean;
  httpServerAvailable: boolean;
  diagMessage?: string;
}

export interface TallyGstInvoiceData {
  invoiceNumber: string;
  invoiceDate: string;             // YYYYMMDD
  dispatchNumber: string;
  customerName: string;
  customerGstin: string;
  customerState: string;
  customerStateCode: string;
  supplierGstin: string;
  supplierState: string;
  supplierStateCode: string;
  placeOfSupply: string;
  isInterState: boolean;
  
  // Statutory E-Way & E-Invoice details
  ewayBillNumber?: string;
  ewayBillDate?: string;
  vehicleNumber?: string;
  irnNumber?: string;              // 64-char Hash
  ackNumber?: string;
  
  // Financial amounts
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;
  
  items: Array<{
    itemCode: string;
    itemName: string;
    hsnCode: string;
    quantity: number;
    uom: string;
    rate: number;
    amount: number;
    gstRatePercent: number;
    godownName: string;
    batchNumber?: string;
  }>;
}

export interface TallySyncTransaction {
  id: string;
  tenantId: string;
  category: TallyVoucherCategory;
  referenceNumber: string;         // e.g. "INV-2026-0042", "SO-2026-0089", "GRN-2026-0104"
  entityTitle: string;             // e.g. "Bharat Forge Ltd - Spur Gears"
  tallyVoucherType: string;        // "Sales", "Sales Order", "Receipt Note", "Material Issue"
  amountINR: number;
  status: TallySyncStatus;
  usedChannel: TallyConnectionMode;
  tallyMasterId?: string;          // e.g. "MASTER_ID_48910"
  tallyVoucherNumber?: string;     // e.g. "TALLY-SALES-2026-0088"
  timestamp: string;
  syncedAt?: string;
  requestXml: string;
  responseXml?: string;
  odbcFallbackSql?: string;
  errorMessage?: string;
  retryCount: number;
}

export interface TallyConnectorKpis {
  totalTransactions: number;
  syncedCount: number;
  pendingCount: number;
  failedCount: number;
  odbcFallbackCount: number;
  totalSyncedValueINR: number;
  averageLatencyMs: number;
}
