// src/services/workInstructionService.ts

import {
  WorkInstructionDocument,
  WorkInstructionStep,
  StepSignOffRecord,
  OfflineSyncStatus,
  InstructionMedia
} from '../types/workInstruction';

const STORAGE_KEY_INSTRUCTIONS = 'flowops_digital_work_instructions';
const STORAGE_KEY_SIGNOFFS = 'flowops_instruction_signoffs';
const STORAGE_KEY_OFFLINE_QUEUE = 'flowops_instruction_offline_queue';
const STORAGE_KEY_SIMULATED_OFFLINE = 'flowops_simulated_offline_mode';

// ── Realistic Pre-loaded Digital Work Instructions ─────────────────
const SEED_WORK_INSTRUCTIONS: WorkInstructionDocument[] = [
  {
    id: 'wi-gb42t-op20',
    tenantId: 'tenant-default',
    routingOperationId: 'op-2',
    operationCode: 'OP-20',
    operationName: 'CNC Turning & OD/ID Roughing',
    partNumber: 'GB-42T',
    partName: 'Gear Blank — 42T',
    revision: 'Rev 3.2 (Approved for Production)',
    effectiveDate: '2026-01-15',
    author: 'Sunil R. Deshmukh (Lead Production Engineer)',
    approvedBy: 'Venkatesh Iyer (Chief Quality Manager)',
    workCenterName: 'Doosan Puma CNC Lathe #04',
    workCenterCode: 'WC-CNC-04',
    estimatedCycleTimeMinutes: 180,
    safetyPpeRequired: [
      'Safety Glasses with Side Shields (ANSI Z87.1)',
      'Steel Toe Work Boots (EN ISO 20345)',
      'Ear Defenders / Ear Plugs',
      'No Loose Clothing or Wrist Jewelry'
    ],
    toolingFixtures: [
      '3-Jaw Hydraulic Chuck (Soft Jaws Bored to Ø140.2mm)',
      'Roughing Insert: Sandvik CNMG 120408-PR 4325',
      'Finish Boring Bar: Sandvik A20S-SCLCR 09',
      'Bore Dial Indicator: Mitutoyo 511-711 (25-50mm range)',
      'Digital Vernier Caliper 300mm (Mitutoyo 500-197-30)'
    ],
    requiredCertifications: [
      'Fanuc 0i-TF CNC Turning Level II Operator',
      'Shopfloor Calibration & Micrometer Verification'
    ],
    standardNotes: 'Maintain coolant concentration at 7-8% Refractometer Brix. Do not start cycle without closing pneumatic interlock shield.',
    status: 'active',
    steps: [
      {
        id: 'step-gb42t-1',
        stepNumber: 1,
        title: 'Safety PPE Verification & Machine Pre-flight Inspection',
        description: 'Verify all personal protective equipment is donned. Check CNC oil lubricator level, coolant reservoir level (min 150L, 7.5% Brix concentration), and hydraulic clamping pressure accumulator reading.',
        keyPoints: [
          'Ensure hydraulic chuck pressure is set to exactly 28 ± 2 bar on the rear accumulator gauge.',
          'Verify coolant nozzles are directed at the cutting insert tip and underside chip break zone.',
          'Confirm chip conveyor is functioning in automatic continuous evacuation mode.'
        ],
        safetyWarnings: [
          'DANGER: Never enter machining envelope while spindle is spinning.',
          'Ensure spindle interlock key is engaged.'
        ],
        toolingRequired: ['Optical Brix Refractometer', 'Pressure Gauge Visual Check'],
        media: [
          {
            id: 'med-gb-step1-img1',
            type: 'image',
            title: 'Hydraulic Gauge & Coolant Refractometer Reading',
            url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
            caption: 'Verify hydraulic gauge sits in the green band (26-30 bar). Refractometer reading must show 7.0-8.0% Brix.'
          },
          {
            id: 'med-gb-step1-vid1',
            type: 'video',
            title: 'Operator 60-Second Machine Start Safety Pre-flight',
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            videoDurationSeconds: 45,
            isVideoSimulated: true,
            caption: 'Watch standard daily startup checklist: Way lube, coolant flow, emergency stop test.'
          }
        ],
        signOffRequired: true,
        signOffType: 'checklist',
        checklistItems: [
          { id: 'chk-ppe', label: 'Safety Glasses & Steel-Toe Boots verified on operator', mandatory: true },
          { id: 'chk-coolant', label: 'Coolant Brix measured between 7.0% - 8.0%', mandatory: true },
          { id: 'chk-pressure', label: 'Chuck hydraulic pressure gauge confirmed at 28 bar', mandatory: true },
          { id: 'chk-door-interlock', label: 'Door interlock safety switch tested and operational', mandatory: true }
        ],
        qualityCheckpointNote: 'Document any low oil alarms on shift log.'
      },
      {
        id: 'step-gb42t-2',
        stepNumber: 2,
        title: 'Raw Billet In-take & Heat Lot Traceability Verification',
        description: 'Inspect the incoming cut billet (EN353 / 20MnCr5). Check raw material heat code stamped on the face against the Work Order Traveler. Measure raw stock length with digital caliper.',
        keyPoints: [
          'Match the 6-digit heat lot stamped on the saw-cut face with the lot code on the traveler.',
          'Check raw billet outside diameter: Nominal Ø140mm (+1.0 / -0.5mm).',
          'Reject any billet exhibiting deep axial cracks, gouges, or saw deflection > 0.8mm.'
        ],
        safetyWarnings: [
          'Billets weigh ~7.8 kg each. Use two-hand grip and avoid pinch points when loading into parts basket.'
        ],
        toolingRequired: ['Mitutoyo 300mm Digital Caliper', 'Magnifying Inspection Loupe 5x'],
        media: [
          {
            id: 'med-gb-step2-dwg1',
            type: 'drawing',
            title: 'Engineering Blueprint: Raw Billet Acceptance & Stamp Zone',
            url: 'svg-billet-acceptance',
            drawingNumber: 'DWG-GB-42T-SHT01',
            sheetNumber: 'Sheet 1 of 4',
            cadDetails: [
              { parameter: 'Raw Stock Cut Length', nominal: 142.500, toleranceUpper: 0.500, toleranceLower: 0.000, unit: 'mm', criticalToQuality: true },
              { parameter: 'Raw Billet OD', nominal: 140.000, toleranceUpper: 1.000, toleranceLower: 0.500, unit: 'mm' },
              { parameter: 'Heat Lot Stamp Depth', nominal: 0.350, toleranceUpper: 0.150, toleranceLower: 0.100, unit: 'mm' }
            ],
            caption: 'Engineering schematic showing stamp placement area away from subsequent facing datum.'
          }
        ],
        signOffRequired: true,
        signOffType: 'measurement',
        measurementConfig: {
          parameterName: 'Raw Billet Length (Cut Dimension)',
          nominalValue: 142.500,
          upperTolerance: 0.500,
          lowerTolerance: 0.000,
          unit: 'mm',
          gaugeToolRequired: 'Mitutoyo 300mm Digital Vernier (Calibrated ID: CAL-CALIP-014)'
        },
        qualityCheckpointNote: 'Acceptable range: 142.500 mm to 143.000 mm. Material under 142.500 mm will scrap in final facing.'
      },
      {
        id: 'step-gb42t-3',
        stepNumber: 3,
        title: 'CNC Setup, Soft Jaw Trueing & Work Coordinate Offset (G54)',
        description: 'Bore soft jaws to Ø140.2mm using boring ring. Load billet into 3-jaw chuck against hard backstop. Touch off tool tips in Z and X using tool setter arm. Verify G54 coordinate system active.',
        keyPoints: [
          'Use 3-point boring ring clamped at 15 bar before finish-boring jaw serrations.',
          'Clean chuck face and billet seating surface of chips using copper scraper.',
          'Verify dial indicator runout on billet OD is within 0.030mm TIR.'
        ],
        safetyWarnings: [
          'Rotate spindle by hand in neutral before closing door to verify zero fixture collision.'
        ],
        toolingRequired: ['Sandvik Jaw Boring Ring', 'Mitutoyo Magnetic Base 0.01mm Dial Indicator'],
        media: [
          {
            id: 'med-gb-step3-vid1',
            type: 'video',
            title: 'Soft Jaw Trueing & Dial Runout Clocking SOP',
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
            videoDurationSeconds: 60,
            isVideoSimulated: true,
            caption: 'Video guide showing 3-jaw boring ring installation and dial indicator clocking technique.'
          },
          {
            id: 'med-gb-step3-dwg1',
            type: 'drawing',
            title: 'Jaw Clamping Geometry & Datum A Alignment',
            url: 'svg-jaw-clamping-datum',
            drawingNumber: 'DWG-GB-42T-SHT02',
            sheetNumber: 'Sheet 2 of 4',
            cadDetails: [
              { parameter: 'Radial Chuck Runout (TIR)', nominal: 0.000, toleranceUpper: 0.030, toleranceLower: 0.000, unit: 'mm', datumRef: 'Datum A', criticalToQuality: true },
              { parameter: 'Jaw Clamping Depth', nominal: 18.000, toleranceUpper: 1.000, toleranceLower: 0.500, unit: 'mm' }
            ],
            caption: 'Cross-section of soft jaw bite profile and backstop locator.'
          }
        ],
        signOffRequired: true,
        signOffType: 'confirmation',
        qualityCheckpointNote: 'Run dry cycle in Single Block mode with 25% rapid override on first part of batch.'
      },
      {
        id: 'step-gb42t-4',
        stepNumber: 4,
        title: 'Bore Roughing & Critical Internal Diameter Finish (Ø50.000 H7)',
        description: 'Execute roughing cycle (OD 135mm, Rough Bore Ø48mm). Swap to finish boring bar Sandvik A20S-SCLCR 09. Take final finish pass at 180 m/min, 0.08 mm/rev feed. Allow part to cool to 20°C before measuring.',
        keyPoints: [
          'H7 tolerance specification: 50.000 mm +0.025 mm / -0.000 mm.',
          'Measure bore at 3 depths (front, middle, back) and two angles (0° and 90°) to check for taper or ovality.',
          'Target sweet spot is 50.012 mm (nominal middle of tolerance band).'
        ],
        safetyWarnings: [
          'HOT BORE: Bore will expand by +0.008mm if measured immediately after cut. Use cooling air blast and wait 90 seconds.'
        ],
        toolingRequired: ['Mitutoyo Bore Micrometer 50-75mm', 'Master Ring Gauge Ø50.000mm (Grade 0)'],
        media: [
          {
            id: 'med-gb-step4-dwg1',
            type: 'drawing',
            title: 'Critical Tolerance Blueprint: Bore Ø50.000 H7 & Ra 1.6 Surface Finish',
            url: 'svg-bore-critical-h7',
            drawingNumber: 'DWG-GB-42T-SHT03',
            sheetNumber: 'Sheet 3 of 4',
            cadDetails: [
              { parameter: 'Internal Bore Ø (H7)', nominal: 50.000, toleranceUpper: 0.025, toleranceLower: 0.000, unit: 'mm', datumRef: 'Datum B', criticalToQuality: true },
              { parameter: 'Internal Surface Finish (Ra)', nominal: 1.6, toleranceUpper: 0.2, toleranceLower: 0.0, unit: 'µm', criticalToQuality: true },
              { parameter: 'Bore Chamfer (Both Ends)', nominal: 1.0, toleranceUpper: 0.2, toleranceLower: 0.2, unit: 'mm x 45°' }
            ],
            caption: 'Detailed view of the central bore profile with geometric tolerance callout and surface finish symbol.'
          },
          {
            id: 'med-gb-step4-img1',
            type: 'image',
            title: 'Visual Standard: Surface Finish Ra 1.6 Comparison Guide',
            url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=1200&q=80',
            caption: 'Reference surface finish sample plate. Surface must be free of chatter marks, spiraling, or tearing.'
          }
        ],
        signOffRequired: true,
        signOffType: 'measurement',
        measurementConfig: {
          parameterName: 'Finished Internal Bore Diameter Ø (H7)',
          nominalValue: 50.000,
          upperTolerance: 0.025,
          lowerTolerance: 0.000,
          unit: 'mm',
          gaugeToolRequired: 'Three-Point Bore Micrometer (Calibrated ID: CAL-BORE-092, Cal Exp: 2026-11)'
        },
        qualityCheckpointNote: 'FIRST PIECE APPROVAL: If measured bore is outside 50.000-50.025mm, stop machine immediately and notify Quality Inspector.'
      },
      {
        id: 'step-gb42t-5',
        stepNumber: 5,
        title: 'Deburring, Ultrasonic Wash & 2D DataMatrix Serial Marking',
        description: 'Remove part from chuck. Deburr both bore entry chamfers using ceramic deburring blade. Place in ultrasonic wash basket for 3 minutes at 60°C. Mark 2D DataMatrix serial code on designated face using dot peen marking machine.',
        keyPoints: [
          'Verify zero burrs on tooth blank outer edge and internal bore chamfer.',
          'Verify dot peen 2D DataMatrix is readable with handheld scanner (Grade A or B).',
          'Apply thin coat of rust preventive oil (Rust-Ban 397) before placing into kitting divider.'
        ],
        safetyWarnings: [
          'Use heat-resistant gloves when lifting parts out of 60°C ultrasonic wash tank.'
        ],
        toolingRequired: ['Ceramic Hand Deburrer', 'Markator Dot-Peen Marker', 'Handheld 2D Barcode Scanner'],
        media: [
          {
            id: 'med-gb-step5-dwg1',
            type: 'drawing',
            title: 'DataMatrix Marking Placement & Serialization Specs',
            url: 'svg-datamatrix-spec',
            drawingNumber: 'DWG-GB-42T-SHT04',
            sheetNumber: 'Sheet 4 of 4',
            cadDetails: [
              { parameter: 'Marking Radial Location PCD', nominal: 110.0, toleranceUpper: 1.0, toleranceLower: 1.0, unit: 'mm' },
              { parameter: 'Dot Peen Dot Depth', nominal: 0.15, toleranceUpper: 0.05, toleranceLower: 0.05, unit: 'mm' }
            ],
            caption: 'Approved laser/dot peen marking window on the non-geared front face.'
          }
        ],
        signOffRequired: true,
        signOffType: 'supervisor_approval',
        checklistItems: [
          { id: 'chk-burrs', label: 'All edges deburred with smooth 0.5mm x 45° transition', mandatory: true },
          { id: 'chk-datamatrix', label: '2D DataMatrix scanned and verified against work order serial', mandatory: true },
          { id: 'chk-rust-oil', label: 'Rust preventive oil evenly applied, placed in divider tray', mandatory: true }
        ],
        qualityCheckpointNote: 'Requires Quality Inspector / Shift Supervisor counter-signoff before transfer to OP-30 Gear Hobbing.'
      }
    ]
  },
  {
    id: 'wi-gb42t-op10',
    tenantId: 'tenant-default',
    routingOperationId: 'op-1',
    operationCode: 'OP-10',
    operationName: 'Material Cutting & Facing',
    partNumber: 'GB-42T',
    partName: 'Gear Blank — 42T',
    revision: 'Rev 2.1',
    effectiveDate: '2026-01-10',
    author: 'Sunil R. Deshmukh',
    approvedBy: 'Venkatesh Iyer',
    workCenterName: 'Horizontal Band Saw #02',
    workCenterCode: 'WC-SAW-02',
    estimatedCycleTimeMinutes: 45,
    safetyPpeRequired: ['Safety Glasses', 'Cut-Resistant Gloves (Level 5)', 'Ear Muffs', 'Steel Toe Boots'],
    toolingFixtures: ['Bi-Metal Band Saw Blade 4/6 TPI', 'Adjustable Stock Roller Conveyor', 'Hydraulic Overhead Clamp'],
    requiredCertifications: ['Machine Saw Operator Certificate'],
    standardNotes: 'Check hydraulic coolant spray direction on blade guides before beginning cutting bundle.',
    status: 'active',
    steps: [
      {
        id: 'step-saw-1',
        stepNumber: 1,
        title: 'Bar Stock Loading & Heat Lot Identification',
        description: 'Verify mill test certificate (MTC) matches EN353 material heat number stamped on the round bar. Roll bar onto conveyor and clamp firmly.',
        keyPoints: ['Confirm bar diameter is 140mm.', 'Check for surface oxidation or scale.'],
        media: [],
        signOffRequired: true,
        signOffType: 'confirmation',
        qualityCheckpointNote: 'Verify heat lot matches receipt records.'
      },
      {
        id: 'step-saw-2',
        stepNumber: 2,
        title: 'Saw Length Stop Gauge Calibration & Cut Execution',
        description: 'Set digital length stop to 142.5mm (+0.5/-0.0mm). Set blade downfeed rate to 45 mm/min. Initiate automatic cutting cycle.',
        keyPoints: ['Use flood cutting fluid.', 'Check blade squareness with machinist square.'],
        media: [],
        signOffRequired: true,
        signOffType: 'measurement',
        measurementConfig: {
          parameterName: 'Cut Billet Length',
          nominalValue: 142.500,
          upperTolerance: 0.500,
          lowerTolerance: 0.000,
          unit: 'mm',
          gaugeToolRequired: 'Digital Vernier Caliper 300mm'
        }
      }
    ]
  },
  {
    id: 'wi-ds30-op20',
    tenantId: 'tenant-default',
    routingOperationId: 'op-ds-20',
    operationCode: 'OP-20',
    operationName: 'CNC Shaft Turning & Thread Chasing',
    partNumber: 'DS-30',
    partName: 'Shaft — Drive 30mm',
    revision: 'Rev 4.0',
    effectiveDate: '2026-02-01',
    author: 'K. Parthasarathy',
    approvedBy: 'Venkatesh Iyer',
    workCenterName: 'Mazak Quick Turn 250MSY',
    workCenterCode: 'WC-CNC-02',
    estimatedCycleTimeMinutes: 75,
    safetyPpeRequired: ['Safety Glasses', 'Steel Toe Boots', 'Hearing Protection'],
    toolingFixtures: ['Hydraulic Collet Chuck', 'M24x1.5 Threading Tool', 'Mitutoyo Blade Micrometer'],
    requiredCertifications: ['CNC Turning Level II'],
    standardNotes: 'Check live center pressure on tailstock to avoid shaft bowing.',
    status: 'active',
    steps: [
      {
        id: 'step-ds30-1',
        stepNumber: 1,
        title: 'Tailstock Alignment & Center Drill Verification',
        description: 'Mount shaft in collet chuck with 180mm stickout. Engage tailstock live center with 12 bar force. Check center alignment.',
        keyPoints: ['Engage hydraulic tailstock quill.', 'Check runout < 0.015mm.'],
        media: [],
        signOffRequired: true,
        signOffType: 'confirmation'
      },
      {
        id: 'step-ds30-2',
        stepNumber: 2,
        title: 'Bearing Journal Turn & Diameter Measurement (Ø30.000 k6)',
        description: 'Turn bearing seat to precision k6 tolerance (+0.015 / +0.002 mm). Take measurement with micrometer at 20°C standard temperature.',
        keyPoints: ['Strict tolerance: 30.002 mm to 30.015 mm.', 'Zero tool wear offset before final cut.'],
        media: [],
        signOffRequired: true,
        signOffType: 'measurement',
        measurementConfig: {
          parameterName: 'Bearing Journal Diameter Ø (k6)',
          nominalValue: 30.000,
          upperTolerance: 0.015,
          lowerTolerance: 0.002,
          unit: 'mm',
          gaugeToolRequired: 'Mitutoyo Outside Micrometer 25-50mm (0.001mm resolution)'
        }
      }
    ]
  }
];

