// src/components/oee/OpcuaConfigModal.tsx

import React, { useState } from 'react';
import {
  X,
  Settings,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Server,
  Zap,
  HardDrive
} from 'lucide-react';
import { MachineConnectionConfig, MachineLiveOee } from '../../types/oee';

interface OpcuaConfigModalProps {
  machine: MachineLiveOee;
  config: MachineConnectionConfig;
  onSaveConfig: (updated: MachineConnectionConfig) => void;
  onTestPing: (machineId: string) => Promise<{ success: boolean; latencyMs: number; message: string }>;
  onClose: () => void;
}

export const OpcuaConfigModal: React.FC<OpcuaConfigModalProps> = ({
  machine,
  config,
  onSaveConfig,
  onTestPing,
  onClose
}) => {
  const [formData, setFormData] = useState<MachineConnectionConfig>({ ...config });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await onTestPing(machine.machineId);
      setTestResult(res);
    } catch {
      setTestResult({
        success: false,
        message: 'Connection failed: Unable to establish socket connection with OPC UA endpoint.'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-600 rounded-lg text-white">
              <Server size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  node-opcua v2.187 Engine
                </span>
                <span className="text-xs text-slate-400 font-mono">{machine.machineCode}</span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                OPC UA & PLC Sensor Configuration: {machine.machineName}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Test connection feedback */}
          {testResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
              testResult.success
                ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
                : 'bg-rose-950/80 border-rose-700 text-rose-200'
            }`}>
              {testResult.success ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> : <AlertTriangle size={16} className="text-rose-400 shrink-0" />}
              <div>
                <div className="font-semibold">{testResult.message}</div>
                {testResult.latencyMs && (
                  <div className="text-[11px] font-mono text-emerald-300">
                    Ping Round-trip: {testResult.latencyMs}ms · NodeId session alive
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Endpoint URL & Protocol */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                OPC UA Server Endpoint URL <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                value={formData.endpointUrl}
                onChange={e => setFormData({ ...formData, endpointUrl: e.target.value })}
                placeholder="opc.tcp://192.168.1.104:4840"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Industrial Protocol
              </label>
              <select
                value={formData.protocol}
                onChange={e => setFormData({ ...formData, protocol: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs focus:ring-2 focus:ring-cyan-500"
              >
                <option value="opc_ua">OPC UA (node-opcua)</option>
                <option value="modbus_tcp">Modbus TCP</option>
                <option value="mqtt_iot">MQTT Industrial Broker</option>
              </select>
            </div>
          </div>

          {/* Security Policy & Mode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Message Security Mode
              </label>
              <select
                value={formData.securityMode}
                onChange={e => setFormData({ ...formData, securityMode: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:ring-2 focus:ring-cyan-500"
              >
                <option value="None">None (Fastest on LAN)</option>
                <option value="Sign">Sign (Signed Headers)</option>
                <option value="SignAndEncrypt">Sign & Encrypt (AES-256)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Security Policy
              </label>
              <select
                value={formData.securityPolicy}
                onChange={e => setFormData({ ...formData, securityPolicy: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:ring-2 focus:ring-cyan-500"
              >
                <option value="None">None</option>
                <option value="Basic256Sha256">Basic256Sha256</option>
              </select>
            </div>
          </div>

          {/* NodeId Tag Mapping Section (Acceptance Criteria #2: Machine state mapping) */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-cyan-300 flex items-center justify-between">
              <span>PLC Tag & NodeId Mapping (Direct Sensor Read)</span>
              <span className="text-[10px] text-slate-400 font-mono">OPC UA Address Space</span>
            </div>

            {/* State Register Node */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span className="font-semibold">Machine State Tag (Running / Idle / Faulted / Setup)</span>
                <span className="text-cyan-400 font-mono">Codes: 1=Run, 2=Idle, 3=Fault, 4=Setup</span>
              </div>
              <input
                type="text"
                value={formData.nodeIdState}
                onChange={e => setFormData({ ...formData, nodeIdState: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-cyan-300 font-mono text-xs focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Good Parts Count */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">
                  Good Parts Counter Tag
                </label>
                <input
                  type="text"
                  value={formData.nodeIdPartsGood}
                  onChange={e => setFormData({ ...formData, nodeIdPartsGood: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-1">
                  Defect / Scrap Counter Tag
                </label>
                <input
                  type="text"
                  value={formData.nodeIdPartsScrap}
                  onChange={e => setFormData({ ...formData, nodeIdPartsScrap: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Spindle RPM & Feedrate */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">
                  Spindle Speed (RPM) Tag
                </label>
                <input
                  type="text"
                  value={formData.nodeIdSpindleRpm}
                  onChange={e => setFormData({ ...formData, nodeIdSpindleRpm: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-1">
                  Feedrate Override (%) Tag
                </label>
                <input
                  type="text"
                  value={formData.nodeIdFeedrate}
                  onChange={e => setFormData({ ...formData, nodeIdFeedrate: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Polling Interval */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-300">Telemetry Polling Rate:</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="200"
                step="100"
                value={formData.pollingIntervalMs}
                onChange={e => setFormData({ ...formData, pollingIntervalMs: parseInt(e.target.value) || 1000 })}
                className="w-20 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white font-mono text-xs text-right"
              />
              <span className="text-slate-400">ms</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-cyan-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
            >
              <RefreshCw size={14} className={testing ? 'animate-spin' : ''} />
              <span>{testing ? 'Testing Handshake...' : 'Test Ping & Handshake'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg shadow-sm transition"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
