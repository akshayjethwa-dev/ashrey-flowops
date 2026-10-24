// src/types/whatsappOrderStatus.ts

export type StatusCommandType = 'STATUS' | 'TRACK' | 'DISPATCH' | 'WHERE_IS' | 'HELP' | 'RECENT_ORDERS' | 'UNKNOWN';

export interface WhatsAppStatusCommand {
  rawText: string;
  commandType: StatusCommandType;
  extractedOrderRef?: string;
  isOrderNumberSpecified: boolean;
  senderPhone: string;
  senderName: string;
  isValidCommand: boolean;
  parseNotes: string[];
}

export type OrderManufacturingStage = 
  | 'confirmed'
  | 'material_allocated'
  | 'in_production'
  | 'qc_inspection'
  | 'ready_for_dispatch'
  | 'dispatched'
  | 'delivered'
  | 'on_hold';

export interface ProductionMilestone {
  id: string;
  title: string;
  status: 'completed' | 'in_progress' | 'pending';
  completedAt?: string;
  stationName?: string;
  stationCode?: string;
  remarks?: string;
}

export interface CarrierTrackingDetails {
  carrierName: string;
  carrierType: 'surface_cargo' | 'express_courier' | 'factory_fleet' | 'customer_pickup';
  awbNumber: string;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  shippedAt?: string;
  estimatedArrival?: string;
  trackingPortalUrl?: string;
  currentLocation?: string;
}

export interface OrderStatusLookupResult {
  found: boolean;
  lookupMethod: 'exact_sales_order' | 'partial_so' | 'customer_po' | 'recent_phone_fallback' | 'not_found';
  searchedRef?: string;
  orderId?: string;
  salesOrderNumber?: string;
  customerPoNumber?: string;
  customerName?: string;
  customerCode?: string;
  customerPhone?: string;
  contactPerson?: string;
  shippingAddress?: string;
  
  // Status Details
  stage: OrderManufacturingStage;
  statusLabel: string;
  completionPercentage: number;
  currentStation: string;
  orderDate: string;
  expectedDispatchDate: string;
  committedDeliveryDate?: string;
  
  // Items Summary
  itemsCount: number;
  itemsSummary: string[];
  totalAmountINR: number;
  
  // Manufacturing Milestones
  milestones: ProductionMilestone[];
  
  // Logistics & Transporter Details
  carrier?: CarrierTrackingDetails;
  
  // Live Tracking Link
  trackingUrl: string;
  
  // Fallback Recent Orders (if customer texted only "STATUS" or multiple orders exist)
  recentOrdersForCustomer?: {
    orderNumber: string;
    customerPoNumber: string;
    statusLabel: string;
    date: string;
    expectedDispatch: string;
  }[];
  
  errorMessage?: string;
}

export interface WhatsAppStatusQueryLog {
  id: string;
  tenantId: string;
  receivedAt: string;
  fromPhone: string;
  senderName: string;
  rawText: string;
  command: WhatsAppStatusCommand;
  lookupResult: OrderStatusLookupResult;
  replyMessage: string;
  replyStatus: 'delivered' | 'sent' | 'failed';
  deliveredAt?: string;
  latencyMs: number;
  whatsappMessageId?: string;
}

export interface StatusBotConfig {
  enabled: boolean;
  senderPhoneNumber: string;
  botDisplayName: string;
  enablePhoneAutoLookup: boolean; // Lookup latest order if no SO# provided
  replyTemplate: string;
  dispatchedReplyTemplate: string;
  helpReplyTemplate: string;
  notFoundReplyTemplate: string;
  portalBaseUrl: string;
  autoLogQueries: boolean;
  notifySalesOnHotOrderQuery: boolean;
}
