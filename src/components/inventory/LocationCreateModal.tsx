// src/components/inventory/LocationCreateModal.tsx

import React, { useState } from 'react';
import {
  X,
  Warehouse,
  Boxes,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Layers
} from 'lucide-react';
import { StorageStore, StorageBin } from '../../types/inventoryLocation';
import { Plant } from '../../types';

interface LocationCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  plants: Plant[];
  stores: StorageStore[];
  initialPlantId?: string;
  initialStoreId?: string;
  onCreateStore: (store: Omit<StorageStore, 'id' | 'createdAt'>) => Promise<any>;
  onCreateBin: (bin: Omit<StorageBin, 'id' | 'createdAt'>) => Promise<any>;
}

export const LocationCreateModal: React.FC<LocationCreateModalProps> = ({
  isOpen,
  onClose,
  plants,
  stores,
  initialPlantId,
  initialStoreId,
  onCreateStore,
  onCreateBin
}) => {
  const [mode, setMode] = useState<'store' | 'bin'>('bin');

  // Store form state
  const [storePlantId, setStorePlantId] = useState(initialPlantId || plants[0]?.id || '');
  const [storeCode, setStoreCode] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [storeType, setStoreType] = useState<StorageStore['type']>('raw_materials');
  const [storeManager, setStoreManager] = useState('');

  // Bin form state
  const [binPlantId, setBinPlantId] = useState(initialPlantId || plants[0]?.id || '');
  const [binStoreId, setBinStoreId] = useState(initialStoreId || stores[0]?.id || '');
  const [binCode, setBinCode] = useState('');
  const [binName, setBinName] = useState('');
  const [binAisle, setBinAisle] = useState('');
  const [binRack, setBinRack] = useState('');
  const [binShelf, setBinShelf] = useState('');
  const [binType, setBinType] = useState<StorageBin['binType']>('heavy_rack');
  const [binCapacity, setBinCapacity] = useState<number | ''>('');

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'err' | 'success'; text: string } | null>(null);

  if (!isOpen) return null;

  const filteredStoresForBin = stores.filter(
    (s) => !binPlantId || binPlantId === 'all' || s.plantId === binPlantId
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (mode === 'store') {
      if (!storeCode.trim() || !storeName.trim() || !storePlantId) {
        setMsg({ type: 'err', text: 'Store Code, Name, and Plant are mandatory.' });
        return;
      }

      try {
        setSubmitting(true);
        const selPlant = plants.find((p) => p.id === storePlantId);
        await onCreateStore({
          tenantId: selPlant?.tenantId || '',
          plantId: storePlantId,
          plantName: selPlant?.name || '',
          code: storeCode.trim().toUpperCase(),
          name: storeName.trim(),
          description: storeDescription.trim() || undefined,
          type: storeType,
          managerName: storeManager.trim() || undefined,
          isActive: true
        });

        setMsg({ type: 'success', text: `Store "${storeCode.toUpperCase()}" created successfully!` });
        setTimeout(() => onClose(), 1200);
      } catch (err: any) {
        setMsg({ type: 'err', text: err.message || 'Failed to create Store.' });
      } finally {
        setSubmitting(false);
      }
    } else {
      if (!binCode.trim() || !binName.trim() || !binStoreId) {
        setMsg({ type: 'err', text: 'Bin Code, Name, and Parent Store are mandatory.' });
        return;
      }

      try {
        setSubmitting(true);
        const selStore = stores.find((s) => s.id === binStoreId);
        const selPlant = plants.find((p) => p.id === (selStore?.plantId || binPlantId));

        await onCreateBin({
          tenantId: selPlant?.tenantId || '',
          plantId: selPlant?.id || '',
          storeId: binStoreId,
          storeCode: selStore?.code,
          storeName: selStore?.name,
          code: binCode.trim().toUpperCase(),
          name: binName.trim(),
          aisle: binAisle.trim() || undefined,
          rack: binRack.trim() || undefined,
          shelf: binShelf.trim() || undefined,
          binType,
          maxCapacityQty: typeof binCapacity === 'number' ? binCapacity : undefined,
          currentOccupancyPct: 0,
          isLocked: false
        });

        setMsg({ type: 'success', text: `Storage Bin "${binCode.toUpperCase()}" registered successfully!` });
        setTimeout(() => onClose(), 1200);
      } catch (err: any) {
        setMsg({ type: 'err', text: err.message || 'Failed to create Storage Bin.' });
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
              {mode === 'store' ? <Warehouse className="h-5 w-5" /> : <Boxes className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Configure Storage Hierarchy
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Plant → Store / Warehouse → Bin / Rack / Pallet Bay
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Level Switcher */}
        <div className="px-6 pt-4 border-b border-slate-200 flex gap-2">
          <button
            type="button"
            onClick={() => setMode('bin')}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase border-b-2 cursor-pointer transition-all flex items-center gap-1.5 ${
              mode === 'bin'
                ? 'border-sky-500 text-sky-700'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <Boxes className="h-4 w-4" />
            Add Storage Bin / Rack (Level 3)
          </button>
          <button
            type="button"
            onClick={() => setMode('store')}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase border-b-2 cursor-pointer transition-all flex items-center gap-1.5 ${
              mode === 'store'
                ? 'border-sky-500 text-sky-700'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <Warehouse className="h-4 w-4" />
            Add Store / Warehouse (Level 2)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {msg && (
            <div
              className={`p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-semibold ${
                msg.type === 'err'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {msg.type === 'err' ? (
                <AlertTriangle className="h-4 w-4 shrink-0" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              )}
              <span>{msg.text}</span>
            </div>
          )}

          {mode === 'store' ? (
            <>
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-500 mb-1">
                  Plant (Hierarchy Level 1)
                </label>
                <select
                  value={storePlantId}
                  onChange={(e) => setStorePlantId(e.target.value)}
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800"
                >
                  {plants.map((p) => (
                    <option key={p.id} value={p.id}>
                      🏭 {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-500 mb-1">
                    Store Code
                  </label>
                  <input
                    type="text"
                    value={storeCode}
                    onChange={(e) => setStoreCode(e.target.value)}
                    placeholder="e.g. ST-RM02"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono uppercase font-bold focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-500 mb-1">
                    Store Type
                  </label>
                  <select
                    value={storeType}
                    onChange={(e) => setStoreType(e.target.value as StorageStore['type'])}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800"
                  >
                    <option value="raw_materials">Raw Materials</option>
                    <option value="finished_goods">Finished Goods</option>
                    <option value="wip_buffer">WIP Buffer</option>
                    <option value="spares_tooling">Tooling & Spares</option>
                    <option value="consumables">Consumables & Oils</option>
                    <option value="quarantine">Quarantine & Hold</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-500 mb-1">
                  Store / Warehouse Name
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g. West Wing Billet Yard"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-500 mb-1">
                    Manager / In-Charge
                  </label>
                  <input
                    type="text"
                    value={storeManager}
                    onChange={(e) => setStoreManager(e.target.value)}
                    placeholder="e.g. Ramesh K."
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-500 mb-1">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={storeDescription}
                    onChange={(e) => setStoreDescription(e.target.value)}
                    placeholder="e.g. Equipped with 10T crane"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-500 mb-1">
                    Plant
                  </label>
                  <select
                    value={binPlantId}
                    onChange={(e) => setBinPlantId(e.target.value)}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800"
                  >
                    {plants.map((p) => (
                      <option key={p.id} value={p.id}>
                        🏭 {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-500 mb-1">
                    Parent Store (Level 2)
                  </label>
                  <select
                    value={binStoreId}
                    onChange={(e) => setBinStoreId(e.target.value)}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800"
                  >
                    {filteredStoresForBin.map((s) => (
                      <option key={s.id} value={s.id}>
                        📦 {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-500 mb-1">
                    Bin / Rack Code
                  </label>
                  <input
                    type="text"
                    value={binCode}
                    onChange={(e) => setBinCode(e.target.value)}
                    placeholder="e.g. BIN-RM-B04"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono uppercase font-bold focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-500 mb-1">
                    Storage Fixture Type
                  </label>
                  <select
                    value={binType}
                    onChange={(e) => setBinType(e.target.value as StorageBin['binType'])}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800"
                  >
                    <option value="heavy_rack">Heavy Rack</option>
                    <option value="pallet_bay">High-Bay Pallet Bay</option>
                    <option value="cantilever">Cantilever Rack (Bars/Pipes)</option>
                    <option value="shelf_bin">Small Parts Shelf Bin</option>
                    <option value="safe_cabinet">Safe Cabinet (Flammables)</option>
                    <option value="floor_staging">Floor Staging / Bunker</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-500 mb-1">
                  Bin / Location Name
                </label>
                <input
                  type="text"
                  value={binName}
                  onChange={(e) => setBinName(e.target.value)}
                  placeholder="e.g. Round Bar Cantilever Rack 04"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                    Aisle
                  </label>
                  <input
                    type="text"
                    value={binAisle}
                    onChange={(e) => setBinAisle(e.target.value)}
                    placeholder="Aisle 02"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                    Rack / Bay
                  </label>
                  <input
                    type="text"
                    value={binRack}
                    onChange={(e) => setBinRack(e.target.value)}
                    placeholder="Rack B"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                    Shelf / Tier
                  </label>
                  <input
                    type="text"
                    value={binShelf}
                    onChange={(e) => setBinShelf(e.target.value)}
                    placeholder="Tier 2"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-500 mb-1">
                  Maximum Rated Capacity (Qty / Weight)
                </label>
                <input
                  type="number"
                  value={binCapacity}
                  onChange={(e) => setBinCapacity(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 50 (tonnes or units)"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white"
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-mono font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-mono font-bold uppercase flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              {submitting ? 'Saving...' : mode === 'store' ? 'Register Store' : 'Register Bin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
