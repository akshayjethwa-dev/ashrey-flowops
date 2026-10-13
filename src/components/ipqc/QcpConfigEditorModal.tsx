// src/components/ipqc/QcpConfigEditorModal.tsx

import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  FileCheck2,
  Ruler,
  Sliders,
  CheckCircle2,
  Lock,
  Layers,
  Rotate3d
} from 'lucide-react';
import {
  QualityControlPointConfig,
  QcpParameter,
  Part3DMarker,
  QcpTriggerType,
  QcpGateType,
  PartModelType
} from '../../types/ipqc';
import { Part3DMarkingViewer } from './Part3DMarkingViewer';

interface QcpConfigEditorModalProps {
  config?: QualityControlPointConfig | null;
  onClose: () => void;
  onSaveConfig: (configData: any) => Promise<any>;
}

export const QcpConfigEditorModal: React.FC<QcpConfigEditorModalProps> = ({
  config,
  onClose,
  onSaveConfig
}) => {
  const isEditing = Boolean(config);

  const [operationCode, setOperationCode] = useState<string>(config?.operationCode || 'OP-CNC-02');
  const [operationName, setOperationName] = useState<string>(config?.operationName || 'CNC Turning & Finish Facing');
  const [sequenceNumber, setSequenceNumber] = useState<number>(config?.sequenceNumber || 20);
  const [partNumber, setPartNumber] = useState<string>(config?.partNumber || 'PART-FLG-750');
  const [partName, setPartName] = useState<string>(config?.partName || 'Precision Valve Flange Dia 180mm');
  const [triggerType, setTriggerType] = useState<QcpTriggerType>(config?.triggerType || 'first_piece');
  const [gateType, setGateType] = useState<QcpGateType>(config?.gateType || 'mandatory_hold');
  const [partModelType, setPartModelType] = useState<PartModelType>(config?.partModelType || 'flange_valve');
  const [instructions, setInstructions] = useState<string>(
    config?.instructions || 'Inspect first article piece thoroughly before releasing machine for batch run.'
  );

  const [markers, setMarkers] = useState<Part3DMarker[]>(
    config?.markers || [
      {
        id: 'm-1',
        label: 'Pt 1: Outer Diameter',
        x: 82,
        y: 48,
        z: 1,
        viewPerspective: 'isometric',
        featureDescription: 'Turned outer diameter',
        nominalValue: 180.0,
        toleranceMin: 179.95,
        toleranceMax: 180.05,
        unit: 'mm',
        status: 'pending'
      },
      {
        id: 'm-2',
        label: 'Pt 2: Internal Bore ID',
        x: 50,
        y: 50,
        z: 2,
        viewPerspective: 'isometric',
        featureDescription: 'Precision H7 internal guide bore',
        nominalValue: 75.0,
        toleranceMin: 75.0,
        toleranceMax: 75.025,
        unit: 'mm',
        status: 'pending'
      }
    ]
  );

  const [parameters, setParameters] = useState<QcpParameter[]>(
    config?.parameters || [
      {
        id: 'qp-1',
        parameterName: 'Internal Guide Bore Diameter',
        characteristicType: 'dimensional',
        toleranceType: 'two_sided',
        unit: 'mm',
        nominalValue: 75.0,
        lowerTolerance: 75.0,
        upperTolerance: 75.025,
        gaugeOrInstrument: 'Mitutoyo 3-Point Bore Micrometer',
        criticality: 'critical',
        sampleFrequency: '1st Pc + 1 every 10 pcs',
        requiredSamples: 3,
        markerId: 'm-2'
      }
    ]
  );

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleAddMarkerAtCoord = (coord: { x: number; y: number; viewPerspective: any }) => {
    const newMarker: Part3DMarker = {
      id: `m-${Date.now()}`,
      label: `Pt ${markers.length + 1}: Feature`,
      x: coord.x,
      y: coord.y,
      z: 1,
      viewPerspective: coord.viewPerspective,
      featureDescription: 'Surface inspection point',
      status: 'pending'
    };
    setMarkers([...markers, newMarker]);
  };

  const handleAddParameter = () => {
    const newParam: QcpParameter = {
      id: `qp-${Date.now()}`,
      parameterName: 'New Inspection Feature',
      characteristicType: 'dimensional',
      toleranceType: 'two_sided',
      unit: 'mm',
      nominalValue: 50.0,
      lowerTolerance: 49.95,
      upperTolerance: 50.05,
      gaugeOrInstrument: 'Digital Caliper',
      criticality: 'major',
      sampleFrequency: '1st Pc FAI',
      requiredSamples: 3
    };
    setParameters([...parameters, newParam]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await onSaveConfig({
        id: config?.id,
        operationCode,
        operationName,
        sequenceNumber,
        partNumber,
        partName,
        triggerType,
        gateType,
        mandatoryHoldPoint: gateType === 'mandatory_hold',
        partModelType,
        parameters,
        markers,
        instructions,
        mandatorySignOffRole: 'quality_inspector',
        isActive: true
      });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {config ? `Edit QCP: ${config.operationCode}` : 'Configure Quality Control Point (QCP) on Routing Operation'}
              </h2>
              <p className="text-xs text-slate-400">
                Bind automated in-process inspection tasks, hold gates, and 3D surface pins to operations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          
          {/* Metadata Grid */}
          <div className="bg-slate-800/40 border border-slate-700/80 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Operation Sequence #</label>
              <input
                type="number"
                value={sequenceNumber}
                onChange={(e) => setSequenceNumber(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Operation Code</label>
              <input
                type="text"
                value={operationCode}
                onChange={(e) => setOperationCode(e.target.value)}
                placeholder="e.g. OP-CNC-02"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Operation Name</label>
              <input
                type="text"
                value={operationName}
                onChange={(e) => setOperationName(e.target.value)}
                placeholder="e.g. CNC Turning & Facing"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Part SKU</label>
              <input
                type="text"
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
                placeholder="e.g. PART-FLG-750"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Part Name</label>
              <input
                type="text"
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
                placeholder="e.g. Valve Flange 180mm"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">3D Part CAD Model</label>
              <select
                value={partModelType}
                onChange={(e) => setPartModelType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="flange_valve">Circular Valve Flange (Dia 180mm)</option>
                <option value="gear_shaft">Precision Stepped Shaft with Keyway</option>
                <option value="machined_housing">Machined Gearbox Line Bore Housing</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Task Trigger Point</label>
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="first_piece">First Article / First Piece (FAI)</option>
                <option value="periodic_interval">Periodic Interval (Hourly / 15 pcs)</option>
                <option value="final_operation_gate">Final Operation Gate Check</option>
                <option value="tool_change">Tool Change / Cutter Replacement</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Shopfloor Gate Type</label>
              <select
                value={gateType}
                onChange={(e) => setGateType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="mandatory_hold">Mandatory Hold (Blocks Machine)</option>
                <option value="warning_alert">Warning Alert (Non-blocking)</option>
                <option value="sampling_audit">Background Quality Audit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Special Operator Instructions</label>
              <input
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Verify bore ID before releasing"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          {/* 3D Part Pin Setup */}
          <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-4">
            <h3 className="text-xs font-mono uppercase text-slate-400 font-bold mb-2 flex items-center gap-2">
              <Rotate3d className="w-4 h-4 text-blue-400" />
              Interactive 3D Part Surface Pin Marking ({markers.length} points defined)
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Click anywhere on the part surface in the viewer to anchor a new inspection pin.
            </p>
            <Part3DMarkingViewer
              modelType={partModelType}
              partName={partName}
              partNumber={partNumber}
              markers={markers}
              onSelectMarker={() => {}}
              onAddMarkerAtCoordinate={handleAddMarkerAtCoord}
            />
          </div>

          {/* Parameters Builder */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono uppercase text-slate-400 font-bold flex items-center gap-2">
                <Ruler className="w-4 h-4 text-blue-400" />
                Inspection Characteristics & Tolerances ({parameters.length})
              </h3>
              <button
                type="button"
                onClick={handleAddParameter}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Characteristic
              </button>
            </div>

            <div className="space-y-3">
              {parameters.map((param, index) => (
                <div key={param.id} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400 font-mono">#{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => setParameters(parameters.filter(p => p.id !== param.id))}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-slate-400 mb-0.5">Characteristic Name</label>
                      <input
                        type="text"
                        value={param.parameterName}
                        onChange={(e) => {
                          const updated = [...parameters];
                          updated[index].parameterName = e.target.value;
                          setParameters(updated);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-0.5">Min Spec</label>
                      <input
                        type="number"
                        step="0.001"
                        value={param.lowerTolerance ?? ''}
                        onChange={(e) => {
                          const updated = [...parameters];
                          updated[index].lowerTolerance = parseFloat(e.target.value) || undefined;
                          setParameters(updated);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-0.5">Max Spec</label>
                      <input
                        type="number"
                        step="0.001"
                        value={param.upperTolerance ?? ''}
                        onChange={(e) => {
                          const updated = [...parameters];
                          updated[index].upperTolerance = parseFloat(e.target.value) || undefined;
                          setParameters(updated);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : 'Save QCP Configuration'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
