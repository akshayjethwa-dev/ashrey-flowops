// src/services/scannerService.ts
/**
 * Unified barcode scanning abstraction.
 * Supports:
 *  - Camera-based scanning (expo-camera / browser getUserMedia)
 *  - Hardware scanners (Zebra DataWedge, Honeywell Intent API)
 *  - Manual keyboard-wedge input
 */

export type ScanTarget = 
  | 'material' 
  | 'workOrder' 
  | 'purchaseOrder' 
  | 'machine' 
  | 'location' 
  | 'batch'
  | 'operator'
  | 'operation'
  | 'workOrderOperation'
  | 'command';

export interface ScanResult {
  raw: string;
  format: string;          // 'qr' | 'code128' | 'ean13' | etc.
  target?: ScanTarget;     // resolved entity type
  entityId?: string;       // resolved entity ID
  timestamp: number;
  workOrderNumber?: string;
  operationCode?: string;
  command?: 'start' | 'stop' | 'pause';
}

export type ScanHandler = (result: ScanResult) => void;

// ─── Camera Scanner ────────────────────────────────────────────

export class CameraScanner {
  private stream: MediaStream | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private detector: any = null;
  private rafId: number | null = null;

  async start(videoElement: HTMLVideoElement, onScan: ScanHandler): Promise<void> {
    this.videoEl = videoElement;

    // Check for native BarcodeDetector API
    if ('BarcodeDetector' in window) {
      // @ts-ignore
      this.detector = new window.BarcodeDetector({
        formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'pdf417', 'data_matrix'],
      });
    }

    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
    });

    videoElement.srcObject = this.stream;
    await videoElement.play();

    const scanLoop = async () => {
      if (!this.videoEl || !this.detector) return;
      try {
        const barcodes = await this.detector.detect(this.videoEl);
        if (barcodes.length > 0) {
          const bc = barcodes[0];
          onScan({
            raw: bc.rawValue,
            format: bc.format,
            timestamp: Date.now(),
          });
        }
      } catch (e) {
        // Detection error — continue
      }
      this.rafId = requestAnimationFrame(scanLoop);
    };

    scanLoop();
  }

  stop(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    this.videoEl = null;
  }
}

// ─── Entity Resolution ─────────────────────────────────────────

/**
 * Prefix conventions for barcodes and QR codes:
 *   MAT-xxxx / SKU-xxxx → Material / Raw Stock
 *   PO-xxxx / SPO-xxxx  → Purchase Order (Vendor Inbound)
 *   WO-xxxx             → Work Order (Shop Floor Production)
 *   LOC-xxxx / BIN-xxxx → Storage Location / Bin
 *   MC-xxxx / WC-xxxx   → Machine / Work Center
 *   LOT-xxxx / HEAT-xxx → Batch / Lot / Heat Number
 */
export function parseScan(raw: string): ScanResult {
  const upper = raw.trim().toUpperCase();
  const result: ScanResult = { raw, format: 'unknown', timestamp: Date.now() };

  // Check for JSON QR payload
  if (raw.trim().startsWith('{') && raw.trim().endsWith('}')) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.wo && parsed.op) {
        result.target = 'workOrderOperation';
        result.workOrderNumber = String(parsed.wo).toUpperCase();
        result.operationCode = String(parsed.op).toUpperCase();
        result.entityId = `${result.workOrderNumber}/${result.operationCode}`;
        return result;
      }
      if (parsed.emp || parsed.badge) {
        result.target = 'operator';
        result.entityId = String(parsed.emp || parsed.badge).toUpperCase();
        return result;
      }
    } catch {
      // not valid JSON, proceed to regex / prefix checks
    }
  }

  // Check for Composite Barcode: WO-xxxx/OP-xx or WO-xxxx:OP-xx
  const compositeMatch = upper.match(/^(WO-[\w-]+)[\/:](OP-[\w-]+)$/i);
  if (compositeMatch) {
    result.target = 'workOrderOperation';
    result.workOrderNumber = compositeMatch[1];
    result.operationCode = compositeMatch[2];
    result.entityId = `${compositeMatch[1]}/${compositeMatch[2]}`;
    return result;
  }

  // Operator identification badge (e.g. EMP-7041, OPR-201, BADGE-99)
  if (upper.startsWith('EMP-') || upper.startsWith('OPR-') || upper.startsWith('BADGE-')) {
    result.target = 'operator';
    result.entityId = upper;
  }
  // Control Commands (e.g. CMD-START, CMD-STOP, CMD-PAUSE)
  else if (upper.startsWith('CMD-')) {
    result.target = 'command';
    result.entityId = upper;
    if (upper.includes('START') || upper.includes('IN')) result.command = 'start';
    else if (upper.includes('STOP') || upper.includes('OUT') || upper.includes('COMPLETE')) result.command = 'stop';
    else if (upper.includes('PAUSE')) result.command = 'pause';
  }
  // Standalone Operation Code (e.g. OP-10, OP-20, OP-CUT-01)
  else if (upper.startsWith('OP-')) {
    result.target = 'operation';
    result.entityId = upper;
    result.operationCode = upper;
  }
  else if (upper.startsWith('MAT-')) {
    result.target = 'material';
    result.entityId = upper;
  } else if (upper.startsWith('PO-') || upper.startsWith('SPO-')) {
    result.target = 'purchaseOrder';
    result.entityId = upper;
  } else if (upper.startsWith('WO-')) {
    result.target = 'workOrder';
    result.entityId = upper;
    result.workOrderNumber = upper;
  } else if (upper.startsWith('MC-') || upper.startsWith('WC-')) {
    result.target = 'machine';
    result.entityId = upper;
  } else if (upper.startsWith('LOC-') || upper.startsWith('BIN-') || upper.startsWith('RACK-')) {
    result.target = 'location';
    result.entityId = upper;
  } else if (upper.startsWith('LOT-') || upper.startsWith('HEAT-')) {
    result.target = 'batch';
    result.entityId = upper;
  } else {
    // Default to material for alphanumeric SKU codes (e.g. WR-1002, CS-FC300, CO-HO68)
    result.target = 'material';
    result.entityId = upper;
  }

  return result;
}

// ─── Hardware Scanner Hook ─────────────────────────────────────

/**
 * Hook for Zebra / Honeywell hardware scanners (Android).
 * These devices broadcast scan results as keyboard events or intents.
 * For web/PWA, we listen to rapid keypress sequences ending with Enter.
 */
export function createHardwareScannerListener(onScan: ScanHandler): () => void {
  let buffer = '';
  let lastKeyTime = 0;

  const handler = (e: KeyboardEvent) => {
    const now = Date.now();
    // Hardware scanners type very fast (< 30ms between chars)
    if (now - lastKeyTime > 100) buffer = '';
    lastKeyTime = now;

    if (e.key === 'Enter' && buffer.length > 3) {
      onScan({ raw: buffer, format: 'hardware', timestamp: now });
      buffer = '';
      e.preventDefault();
      return;
    }

    if (e.key.length === 1) buffer += e.key;
  };

  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}