class WorkInstructionService {
  private instructions: WorkInstructionDocument[] = [];
  private signOffs: StepSignOffRecord[] = [];
  private offlineQueue: StepSignOffRecord[] = [];
  private isSimulatedOffline: boolean = false;
  private listeners: (() => void)[] = [];

  constructor() {
    this.init();
    this.setupNetworkListeners();
  }

  private init() {
    try {
      // 1. Load instructions from localStorage or seed
      const savedInstructions = localStorage.getItem(STORAGE_KEY_INSTRUCTIONS);
      if (savedInstructions) {
        this.instructions = JSON.parse(savedInstructions);
      } else {
        this.instructions = [...SEED_WORK_INSTRUCTIONS];
        this.persistInstructions();
      }

      // 2. Load sign-offs
      const savedSignOffs = localStorage.getItem(STORAGE_KEY_SIGNOFFS);
      if (savedSignOffs) {
        this.signOffs = JSON.parse(savedSignOffs);
      } else {
        // Seed initial completed sign-offs for demo
        this.signOffs = [
          {
            id: 'signoff-demo-1',
            stepId: 'step-gb42t-1',
            stepNumber: 1,
            workOrderId: 'wo-1',
            workOrderNumber: 'WO-2026-0001',
            operationId: 'op-2',
            operationName: 'CNC Turning & OD/ID Roughing',
            operatorId: 'usr-op-01',
            operatorName: 'Ramesh K. (Operator)',
            operatorBadgeNumber: 'EMP-7041',
            signedAt: new Date(Date.now() - 3600000).toISOString(),
            status: 'passed',
            signOffType: 'checklist',
            checklistCompleted: {
              'chk-ppe': true,
              'chk-coolant': true,
              'chk-pressure': true,
              'chk-door-interlock': true
            },
            synced: true,
            offlineCreated: false
          },
          {
            id: 'signoff-demo-2',
            stepId: 'step-gb42t-2',
            stepNumber: 2,
            workOrderId: 'wo-1',
            workOrderNumber: 'WO-2026-0001',
            operationId: 'op-2',
            operationName: 'CNC Turning & OD/ID Roughing',
            operatorId: 'usr-op-01',
            operatorName: 'Ramesh K. (Operator)',
            operatorBadgeNumber: 'EMP-7041',
            signedAt: new Date(Date.now() - 1800000).toISOString(),
            status: 'passed',
            signOffType: 'measurement',
            measuredValue: 142.720,
            isWithinTolerance: true,
            synced: true,
            offlineCreated: false
          }
        ];
        this.persistSignOffs();
      }

      // 3. Load offline queue
      const savedQueue = localStorage.getItem(STORAGE_KEY_OFFLINE_QUEUE);
      if (savedQueue) {
        this.offlineQueue = JSON.parse(savedQueue);
      }

      // 4. Load simulated offline mode flag
      const savedSimMode = localStorage.getItem(STORAGE_KEY_SIMULATED_OFFLINE);
      this.isSimulatedOffline = savedSimMode === 'true';
    } catch (err) {
      console.error('Failed to initialize WorkInstructionService:', err);
      this.instructions = [...SEED_WORK_INSTRUCTIONS];
    }
  }

