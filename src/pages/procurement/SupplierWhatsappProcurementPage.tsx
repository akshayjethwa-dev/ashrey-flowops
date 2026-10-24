// src/pages/procurement/SupplierWhatsappProcurementPage.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { SupplierWhatsappProcurementTab } from '../../components/procurement/SupplierWhatsappProcurementTab';
import { 
  Building2, 
  MessageSquare, 
  ArrowLeft, 
  FileCheck, 
  Truck, 
  Send 
} from 'lucide-react';

export const SupplierWhatsappProcurementPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const tenantId = tenant?.id || 'demo';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <button
            onClick={() => navigate('/purchase-orders')}
            className="flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 font-mono mb-1 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Purchase Orders</span>
          </button>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
              <MessageSquare className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Supplier RFQ & PO via WhatsApp
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Multi-vendor RFQ broadcasts, automated quote reply parsing, official Purchase Order PDF delivery with digital stamps, and 24/7 supplier acknowledgment tracking.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start md:self-center">
          <button
            onClick={() => navigate('/purchase-orders')}
            className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-mono font-bold uppercase px-3 py-2 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
          >
            <FileCheck className="h-3.5 w-3.5 text-slate-500" />
            <span>PO Register</span>
          </button>

          <button
            onClick={() => navigate('/orders/whatsapp-intake')}
            className="border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 text-xs font-mono font-bold uppercase px-3 py-2 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
          >
            <Send className="h-3.5 w-3.5 text-emerald-600" />
            <span>Customer Intake Hub</span>
          </button>
        </div>
      </div>

      {/* Main Tab Hub */}
      <SupplierWhatsappProcurementTab tenantId={tenantId} />

    </div>
  );
};
