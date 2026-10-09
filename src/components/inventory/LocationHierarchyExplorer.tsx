// src/components/inventory/LocationHierarchyExplorer.tsx

import React, { useState } from 'react';
import {
  Building2,
  Warehouse,
  Boxes,
  ChevronRight,
  ChevronDown,
  Layers,
  ArrowRightLeft,
  Plus,
  Eye,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowUpRight
} from 'lucide-react';
import {
  StorageStore,
  StorageBin,
  BinStockRecord,
  MultiLocationFilterParams
} from '../../types/inventoryLocation';
import { Plant } from '../../types';

interface LocationHierarchyExplorerProps {
  plants: Plant[];
  stores: StorageStore[];
  bins: StorageBin[];
  binStockRecords: BinStockRecord[];
  activeFilter: MultiLocationFilterParams;
  onSelectPlant: (plantId: string) => void;
  onSelectStore: (storeId: string) => void;
  onSelectBin: (binId: string) => void;
  onOpenAddLocation: (plantId?: string, storeId?: string) => void;
  onInitiateTransfer: (record: BinStockRecord) => void;
}

export const LocationHierarchyExplorer: React.FC<LocationHierarchyExplorerProps> = ({
  plants,
  stores,
  bins,
  binStockRecords,
  activeFilter,
  onSelectPlant,
  onSelectStore,
  onSelectBin,
  onOpenAddLocation,
  onInitiateTransfer
}) => {
  // Collapsed / Expanded Node State
  const [expandedPlants, setExpandedPlants] = useState<Record<string, boolean>>(() => {
    // Expand first plant by default
    const init: Record<string, boolean> = {};
    if (plants.length > 0) init[plants[0].id] = true;
    return init;
  });

  const [expandedStores, setExpandedStores] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    if (stores.length > 0) init[stores[0].id] = true;
    return init;
  });

  const togglePlant = (plantId: string) => {
    setExpandedPlants((prev) => ({ ...prev, [plantId]: !prev[plantId] }));
  };

  const toggleStore = (storeId: string) => {
    setExpandedStores((prev) => ({ ...prev, [storeId]: !prev[storeId] }));
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getStoreTypeBadge = (type: StorageStore['type']) => {
    switch (type) {
      case 'raw_materials':
        return { label: 'Raw Materials', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'finished_goods':
        return { label: 'Finished Goods', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'spares_tooling':
        return { label: 'Spares & Tooling', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'consumables':
        return { label: 'Consumables & Oils', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      default:
        return { label: type, color: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Top Header */}
      <div className="p-4 md:p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
              Physical Location Hierarchy
              <span className="text-[10px] font-mono uppercase bg-sky-500/30 text-sky-300 px-2 py-0.5 rounded font-bold">
                Plant → Store → Bin
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any node to focus live stock. Drill down from manufacturing facility to exact shelf coordinate.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeFilter.plantId !== 'all' || activeFilter.storeId !== 'all' || activeFilter.binId !== 'all' ? (
            <button
              onClick={() => {
                onSelectPlant('all');
                onSelectStore('all');
                onSelectBin('all');
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Filter className="h-3.5 w-3.5 text-sky-400" />
              Reset All Filters
            </button>
          ) : null}

          <button
            onClick={() => onOpenAddLocation()}
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Store / Bin
          </button>
        </div>
      </div>

      {/* Active Filter Breadcrumbs Indicator */}
      {(activeFilter.plantId !== 'all' || activeFilter.storeId !== 'all' || activeFilter.binId !== 'all') && (
        <div className="bg-sky-50/70 border-b border-sky-200/80 px-4 py-2.5 flex items-center justify-between text-xs text-sky-900 font-mono">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sky-700">Scoped Location Filter:</span>
            <span className="px-2 py-0.5 rounded bg-white border border-sky-300 font-bold">
              Plant: {plants.find((p) => p.id === activeFilter.plantId)?.name || 'All'}
            </span>
            {activeFilter.storeId !== 'all' && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-sky-400" />
                <span className="px-2 py-0.5 rounded bg-white border border-sky-300 font-bold">
                  Store: {stores.find((s) => s.id === activeFilter.storeId)?.name || activeFilter.storeId}
                </span>
              </>
            )}
            {activeFilter.binId !== 'all' && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-sky-400" />
                <span className="px-2 py-0.5 rounded bg-white border border-sky-300 font-bold text-sky-900">
                  Bin: {bins.find((b) => b.id === activeFilter.binId)?.code || activeFilter.binId}
                </span>
              </>
            )}
          </div>
          <button
            onClick={() => {
              onSelectPlant('all');
              onSelectStore('all');
              onSelectBin('all');
            }}
            className="text-[11px] text-sky-700 hover:text-sky-900 font-bold underline cursor-pointer"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Tree Container */}
      <div className="p-4 md:p-6 space-y-4 max-h-[640px] overflow-y-auto">
        {plants.map((plant) => {
          const isPlantExpanded = !!expandedPlants[plant.id];
          const isPlantSelected = activeFilter.plantId === plant.id;

          const plantStores = stores.filter((s) => s.plantId === plant.id);
          const plantRecords = binStockRecords.filter((r) => r.plantId === plant.id);
          const plantTotalVal = plantRecords.reduce((acc, r) => acc + r.onHandValue, 0);

          return (
            <div
              key={plant.id}
              className={`rounded-xl border transition-all ${
                isPlantSelected
                  ? 'border-sky-500 bg-sky-50/20 ring-1 ring-sky-500'
                  : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
              }`}
            >
              {/* Level 1: Plant Row */}
              <div className="p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => togglePlant(plant.id)}
                    className="p-1 rounded-lg hover:bg-slate-200/80 text-slate-500 transition-colors cursor-pointer"
                  >
                    {isPlantExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  <div className="h-8 w-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold shrink-0">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{plant.name}</h4>
                      <span className="text-[10px] font-mono uppercase bg-slate-200/80 text-slate-700 px-1.5 py-0.2 rounded font-bold">
                        Plant
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{plant.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden sm:block text-right">
                    <p className="text-[10px] font-mono uppercase text-slate-400">Total Plant Valuation</p>
                    <p className="text-xs font-black text-slate-800">{formatCurrency(plantTotalVal)}</p>
                  </div>
                  <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    <span>{plantStores.length} Stores</span>
                    <span>•</span>
                    <span>{plantRecords.length} Active Bins</span>
                  </div>

                  <button
                    onClick={() => onSelectPlant(plant.id)}
                    className={`px-3 py-1.5 text-xs font-mono font-bold uppercase rounded-lg border transition-all cursor-pointer ${
                      isPlantSelected && activeFilter.storeId === 'all'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
                    }`}
                  >
                    {isPlantSelected && activeFilter.storeId === 'all' ? 'Active Scope' : 'Filter Plant'}
                  </button>
                </div>
              </div>

              {/* Level 2: Stores under Plant */}
              {isPlantExpanded && (
                <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-200/60 space-y-3">
                  {plantStores.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 italic">
                      No warehouses or stores registered for this facility.
                      <button
                        onClick={() => onOpenAddLocation(plant.id)}
                        className="ml-2 text-sky-600 font-bold underline"
                      >
                        Add Store
                      </button>
                    </div>
                  ) : (
                    plantStores.map((store) => {
                      const isStoreExpanded = !!expandedStores[store.id];
                      const isStoreSelected = activeFilter.storeId === store.id;

                      const storeBins = bins.filter((b) => b.storeId === store.id);
                      const storeRecords = binStockRecords.filter((r) => r.storeId === store.id);
                      const storeTotalVal = storeRecords.reduce((acc, r) => acc + r.onHandValue, 0);
                      const badge = getStoreTypeBadge(store.type);

                      return (
                        <div
                          key={store.id}
                          className={`ml-4 md:ml-6 rounded-xl border transition-all ${
                            isStoreSelected
                              ? 'border-indigo-400 bg-indigo-50/20 ring-1 ring-indigo-400'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          {/* Store Header Row */}
                          <div className="p-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <button
                                onClick={() => toggleStore(store.id)}
                                className="p-1 rounded-md hover:bg-slate-100 text-slate-400 transition-colors cursor-pointer"
                              >
                                {isStoreExpanded ? (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5" />
                                )}
                              </button>
                              <div className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                                <Warehouse className="h-3.5 w-3.5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-mono font-bold bg-slate-900 text-white px-1.5 py-0.2 rounded">
                                    {store.code}
                                  </span>
                                  <h5 className="text-xs font-bold text-slate-800">{store.name}</h5>
                                  <span
                                    className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold border ${badge.color}`}
                                  >
                                    {badge.label}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  In-Charge: {store.managerName || 'Unassigned'} • {storeBins.length} Bins
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="hidden sm:block text-right">
                                <p className="text-[9px] font-mono uppercase text-slate-400">Store Value</p>
                                <p className="text-xs font-bold text-slate-800">{formatCurrency(storeTotalVal)}</p>
                              </div>

                              <button
                                onClick={() => onSelectStore(store.id)}
                                className={`px-2.5 py-1 text-[11px] font-mono font-bold uppercase rounded-lg border transition-all cursor-pointer ${
                                  isStoreSelected && activeFilter.binId === 'all'
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'
                                }`}
                              >
                                {isStoreSelected && activeFilter.binId === 'all' ? 'Filtered' : 'Filter Store'}
                              </button>
                            </div>
                          </div>

                          {/* Level 3: Storage Bins under Store */}
                          {isStoreExpanded && (
                            <div className="px-3 pb-3 pt-1 border-t border-slate-100 space-y-2">
                              {storeBins.length === 0 ? (
                                <div className="p-3 text-center text-xs text-slate-400 italic">
                                  No storage bins registered in this store yet.
                                  <button
                                    onClick={() => onOpenAddLocation(plant.id, store.id)}
                                    className="ml-2 text-sky-600 font-bold underline"
                                  >
                                    Add Bin
                                  </button>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-4">
                                  {storeBins.map((bin) => {
                                    const isBinSelected = activeFilter.binId === bin.id;
                                    const binRecords = binStockRecords.filter((r) => r.binId === bin.id);
                                    const binVal = binRecords.reduce((acc, r) => acc + r.onHandValue, 0);

                                    return (
                                      <div
                                        key={bin.id}
                                        className={`p-2.5 rounded-lg border transition-all ${
                                          isBinSelected
                                            ? 'border-sky-500 bg-sky-50/50 ring-1 ring-sky-500'
                                            : 'border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                                        }`}
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <div>
                                            <div className="flex items-center gap-1.5">
                                              <Boxes className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                              <span className="text-xs font-mono font-bold text-slate-900">
                                                {bin.code}
                                              </span>
                                              <span className="text-[10px] text-slate-400 font-mono">
                                                ({bin.binType.replace('_', ' ')})
                                              </span>
                                            </div>
                                            <p className="text-[11px] font-medium text-slate-700 mt-0.5 line-clamp-1">
                                              {bin.name}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-mono">
                                              {bin.aisle || 'No Aisle'} • {bin.rack || 'Rack'} • {bin.shelf || 'Ground'}
                                            </p>
                                          </div>

                                          <button
                                            onClick={() => onSelectBin(bin.id)}
                                            className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded border transition-colors cursor-pointer ${
                                              isBinSelected
                                                ? 'bg-sky-600 text-white border-sky-600'
                                                : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-300'
                                            }`}
                                          >
                                            {isBinSelected ? 'Focused' : 'Filter Bin'}
                                          </button>
                                        </div>

                                        {/* Stored Items in this Bin */}
                                        <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                                          <div>
                                            <span className="text-slate-400 font-mono">Items: </span>
                                            <span className="font-bold text-slate-800">
                                              {binRecords.length === 0 ? 'Empty Bin' : `${binRecords.length} SKU(s)`}
                                            </span>
                                          </div>
                                          <div className="font-mono font-bold text-slate-700">
                                            {formatCurrency(binVal)}
                                          </div>
                                        </div>

                                        {binRecords.length > 0 && (
                                          <div className="mt-1 space-y-1">
                                            {binRecords.map((br) => (
                                              <div
                                                key={br.id}
                                                className="flex items-center justify-between text-[10px] bg-white p-1 rounded border border-slate-200/50"
                                              >
                                                <div className="font-mono font-bold text-slate-800 truncate max-w-[140px]">
                                                  {br.stockItemCode}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <span className="text-slate-600 font-bold">
                                                    {br.onHandQty} {br.unit}
                                                  </span>
                                                  {br.reservedQty > 0 && (
                                                    <span className="text-amber-600 font-bold" title="Reserved qty">
                                                      ({br.reservedQty} res)
                                                    </span>
                                                  )}
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      onInitiateTransfer(br);
                                                    }}
                                                    className="p-0.5 text-sky-600 hover:text-sky-800"
                                                    title="Transfer from this bin"
                                                  >
                                                    <ArrowRightLeft className="h-3 w-3" />
                                                  </button>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