  private setupNetworkListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        if (!this.isSimulatedOffline) {
          this.syncOfflineQueue();
        }
        this.notify();
      });
      window.addEventListener('offline', () => {
        this.notify();
      });
    }
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  private persistInstructions() {
    try {
      localStorage.setItem(STORAGE_KEY_INSTRUCTIONS, JSON.stringify(this.instructions));
    } catch (e) {
      console.warn('Storage quota exceeded persisting instructions', e);
    }
  }

  private persistSignOffs() {
    try {
      localStorage.setItem(STORAGE_KEY_SIGNOFFS, JSON.stringify(this.signOffs));
    } catch (e) {
      console.warn('Storage quota exceeded persisting sign-offs', e);
    }
  }

  private persistOfflineQueue() {
    try {
      localStorage.setItem(STORAGE_KEY_OFFLINE_QUEUE, JSON.stringify(this.offlineQueue));
    } catch (e) {
      console.warn('Storage quota exceeded persisting offline queue', e);
    }
  }

  // ── Network & Offline Helpers ─────────────────────────────────────
  public isEffectiveOnline(): boolean {
    if (this.isSimulatedOffline) return false;
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  public setSimulatedOffline(simulated: boolean) {
    this.isSimulatedOffline = simulated;
    localStorage.setItem(STORAGE_KEY_SIMULATED_OFFLINE, String(simulated));
    if (!simulated && this.isEffectiveOnline()) {
      this.syncOfflineQueue();
    }
    this.notify();
  }

  public getOfflineSyncStatus(): OfflineSyncStatus {
    const isOnline = this.isEffectiveOnline();
    let storageUsageKb = 0;
    try {
      const stored = 
        (localStorage.getItem(STORAGE_KEY_INSTRUCTIONS) || '').length +
        (localStorage.getItem(STORAGE_KEY_SIGNOFFS) || '').length +
        (localStorage.getItem(STORAGE_KEY_OFFLINE_QUEUE) || '').length;
      storageUsageKb = Math.round(stored / 1024);
    } catch {
      storageUsageKb = 48;
    }

    return {
      isOnline,
      isSimulatedOffline: this.isSimulatedOffline,
      pendingQueueCount: this.offlineQueue.length,
      cachedWorkOrdersCount: this.instructions.length,
      lastSyncTimestamp: localStorage.getItem('flowops_last_instruction_sync') || new Date().toISOString(),
      storageUsageKb: Math.max(storageUsageKb, 32)
    };
  }

  public async syncOfflineQueue(): Promise<{ syncedCount: number; errors: string[] }> {
    if (this.offlineQueue.length === 0) {
      return { syncedCount: 0, errors: [] };
    }

    const count = this.offlineQueue.length;
    // Mark queued items as synced
    const updatedSignOffs = this.signOffs.map(item => {
      const queuedMatch = this.offlineQueue.find(q => q.id === item.id);
      if (queuedMatch) {
        return { ...item, synced: true };
      }
      return item;
    });

    this.signOffs = updatedSignOffs;
    this.offlineQueue = [];
    this.persistSignOffs();
    this.persistOfflineQueue();
    localStorage.setItem('flowops_last_instruction_sync', new Date().toISOString());

    this.notify();
    return { syncedCount: count, errors: [] };
  }

  // ── Instruction Queries ───────────────────────────────────────────
  public getAllInstructions(): WorkInstructionDocument[] {
    return [...this.instructions];
  }

  public getInstructionById(id: string): WorkInstructionDocument | undefined {
    return this.instructions.find(doc => doc.id === id);
  }

  public getInstructionForOperation(
    operationCodeOrName: string,
    partNumber?: string
  ): WorkInstructionDocument | undefined {
    const cleanOp = operationCodeOrName.toLowerCase().trim();
    // 1. Exact match with part & operation
    if (partNumber) {
      const matchWithPart = this.instructions.find(
        doc =>
          doc.partNumber.toLowerCase() === partNumber.toLowerCase() &&
          (doc.operationCode.toLowerCase() === cleanOp ||
           doc.operationName.toLowerCase().includes(cleanOp) ||
           cleanOp.includes(doc.operationName.toLowerCase()))
      );
      if (matchWithPart) return matchWithPart;
    }

    // 2. Match by operation code or name
    return this.instructions.find(
      doc =>
        doc.operationCode.toLowerCase() === cleanOp ||
        doc.operationName.toLowerCase().includes(cleanOp) ||
        cleanOp.includes(doc.operationName.toLowerCase()) ||
        (doc.routingOperationId && cleanOp.includes(doc.routingOperationId.toLowerCase()))
    );
  }

  // ── Sign-off Execution & Verification ─────────────────────────────
  public getSignOffsForOperation(
    workOrderId: string,
    operationId: string
  ): StepSignOffRecord[] {
    return this.signOffs.filter(
      s => s.workOrderId === workOrderId && s.operationId === operationId
    );
  }

  public getSignOffForStep(
    workOrderId: string,
    operationId: string,
    stepId: string
  ): StepSignOffRecord | undefined {
    return this.signOffs.find(
      s => s.workOrderId === workOrderId && s.operationId === operationId && s.stepId === stepId
    );
  }

  public recordStepSignOff(params: {
    step: WorkInstructionStep;
    workOrderId: string;
    workOrderNumber: string;
    operationId: string;
    operationName: string;
    operatorId: string;
    operatorName: string;
    operatorBadgeNumber: string;
    measuredValue?: number;
    checklistCompleted?: Record<string, boolean>;
    notes?: string;
    signatureSvg?: string;
    supervisorName?: string;
    supervisorBadgeNumber?: string;
  }): { success: boolean; record: StepSignOffRecord; message: string } {
    const { step, workOrderId, workOrderNumber, operationId, operationName, operatorId, operatorName, operatorBadgeNumber } = params;

    const isOnline = this.isEffectiveOnline();
    let isWithinTolerance = true;
    let status: StepSignOffRecord['status'] = 'passed';

    // 1. Tolerance validation if measurement type
    if (step.signOffType === 'measurement' && step.measurementConfig && params.measuredValue !== undefined) {
      const { nominalValue, upperTolerance, lowerTolerance } = step.measurementConfig;
      const minAcceptable = nominalValue + lowerTolerance;
      const maxAcceptable = nominalValue + upperTolerance;

      if (params.measuredValue < minAcceptable || params.measuredValue > maxAcceptable) {
        isWithinTolerance = false;
        // If out of tolerance, requires supervisor override to pass
        if (params.supervisorName) {
          status = 'override_approved';
        } else {
          status = 'failed';
        }
      } else {
        isWithinTolerance = true;
        status = 'passed';
      }
    }

    // 2. Checklist validation
    if (step.signOffType === 'checklist' && step.checklistItems) {
      const mandatoryItems = step.checklistItems.filter(c => c.mandatory);
      const allCompleted = mandatoryItems.every(
        c => params.checklistCompleted && params.checklistCompleted[c.id] === true
      );
      if (!allCompleted) {
        return {
          success: false,
          record: null as any,
          message: 'All mandatory checklist criteria must be verified before sign-off.'
        };
      }
    }

    const newRecord: StepSignOffRecord = {
      id: `signoff-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      stepId: step.id,
      stepNumber: step.stepNumber,
      workOrderId,
      workOrderNumber,
      operationId,
      operationName,
      operatorId,
      operatorName,
      operatorBadgeNumber,
      signedAt: new Date().toISOString(),
      status,
      signOffType: step.signOffType,
      measuredValue: params.measuredValue,
      isWithinTolerance,
      checklistCompleted: params.checklistCompleted,
      notes: params.notes,
      signatureSvg: params.signatureSvg,
      supervisorName: params.supervisorName,
      supervisorBadgeNumber: params.supervisorBadgeNumber,
      supervisorApprovedAt: params.supervisorName ? new Date().toISOString() : undefined,
      synced: isOnline,
      offlineCreated: !isOnline,
      offlineTimestamp: !isOnline ? new Date().toISOString() : undefined
    };

    // Replace existing if re-signing or append
    const existingIndex = this.signOffs.findIndex(
      s => s.workOrderId === workOrderId && s.operationId === operationId && s.stepId === step.id
    );

    if (existingIndex >= 0) {
      this.signOffs[existingIndex] = newRecord;
    } else {
      this.signOffs.push(newRecord);
    }

    // Queue for sync if offline
    if (!isOnline) {
      this.offlineQueue.push(newRecord);
      this.persistOfflineQueue();
    }

    this.persistSignOffs();
    this.notify();

    return {
      success: true,
      record: newRecord,
      message: !isOnline
        ? 'Step signed off in Offline Mode. Queued for auto-sync.'
        : 'Step signed off successfully.'
    };
  }

  // ── Pre-caching Work Orders for Offline Inspection ─────────────────
  public cacheWorkOrderForOffline(workOrderNumber: string): { success: boolean; message: string } {
    // Stamp the matching instructions as cached
    const now = new Date().toISOString();
    this.instructions = this.instructions.map(inst => ({
      ...inst,
      cachedOfflineAt: now
    }));
    this.persistInstructions();
    this.notify();
    return {
      success: true,
      message: `Work Order ${workOrderNumber} and related drawings successfully pre-cached for offline tablet usage.`
    };
  }
}

export const workInstructionService = new WorkInstructionService();
