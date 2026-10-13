// src/components/inventory/BarcodeMovementTerminalModal.tsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  ScanLine,
  Camera,
  Keyboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
  Boxes,
  Building2,
  Warehouse,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  History,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  BarcodeMovementType,
  ScanMovementLog
} from '../../types/barcodeMovement';
import {
  StorageStore,
  StorageBin,
  BinStockRecord,
  StockInboundOrder,
  StockReservation
} from '../../types/inventoryLocation';
import { StockItem } from '../../types';
import { useBarcodeMovement } from '../../hooks/useBarcodeMovement';
import { CameraScanner, createHardwareScannerListener, parseScan, ScanResult } from '../../services/scannerService';
import { BarcodeLabelPrintModal } from './BarcodeLabelPrintModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialType?: BarcodeMovementType;
  stores: StorageStore[];
  bins: StorageBin[];
  binStockRecords: BinStockRecord[];
  inboundOrders: StockInboundOrder[];
  reservations: StockReservation[];
  stockItems?: StockItem[];
  onMovementCompleted?: (log: ScanMovementLog) => void;
}

export const BarcodeMovementTerminalModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialType = 'receive',
  stores,
  bins,
  binStockRecords,
  inboundOrders,
  reservations,
  stockItems = [],
  onMovementCompleted
}) => {
  const { receiveMaterial, issueMaterial, returnMaterial, playScanBeep, submitting } =
    useBarcodeMovement();

  const [activeTab, setActiveTab] = useState<BarcodeMovementType>(initialType);
  const [scannerMode, setScannerMode] = useState<'camera' | 'manual'>('manual');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
    log?: ScanMovementLog;
  } | null>(null);

  // Label Print modal state
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraScannerRef = useRef<CameraScanner | null>(null);

  // ── Receive Form State ──────────────────────────────────────
  const [receivePoNumber, setReceivePoNumber] = useState('PO-2026-902');
  const [receiveStockItemId, setReceiveStockItemId] = useState('stock-1');
  const [receiveQty, setReceiveQty] = useState('10.0');
  const [receiveBinId, setReceiveBinId] = useState('');
  const [receiveLotNumber, setReceiveLotNumber] = useState('LOT-2026-TATA-91');
  const [receiveChallan, setReceiveChallan] = useState('CH-8820');
  const [receiveNotes, setReceiveNotes] = useState('Received at Inbound Bay 1');

  // ── Issue Form State ────────────────────────────────────────
  const [issueWoNumber, setIssueWoNumber] = useState('WO-2026-001');
  const [issueStockItemId, setIssueStockItemId] = useState('stock-1');
  const [issueQty, setIssueQty] = useState('4.0');
  const [issueBinId, setIssueBinId] = useState('');
  const [issueRecipient, setIssueRecipient] = useState('WC-FORGE-2000T (Press #1)');
  const [issueNotes, setIssueNotes] = useState('Material issue for Connecting Rod forging shift 1');

  // ── Return Form State ───────────────────────────────────────
  const [returnWoNumber, setReturnWoNumber] = useState('WO-2026-002');
  const [returnStockItemId, setReturnStockItemId] = useState('stock-6');
  const [returnQty, setReturnQty] = useState('0.5');
  const [returnBinId, setReturnBinId] = useState('');
  const [returnReason, setReturnReason] = useState<'unused_excess' | 'scrap' | 'quarantine_defect'>('unused_excess');
  const [returnNotes, setReturnNotes] = useState('Uncut bar ends returned from Sawing operation');

  // Set default bins when bins list changes or tab changes
  useEffect(() => {
    if (bins.length > 0) {
      if (!receiveBinId) setReceiveBinId(bins[0].id);
      if (!issueBinId) {
        // Prefer bin with available stock for receiveStockItemId
        const match = binStockRecords.find(r => r.stockItemId === issueStockItemId && r.availableQty > 0);
        setIssueBinId(match ? match.binId : bins[0].id);
      }
      if (!returnBinId) setReturnBinId(bins[0].id);
    }
  }, [bins, binStockRecords, issueStockItemId]);

  // Sync tab with initialType if prop changes
  useEffect(() => {
    if (initialType) {
      setActiveTab(initialType);
    }
  }, [initialType]);

  // Hardware Scanner Listener
  useEffect(() => {
    if (!isOpen) return;
    const cleanup = createHardwareScannerListener((res: ScanResult) => {
      handleScannedBarcode(res.raw);
    });
    return cleanup;
  }, [isOpen, activeTab]);

  // Camera start / stop
  useEffect(() => {
    if (!isOpen || scannerMode !== 'camera' || !videoRef.current) {
      if (cameraScannerRef.current) {
        cameraScannerRef.current.stop();
        cameraScannerRef.current = null;
        setCameraActive(false);
      }
      return;
    }

    const scanner = new CameraScanner();
    cameraScannerRef.current = scanner;

    scanner.start(videoRef.current, (result) => {
      handleScannedBarcode(result.raw);
    }).then(() => {
      setCameraActive(true);
    }).catch((err) => {
      console.warn('Camera failed to start:', err);
      setScannerMode('manual');
      setStatusMessage({
        type: 'error',
        text: 'Camera access denied or unavailable. Switched to manual input.'
      });
    });

    return () => {
      scanner.stop();
      cameraScannerRef.current = null;
      setCameraActive(false);
    };
  }, [isOpen, scannerMode]);

  // Barcode Handler (Dispatches scan to form fields)
  const handleScannedBarcode = (rawCode: string) => {
    const parsed = parseScan(rawCode);
    const upper = rawCode.trim().toUpperCase();
    setBarcodeInput(upper);

    if (soundEnabled) {
      playScanBeep('success');
    }

    // Smart routing based on scan prefix or content
    if (upper.startsWith('PO-') || upper.startsWith('SPO-')) {
      setActiveTab('receive');
      setReceivePoNumber(upper);
      const matchedPo = inboundOrders.find(p => p.poNumber.toUpperCase() === upper);
      if (matchedPo) {
        setReceiveStockItemId(matchedPo.stockItemId);
        setReceiveQty(String(matchedPo.orderedQty));
      }
      setStatusMessage({
        type: 'success',
        text: `✓ Scanned Purchase Order #${upper}. Preset to Scan-to-Receive.`
      });
    } else if (upper.startsWith('WO-')) {
      setActiveTab('issue');
      setIssueWoNumber(upper);
      setStatusMessage({
        type: 'success',
        text: `✓ Scanned Work Order #${upper}. Preset to Scan-to-Issue.`
      });
    } else if (upper.startsWith('BIN-') || upper.startsWith('LOC-')) {
      const matchedBin = bins.find(b => b.code.toUpperCase() === upper || b.id.toUpperCase() === upper);
      if (matchedBin) {
        if (activeTab === 'receive') setReceiveBinId(matchedBin.id);
        else if (activeTab === 'issue') setIssueBinId(matchedBin.id);
        else setReturnBinId(matchedBin.id);
        setStatusMessage({
          type: 'success',
          text: `✓ Target Bin detected: ${matchedBin.code} (${matchedBin.name})`
        });
      }
    } else if (upper.startsWith('MAT-') || upper.startsWith('SKU-') || upper.startsWith('WR-') || upper.startsWith('RB-')) {
      const codeWithoutPrefix = upper.replace(/^MAT-/, '').replace(/^SKU-/, '');
      const matchedRec = binStockRecords.find(
        r => r.stockItemCode.toUpperCase() === upper || r.stockItemCode.toUpperCase() === codeWithoutPrefix
      );
      if (matchedRec) {
        if (activeTab === 'receive') setReceiveStockItemId(matchedRec.stockItemId);
        else if (activeTab === 'issue') {
          setIssueStockItemId(matchedRec.stockItemId);
          setIssueBinId(matchedRec.binId);
        } else {
          setReturnStockItemId(matchedRec.stockItemId);
          setReturnBinId(matchedRec.binId);
        }
        setStatusMessage({
          type: 'success',
          text: `✓ Material recognized: ${matchedRec.stockItemCode} — ${matchedRec.stockItemName}`
        });
      }
    } else {
      setStatusMessage({
        type: 'success',
        text: `✓ Barcode scanned: ${upper}`
      });
    }
  };

  // ── Inbound PO Lookup ─────────────────────────────────────────
  const selectedPo = useMemo(() => {
    return inboundOrders.find(
      p => p.poNumber.toUpperCase() === receivePoNumber.trim().toUpperCase()
    );
  }, [inboundOrders, receivePoNumber]);

  // Selected receive stock item info
  const receiveItemInfo = useMemo(() => {
    const fromBin = binStockRecords.find(r => r.stockItemId === receiveStockItemId);
    const fromMaster = stockItems.find(s => s.id === receiveStockItemId);
    return {
      code: fromBin?.stockItemCode || fromMaster?.code || 'WR-1002',
      name: fromBin?.stockItemName || fromMaster?.name || 'Wire Rod — High Tensile Steel 8mm',
      unit: fromBin?.unit || fromMaster?.unit || 'tonnes'
    };
  }, [binStockRecords, stockItems, receiveStockItemId]);

  // Selected issue stock item info
  const issueItemInfo = useMemo(() => {
    const fromBin = binStockRecords.find(r => r.stockItemId === issueStockItemId);
    const fromMaster = stockItems.find(s => s.id === issueStockItemId);
    return {
      code: fromBin?.stockItemCode || fromMaster?.code || 'WR-1002',
      name: fromBin?.stockItemName || fromMaster?.name || 'Wire Rod — High Tensile Steel 8mm',
      unit: fromBin?.unit || fromMaster?.unit || 'tonnes'
    };
  }, [binStockRecords, stockItems, issueStockItemId]);

  // Selected return stock item info
  const returnItemInfo = useMemo(() => {
    const fromBin = binStockRecords.find(r => r.stockItemId === returnStockItemId);
    const fromMaster = stockItems.find(s => s.id === returnStockItemId);
    return {
      code: fromBin?.stockItemCode || fromMaster?.code || 'RB-40CS',
      name: fromBin?.stockItemName || fromMaster?.name || 'Round Bars - Carbon Steel CS45 40mm',
      unit: fromBin?.unit || fromMaster?.unit || 'tonnes'
    };
  }, [binStockRecords, stockItems, returnStockItemId]);

  // Available stock in selected issue bin
  const selectedIssueBinRecord = useMemo(() => {
    return binStockRecords.find(
      r => r.stockItemId === issueStockItemId && r.binId === issueBinId
    );
  }, [binStockRecords, issueStockItemId, issueBinId]);

  // Target receive bin info
  const selectedReceiveBin = useMemo(() => {
    return bins.find(b => b.id === receiveBinId);
  }, [bins, receiveBinId]);

  // ── Submission Handlers ──────────────────────────────────────
  const handleConfirmReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(receiveQty);
    if (isNaN(qty) || qty <= 0) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid receive quantity (> 0).' });
      return;
    }
    if (!receiveBinId) {
      setStatusMessage({ type: 'error', text: 'Please select a destination storage bin.' });
      return;
    }

    try {
      const res = await receiveMaterial({
        poNumber: receivePoNumber.trim().toUpperCase(),
        stockItemId: receiveStockItemId,
        stockItemCode: receiveItemInfo.code,
        stockItemName: receiveItemInfo.name,
        qty,
        targetBinId: receiveBinId,
        lotNumber: receiveLotNumber.trim() || undefined,
        vendorChallanNo: receiveChallan.trim() || undefined,
        notes: receiveNotes.trim() || undefined,
        scannedBarcode: barcodeInput || receivePoNumber
      });

      setStatusMessage({
        type: 'success',
        text: `✓ Received ${qty} ${receiveItemInfo.unit} against PO #${receivePoNumber.toUpperCase()} into ${res.log.binCode}! Movement Ref: ${res.log.movementNumber}`,
        log: res.log
      });

      if (onMovementCompleted) onMovementCompleted(res.log);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to process receiving.' });
    }
  };

  const handleConfirmIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(issueQty);
    if (isNaN(qty) || qty <= 0) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid issue quantity (> 0).' });
      return;
    }
    if (!issueBinId) {
      setStatusMessage({ type: 'error', text: 'Please select a source storage bin.' });
      return;
    }
    if (selectedIssueBinRecord && selectedIssueBinRecord.onHandQty < qty) {
      setStatusMessage({
        type: 'error',
        text: `Insufficient stock in ${selectedIssueBinRecord.binCode}. On-hand is only ${selectedIssueBinRecord.onHandQty} ${selectedIssueBinRecord.unit}.`
      });
      return;
    }

    try {
      const res = await issueMaterial({
        woNumber: issueWoNumber.trim().toUpperCase(),
        stockItemId: issueStockItemId,
        stockItemCode: issueItemInfo.code,
        stockItemName: issueItemInfo.name,
        qty,
        sourceBinId: issueBinId,
        issuedToMachineOrOperator: issueRecipient.trim() || undefined,
        notes: issueNotes.trim() || undefined,
        scannedBarcode: barcodeInput || issueWoNumber
      });

      setStatusMessage({
        type: 'success',
        text: `✓ Issued ${qty} ${issueItemInfo.unit} for WO #${issueWoNumber.toUpperCase()} to ${issueRecipient}! Movement Ref: ${res.log.movementNumber}`,
        log: res.log
      });

      if (onMovementCompleted) onMovementCompleted(res.log);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to process material issue.' });
    }
  };

  const handleConfirmReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(returnQty);
    if (isNaN(qty) || qty <= 0) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid return quantity (> 0).' });
      return;
    }
    if (!returnBinId) {
      setStatusMessage({ type: 'error', text: 'Please select a destination storage bin.' });
      return;
    }

    try {
      const res = await returnMaterial({
        woNumber: returnWoNumber.trim() ? returnWoNumber.trim().toUpperCase() : undefined,
        stockItemId: returnStockItemId,
        stockItemCode: returnItemInfo.code,
        stockItemName: returnItemInfo.name,
        qty,
        targetBinId: returnBinId,
        returnReason: returnReason,
        notes: returnNotes.trim() || undefined,
        scannedBarcode: barcodeInput || returnItemInfo.code
      });

      setStatusMessage({
        type: 'success',
        text: `✓ Returned ${qty} ${returnItemInfo.unit} to bin ${res.log.binCode} (${returnReason.replace(/_/g, ' ')})! Movement Ref: ${res.log.movementNumber}`,
        log: res.log
      });

      if (onMovementCompleted) onMovementCompleted(res.log);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to process material return.' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl shadow-2xl text-slate-100 flex flex-col max-h-[95vh] overflow-hidden">
        
        {/* Terminal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400 shadow-inner">
              <ScanLine className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white">
                  Barcode Material Movement Terminal
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  REAL-TIME SYNC ON
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Instant Scan-to-Receive, Scan-to-Issue & Scan-to-Return with automatic ledger updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute Scanner Audio Chime' : 'Enable Scanner Audio Chime'}
              className={`p-2 rounded-xl text-xs font-medium border transition-colors ${
                soundEnabled
                  ? 'bg-slate-800 border-slate-700 text-indigo-400 hover:bg-slate-700'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800'
              }`}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setPrintData({
                  type: 'material',
                  code: activeTab === 'receive' ? receiveItemInfo.code : activeTab === 'issue' ? issueItemInfo.code : returnItemInfo.code,
                  title: activeTab === 'receive' ? receiveItemInfo.name : activeTab === 'issue' ? issueItemInfo.name : returnItemInfo.name,
                  subtext: activeTab === 'receive' ? `PO #${receivePoNumber} • Challan: ${receiveChallan}` : `WO #${issueWoNumber}`,
                  locationName: selectedReceiveBin ? `${selectedReceiveBin.code} (${selectedReceiveBin.name})` : 'Pune Facility Store'
                });
                setPrintModalOpen(true);
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="h-4 w-4 text-indigo-400" />
              Print Label Tag
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scanner Hardware / Camera Wedge Bar */}
        <div className="bg-slate-950/70 border-b border-slate-800/80 px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              Scanner Input:
            </span>
            <div className="relative flex-1 md:w-64">
              <input
                type="text"
                placeholder="Scan or type Barcode / QR / PO / WO..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && barcodeInput.trim()) {
                    handleScannedBarcode(barcodeInput);
                  }
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (barcodeInput.trim()) handleScannedBarcode(barcodeInput);
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold font-mono"
            >
              Apply
            </button>
          </div>

          {/* Quick Simulation Chips for Shop Floor Demo / Testing */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-500">Fast Simulators:</span>
            <button
              type="button"
              onClick={() => handleScannedBarcode('PO-2026-902')}
              className="px-2 py-0.5 rounded-lg bg-sky-950/80 hover:bg-sky-900 border border-sky-800/80 text-sky-300 font-mono transition-colors"
            >
              Scan PO-2026-902
            </button>
            <button
              type="button"
              onClick={() => handleScannedBarcode('WO-2026-001')}
              className="px-2 py-0.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-800/80 text-amber-300 font-mono transition-colors"
            >
              Scan WO-2026-001
            </button>
            <button
              type="button"
              onClick={() => handleScannedBarcode('MAT-RB-40CS')}
              className="px-2 py-0.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/80 text-emerald-300 font-mono transition-colors"
            >
              Scan MAT-RB-40CS
            </button>
            <button
              type="button"
              onClick={() => handleScannedBarcode('BIN-RM-A01')}
              className="px-2 py-0.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800/80 text-indigo-300 font-mono transition-colors"
            >
              Scan Bin A01
            </button>
            <button
              type="button"
              onClick={() => setScannerMode(scannerMode === 'camera' ? 'manual' : 'camera')}
              className={`px-2.5 py-0.5 rounded-lg border font-mono flex items-center gap-1 transition-colors ${
                scannerMode === 'camera'
                  ? 'bg-indigo-600 border-indigo-400 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Camera className="h-3 w-3" />
              {scannerMode === 'camera' ? 'Camera ON' : 'Use Camera'}
            </button>
          </div>
        </div>

        {/* Live Camera Viewfinder (if enabled) */}
        {scannerMode === 'camera' && (
          <div className="relative bg-black border-b border-slate-800 max-h-56 overflow-hidden flex items-center justify-center">
            <video
              ref={videoRef}
              className="w-full max-h-56 object-cover"
              playsInline
              muted
            />
            {/* Viewfinder crosshairs */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-56 h-36 border-2 border-indigo-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-indigo-400 rounded-tl" />
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-indigo-400 rounded-tr" />
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-indigo-400 rounded-bl" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-indigo-400 rounded-br" />
                <div className="absolute left-2 right-2 h-0.5 bg-indigo-400 animate-pulse top-1/2" />
                <div className="absolute bottom-2 inset-x-0 text-center text-[10px] font-mono text-indigo-300 bg-slate-900/60 py-0.5">
                  Point at PO, WO, or Material Barcode
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setScannerMode('manual')}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Status Toast / Alert Banner */}
        {statusMessage && (
          <div
            className={`px-6 py-2.5 border-b flex items-center justify-between text-xs font-medium transition-all ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
                : 'bg-rose-950/80 border-rose-800 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            {statusMessage.log && (
              <button
                type="button"
                onClick={() => {
                  setPrintData({
                    type: statusMessage.log?.type === 'receive' ? 'po' : 'wo',
                    code: statusMessage.log?.scannedBarcode || statusMessage.log?.movementNumber,
                    title: statusMessage.log?.stockItemName,
                    subtext: `${statusMessage.log?.qty} ${statusMessage.log?.unit} • Ref: ${statusMessage.log?.referenceNumber}`,
                    locationName: `${statusMessage.log?.binCode} (${statusMessage.log?.storeName})`
                  });
                  setPrintModalOpen(true);
                }}
                className="px-2 py-0.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded font-mono text-[11px] flex items-center gap-1"
              >
                <Printer className="h-3 w-3" /> Print Tag
              </button>
            )}
          </div>
        )}

        {/* Workflow Tabs: Receive against PO, Issue against WO, Return to Stock */}
        <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-900/60">
          <button
            type="button"
            onClick={() => {
              setActiveTab('receive');
              setStatusMessage(null);
            }}
            className={`py-3.5 px-4 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'receive'
                ? 'border-sky-500 bg-sky-500/10 text-sky-400 shadow-inner'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <ArrowDownToLine className="h-4 w-4 text-sky-400" />
            1. Scan-to-Receive (PO)
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('issue');
              setStatusMessage(null);
            }}
            className={`py-3.5 px-4 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'issue'
                ? 'border-amber-500 bg-amber-500/10 text-amber-400 shadow-inner'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <ArrowUpFromLine className="h-4 w-4 text-amber-400" />
            2. Scan-to-Issue (WO)
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('return');
              setStatusMessage(null);
            }}
            className={`py-3.5 px-4 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'return'
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-inner'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <RotateCcw className="h-4 w-4 text-emerald-400" />
            3. Scan-to-Return (Stock)
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* ═══════════════════════════════════════════════════════
              TAB 1: SCAN-TO-RECEIVE (AGAINST PO)
             ═══════════════════════════════════════════════════════ */}
          {activeTab === 'receive' && (
            <form onSubmit={handleConfirmReceive} className="space-y-5">
              <div className="bg-sky-950/30 border border-sky-800/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 shrink-0">
                    <ArrowDownToLine className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-sky-200">
                      Inbound Material Inwarding (Against Purchase Order)
                    </h3>
                    <p className="text-xs text-sky-300/70">
                      Scan vendor PO or delivery challan to accept materials into physical storage bins.
                    </p>
                  </div>
                </div>
                {selectedPo && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-sky-500/20 text-sky-300 border border-sky-400/30 font-bold">
                    Vendor: {selectedPo.supplierName}
                  </span>
                )}
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Purchase Order Selector / Input */}
                <div>
                  <label className="text-xs font-mono text-slate-300 font-semibold uppercase block mb-1.5">
                    Purchase Order Number (PO #) *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={receivePoNumber}
                      onChange={(e) => setReceivePoNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. PO-2026-902"
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:border-sky-500 focus:outline-none"
                    />
                    <select
                      onChange={(e) => {
                        const po = inboundOrders.find(p => p.poNumber === e.target.value);
                        if (po) {
                          setReceivePoNumber(po.poNumber);
                          setReceiveStockItemId(po.stockItemId);
                          setReceiveQty(String(po.orderedQty));
                        }
                      }}
                      className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-300 font-mono focus:border-sky-500"
                    >
                      <option value="">Select Inbound PO</option>
                      {inboundOrders.map((p) => (
                        <option key={p.id} value={p.poNumber}>
                          {p.poNumber} — {p.stockItemCode} ({p.orderedQty} {p.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Material Item Selector */}
                <div>
                  <label className="text-xs font-mono text-slate-300 font-semibold uppercase block mb-1.5">
                    Material Item (SKU) *
                  </label>
                  <select
                    value={receiveStockItemId}
                    onChange={(e) => setReceiveStockItemId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
                  >
                    {binStockRecords
                      .reduce((acc, curr) => {
                        if (!acc.some(i => i.stockItemId === curr.stockItemId)) acc.push(curr);
                        return acc;
                      }, [] as BinStockRecord[])
                      .map((r) => (
                        <option key={r.stockItemId} value={r.stockItemId}>
                          {r.stockItemCode} — {r.stockItemName}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Receive Quantity & Unit */}
                <div>
                  <label className="text-xs font-mono text-slate-300 font-semibold uppercase block mb-1.5">
                    Quantity Received ({receiveItemInfo.unit}) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="0.001"
                      required
                      value={receiveQty}
                      onChange={(e) => setReceiveQty(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:border-sky-500 focus:outline-none"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
                      {receiveItemInfo.unit}
                    </span>
                  </div>
                  {selectedPo && (
                    <p className="text-[11px] text-sky-400 font-mono mt-1">
                      Ordered balance pending delivery: {selectedPo.orderedQty} {selectedPo.unit}
                    </p>
                  )}
                </div>

                {/* Target Storage Bin */}
                <div>
                  <label className="text-xs font-mono text-slate-300 font-semibold uppercase block mb-1.5">
                    Target Storage Bin (Destination) *
                  </label>
                  <select
                    value={receiveBinId}
                    onChange={(e) => setReceiveBinId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none font-mono"
                  >
                    {bins.map((b) => {
                      const store = stores.find(s => s.id === b.storeId);
                      return (
                        <option key={b.id} value={b.id}>
                          {b.code} ({b.name}) — {store?.name || 'Store'}
                        </option>
                      );
                    })}
                  </select>
                  {selectedReceiveBin && (
                    <p className="text-[11px] text-slate-400 font-mono mt-1">
                      Bin Capacity: {selectedReceiveBin.maxCapacityQty || 50} {receiveItemInfo.unit}
                    </p>
                  )}
                </div>

                {/* Heat / Lot Number */}
                <div>
                  <label className="text-xs font-mono text-slate-300 font-semibold uppercase block mb-1.5">
                    Lot / Heat / Coil Batch Number
                  </label>
                  <input
                    type="text"
                    value={receiveLotNumber}
                    onChange={(e) => setReceiveLotNumber(e.target.value)}
                    placeholder="e.g. LOT-2026-TATA-91"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>

                {/* Vendor Challan / Invoice */}
                <div>
                  <label className="text-xs font-mono text-slate-300 font-semibold uppercase block mb-1.5">
                    Vendor Challan / Invoice #
                  </label>
                  <input
                    type="text"
                    value={receiveChallan}
                    onChange={(e) => setReceiveChallan(e.target.value)}
                    placeholder="e.g. CH-8820"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-mono text-slate-300 font-semibold uppercase block mb-1.5">
                  Inspection / Receiving Notes
                </label>
                <input
                  type="text"
                  value={receiveNotes}
                  onChange={(e) => setReceiveNotes(e.target.value)}
                  placeholder="Gate pass, physical condition, packaging remarks..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-sky-600/30 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {submitting ? 'Updating Inventory...' : 'Confirm Inward & Update Inventory'}
                </button>
              </div>
            </form>
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB 2: SCAN-TO-ISSUE (AGAINST WO)
             ═══════════════════════════════════════════════════════ */}
          {activeTab === 'issue' && (
            <form onSubmit={handleConfirmIssue} className="space-y-5">
              <div className="bg-amber-950/30 border border-amber-800/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
                    <ArrowUpFromLine className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-200">
                      Outward Material Issue (Against Work Order)
                    </h3>
                    <p className="text-xs text-amber-300/70">
                      Scan Work Order traveler or machine job ticket to dispense raw materials to the shop floor.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold">
                  Deducts On-Hand & Fulfills Reservation
                </span>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Work Order # */}
                <div>
                  <label className="text-xs font-mono text-slate-300 font-semibold uppercase block mb-1.5">
                    Work Order Reference (WO #) *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={issueWoNumber}
                      onChange={(e) => setIssueWoNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. WO-2026-001"
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:border-amber-500 focus:outline-none"
                    />
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          setIssueWoNumber(val);
                          // Auto match reservation if exists
                          const matchRes = reservations.find(r => r.orderNumber.toUpperCase() === val.toUpperCase());
                          if (matchRes) {
                            setIssueStockItemId(matchRes.stockItemId);
                            setIssueQty(String(matchRes.reservedQty));
                          }
                        }
                      }}
                      className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-300 font-mono focus:border-amber-500"
                    >
                      <option value="">Preset Active WOs</option>
                      <option value="WO-2026-001">WO-2026-001 (Connecting Rod)</option>
                      <option value="WO-2026-002">WO-2026-002 (Flange Shaft)</option>
                      <option value="WO-2026-003">WO-2026-003 (Steering Knuckle)</option>
                    </select>
                  </div>
                </div>

                {/* Material Item Selector */}
                <div>
                  <label className="text-xs font-mono text-slate-300 font-semibold uppercase block mb-1.5">
                    Material Item (SKU) *
                  </label>
                  <select
                    value={issueStockItemId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setIssueStockItemId(id);
                      const match = binStockRecords.find(r => r.stockItemId === id && r.availableQty > 0);
                      if (match) setIssueBinId(match.binId);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                  >
                    {binStockRecords
                      .reduce((acc, curr) => {
                        if (!acc.some(i => i.stockItemId === curr.stockItemId)) acc.push(curr);
                        return acc;
                      }, [] as BinStockRecord[])
                      .map((r) => (
                        <option key={r.stockItemId} value={r.stockItemId}>
                          {r.stockItemCode} — {r.stockItemName}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Source Bin Selector */}
                <div>
                  <label className="text-xs font-mono text-slate-300 font-semibold uppercase block mb-1.5">
                    Source Storage Bin (Where Material is Picked) *
                  </label>
                  <select
                    value={issueBinId}
                    onChange={(e) => setIssueBinId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none font-mono"
                  >
                    {bins.map((b) => {
                      const rec = binStockRecords.find(
                        r => r.stockItemId === issueStockItemId && r.binId === b.id
                      );
                      return (
                        <option key={b.id} value={b.id}>
                          {b.code} ({b.name}) — On-Hand: {rec ? rec.onHandQty : 0} {issueItemInfo.unit} (Avail: {rec ? rec.availableQty : 0})
                        </option>
                      );
                    })}
                  </select>
                  {selectedIssueBinRecord && (
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] font-mono">
                      <span className="text-emerald-400">
                        Physical On-Hand: {selectedIssueBinRecord.onHandQty} {selectedIssueBinRecord.unit}
                      </span>
                      <span className="text-amber-400">
                        Reserved: {selectedIssueBinRecord.reservedQty} {selectedIssueBinRecord.unit}
                      </span>
                      <span className="text-sky-400">
                        Available: {selectedIssueBinRecord.availableQty} {selectedIssueBinRecord.unit}
                      </span>
                    </div>
                  )}
                </div>

                {/* Issue Quantity */}
                <div>
                  <label className="text-xs font-mono text-slate-300 font-semibold uppercase block mb-1.5">
                    Quantity to Issue ({issueItemInfo.unit}) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="0.001"
                      required
                      value={issueQty}
                      onChange={(e) => setIssueQty(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:border-amber-500 focus:outline-none"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
                      {issueItemInfo.unit}
                    </span>
                  </div>
                </div>

                {/* Target Machine / Work Center / Operator */}
                <div>
                  <label className="text-xs font-mono text-slate-300 font-semibold uppercase block mb-1.5">
                    Issued To (Machine / Work Center / Operator)
                  </label>
                  <input
                    type="text"
                    value={issueRecipient}
                    onChange={(e) => setIssueRecipient(e.target.value)}
                    placeholder="e.g. WC-FORGE-2000T (Press #1) or Operator ID"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-mono text-slate-300 font-semibold uppercase block mb-1.5">
                    Shift / Routing Remarks
                  </label>
                  <input
                    type="text"
                    value={issueNotes}
                    onChange={(e) => setIssueNotes(e.target.value)}
                    placeholder="Shift 1 batch run, operator signature..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-amber-600/30 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {submitting ? 'Deducting Stock...' : 'Confirm Outward Issue & Deduct Stock'}
                </button>
              </div>
            </form>
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB 3: SCAN-TO-RETURN (RETURN TO STOCK)
             ═══════════════════════════════════════════════════════ */}
          {activeTab === 'return' && (
            <form onSubmit={handleConfirmReturn} className="space-y-5">
              <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <RotateCcw className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-200">
                      Material Return to Storage (Surplus / Scrap / Quarantine)
                    </h3>
                    <p className="text-xs text-emerald-300/70">
                      Scan materials returned from the factory floor to replenish storage bins or isolate defects.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
                  Restores On-Hand Inventory
                </span>
              </div>

              {/* Return Reason Selector Cards */}
              <div>
                <label className="text-xs font-mono text-slate-300 font-semibold uppercase block mb-1.5">
                  Return Disposition Category *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setReturnReason('unused_excess')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      returnReason === 'unused_excess'
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 font-bold'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      Unused Surplus Stock
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Clean material return; ready for future work orders
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReturnReason('scrap')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      returnReason === 'scrap'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                      Machine Off-Cuts / Scrap
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Short bar ends, stamping skeletons, swarf
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReturnReason('quarantine_defect')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      returnReason === 'quarantine_defect'
                        ? 'bg-rose-500/20 border-rose-400 text-rose-200 font-bold'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <X className="h-3.5 w-3.5 text-rose-400" />
                      Quarantine / Defect Hold
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Damaged or out-of-tolerance stock for QA review
                    </p>
                  </button>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Work Order Reference (Optional) */}
                <div>
                  <label className="text-xs font-mono text-slate-300 font-semibold uppercase block mb-1.5">
                    Original Work Order # (Optional)
                  </label>
                  <input
                    type="text"
                    value={returnWoNumber}
                    onChange={(e) => setReturnWoNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. WO-2026-002"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Material Item Selector */}
                <div>
                  <label className="text-xs font-mono text-slate-300 font-semibold uppercase block mb-1.5">
                    Material Item (SKU) *
                  </label>
                  <select
                    value={returnStockItemId}
                    onChange={(e) => setReturnStockItemId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {binStockRecords
                      .reduce((acc, curr) => {
                        if (!acc.some(i => i.stockItemId === curr.stockItemId)) acc.push(curr);
                        return acc;
                      }, [] as BinStockRecord[])
                      .map((r) => (
                        <option key={r.stockItemId} value={r.stockItemId}>
                          {r.stockItemCode} — {r.stockItemName}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Return Quantity */}
                <div>
                  <label className="text-xs font-mono text-slate-300 font-semibold uppercase block mb-1.5">
                    Quantity Returned ({returnItemInfo.unit}) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="0.001"
                      required
                      value={returnQty}
                      onChange={(e) => setReturnQty(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:border-emerald-500 focus:outline-none"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
                      {returnItemInfo.unit}
                    </span>
                  </div>
                </div>

                {/* Target Storage Bin */}
                <div>
                  <label className="text-xs font-mono text-slate-300 font-semibold uppercase block mb-1.5">
                    Destination Storage Bin *
                  </label>
                  <select
                    value={returnBinId}
                    onChange={(e) => setReturnBinId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none font-mono"
                  >
                    {bins.map((b) => {
                      const store = stores.find(s => s.id === b.storeId);
                      return (
                        <option key={b.id} value={b.id}>
                          {b.code} ({b.name}) — {store?.name || 'Store'}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-mono text-slate-300 font-semibold uppercase block mb-1.5">
                  Return Reasons & Supervisor Notes
                </label>
                <input
                  type="text"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Reason for return, quality status, batch details..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {submitting ? 'Updating Inventory...' : 'Confirm Return to Stock'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Terminal Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2 font-mono">
          <div className="flex items-center gap-3">
            <span>● Hardware Wedge Listener Active (Zebra/Honeywell/USB)</span>
            <span>● Auto Reticle Active</span>
          </div>
          <div>
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">ESC</kbd> to Close
          </div>
        </div>
      </div>

      {/* Barcode Print Modal */}
      <BarcodeLabelPrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        defaultData={printData}
      />
    </div>
  );
};
