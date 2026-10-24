// src/pages/production/ProductionDashboardPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { productionDashboardService } from '../../services/productionDashboardService';
import { 
  ProductionPlanSummary, 
  HourlyProductionPoint, 
  WipOperationStage, 
  BottleneckAlert, 
  MachineOeeCardData 
} from '../../types/productionDashboard';
import { OeeMachineChart } from '../../components/production-dashboard/OeeMachineChart';
import { ProductionVsPlanSection } from '../../components/production-dashboard/ProductionVsPlanSection';
import { WipByStageFlow } from '../../components/production-dashboard/WipByStageFlow';
import { BottleneckHighlightCard } from '../../components/production-dashboard/BottleneckHighlightCard';
import { useToast } from '../../context/ToastContext';
import { 
  Factory, 
  RefreshCw, 
  Flame, 
  Target, 
  Layers, 
  Gauge, 
  ArrowLeft, 
  TrendingUp, 
  Zap, 
  Sliders, 
  ChevronRight,
  Tablet,
  CheckCircle2
} from 'lucide-react';

export const ProductionDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const { toastSuccess, toastInfo } = useToast();

  // State
  const [planSummary, setPlanSummary] = useState<ProductionPlanSummary>(
    productionDashboardService.getProductionPlanSummary()
  );
  const [hourlyPoints, setHourlyPoints] = useState<HourlyProductionPoint[]>(
    productionDashboardService.getHourlyProduction()
  );
  const [stages, setStages] = useState<WipOperationStage[]>(
    productionDashboardService.getWipStages()
  );
  const [bottleneck, setBottleneck] = useState<BottleneckAlert>(
    productionDashboardService.getBottleneckAlert()
  );
  const [machines, setMachines] = useState<MachineOeeCardData[]>(
    productionDashboardService.getMachineFleet()
  );

  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'bottleneck' | 'oee' | 'wip'>('all');

  const refreshAll = () => {
    setPlanSummary(productionDashboardService.getProductionPlanSummary());
    setHourlyPoints(productionDashboardService.getHourlyProduction());
    setStages(productionDashboardService.getWipStages());
    setBottleneck(productionDashboardService.getBottleneckAlert());
    setMachines(productionDashboardService.getMachineFleet());
    toastSuccess('Shopfloor telemetry refreshed with live counters!');
  };

  const handleBottleneckActionExecuted = () => {
    // Dynamic recalculation upon playbook execution
    setStages(prev => prev.map(s => {
      if (s.operationCode === 'OP-20') {
        return {
          ...s,
          totalPieces: s.totalPieces - 240, // offloaded 240 pcs to CNC-04
          status: 'accumulating',
          isBottleneck: false
        };
      }
      return s;
    }));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans animate-fade-in">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <button
            onClick={() => navigate('/executive-dashboard')}
            className="flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 font-mono mb-1 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Switch to Executive Overview</span>
          </button>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200">
              <Factory className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Plant Production & Shopfloor Operations Dashboard
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Real-time shopfloor telemetry tracking machine-level OEE, shift production vs. scheduled plan, WIP buffers by routing operation, and automated bottleneck identification.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 self-start md:self-center font-mono text-xs">
          <button
            onClick={refreshAll}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600 transition cursor-pointer"
            title="Refresh Live Sensor Counters"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => navigate('/work-orders')}
            className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
          >
            <Zap className="h-3.5 w-3.5 text-slate-500" />
            <span>Work Orders</span>
          </button>

          <button
            onClick={() => navigate('/executive-dashboard')}
            className="border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
          >
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            <span>Executive Dashboard</span>
          </button>
        </div>
      </div>

      {/* 1. BOTTLENECK IDENTIFICATION & RESOLUTION PLAYBOOK (Acceptance Criteria: Bottleneck highlighting) */}
      <BottleneckHighlightCard 
        bottleneck={bottleneck} 
        onActionExecuted={handleBottleneckActionExecuted} 
      />

      {/* 2. PRODUCTION VS. PLAN (Acceptance Criteria: Production vs. plan) */}
      <ProductionVsPlanSection 
        planSummary={planSummary} 
        hourlyPoints={hourlyPoints} 
      />

      {/* 3. MACHINE-BY-MACHINE OEE & TELEMETRY (Acceptance Criteria: OEE chart) */}
      <OeeMachineChart machines={machines} />

      {/* 4. WIP BY OPERATION STAGE (Acceptance Criteria: WIP by operation / stage) */}
      <WipByStageFlow stages={stages} />

      {/* 5. QUICK SHORTCUT FOOTER */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 font-mono text-xs">
        <button
          onClick={() => navigate('/scheduling')}
          className="p-3.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-left shadow-3xs transition cursor-pointer flex items-center justify-between"
        >
          <div>
            <strong className="text-slate-800 block">Finite Capacity Scheduling</strong>
            <span className="text-[10px] text-slate-500">Machine slot allocation & what-if simulator</span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </button>

        <button
          onClick={() => navigate('/oee')}
          className="p-3.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-left shadow-3xs transition cursor-pointer flex items-center justify-between"
        >
          <div>
            <strong className="text-slate-800 block">OPC UA Machine Telemetry</strong>
            <span className="text-[10px] text-slate-500">PLC tag registers, spindle RPM, and downtime logs</span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </button>

        <button
          onClick={() => navigate('/work-instructions')}
          className="p-3.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-left shadow-3xs transition cursor-pointer flex items-center justify-between"
        >
          <div>
            <strong className="text-slate-800 block">Digital Work Instructions</strong>
            <span className="text-[10px] text-slate-500">Shopfloor tablet view & engineering drawings</span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </button>
      </div>

    </div>
  );
};
