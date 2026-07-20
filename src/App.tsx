/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Loader2, ShieldCheck } from 'lucide-react';

// Unauthenticated views
import { Login } from './pages/unauth/Login';
import { ForgotPassword } from './pages/unauth/ForgotPassword';

// Authenticated views
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { PaymentsTrackerPage } from './pages/PaymentsTrackerPage';
import { RFQsPage } from './pages/rfqs/RFQsPage';
import { RfqCreateForm } from './pages/rfqs/RfqCreateForm';
import { RfqDetailPage } from './pages/rfqs/RfqDetailPage';
import { QuotationEditorPage } from './pages/rfqs/QuotationEditorPage';
import { OrdersPage } from './pages/orders/OrdersPage';
import { JobDetailPage } from './pages/orders/JobDetailPage';
import { DispatchPage } from './pages/dispatch/DispatchPage';
import { DispatchDetailPage } from './pages/dispatch/DispatchDetailPage';
import { CustomersListPage } from './pages/customers/CustomersListPage';
import { CustomerDetailPage } from './pages/customers/CustomerDetailPage';
import { InventoryPage } from './pages/InventoryPage';
import { ReportsPage } from './pages/ReportsPage';

// Settings sub-views
import { TenantSettingsPage } from './pages/settings/TenantSettingsPage';
import { ProductionStagesPage } from './pages/settings/ProductionStagesPage';
import { WhatsAppPage } from './pages/settings/WhatsAppPage';
import { WhatsAppInboxPage } from './pages/WhatsAppInboxPage';
import { UsersRosterPage } from './pages/settings/UsersRosterPage';
import { InviteUserForm } from './pages/settings/InviteUserForm';
import { ActivityPage } from './pages/settings/ActivityPage';
import { OnboardingWizard } from './pages/settings/OnboardingWizard';

// Customer Self-Service Portal view
import { PortalPage } from './pages/portal/PortalPage';

// Landing Page view
import { LandingPage } from './pages/LandingPage';

// SaaS Controller
import { InternalTenantsListPage } from './pages/internal/InternalTenantsListPage';
import { InternalTenantDetailPage } from './pages/internal/InternalTenantDetailPage';

const AppRouter = () => {
  const { authStatus, tenant } = useAuth();

  // GLOBAL LOADING GATE: Ensures router tree waits for complete authentication & tenant verification
  if (authStatus === 'loading' || (authStatus === 'active' && !tenant)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 space-y-4">
        <Loader2 className="h-8 w-8 text-sky-600 animate-spin" />
        <div className="flex flex-col items-center space-y-1 text-center">
          <span className="text-xs font-mono font-bold text-slate-700 uppercase tracking-widest flex items-center justify-center space-x-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Verifying Secure Workspace</span>
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            Establishing tenant connection and security rules...
          </span>
        </div>
      </div>
    );
  }

  // Intercept for bootstrapping first-time owners
  if (authStatus === 'needs_onboarding') {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<OnboardingWizard />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Credentials Entryways */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/portal" element={<PortalPage />} />
        <Route 
          path="/onboarding" 
          element={
            <ProtectedRoute requiredAction="manage:settings">
              <OnboardingWizard />
            </ProtectedRoute>
          } 
        />

        {/* Secure Tenancy Workspace Layout Shell */}
        <Route 
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >

          {/* Core operator dashboards with action-based permissions */}
          <Route 
            path="dashboard" 
            element={
              <ProtectedRoute requiredAction="view:dashboard">
                <DashboardPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="rfqs" 
            element={
              <ProtectedRoute requiredAction="view:rfq">
                <RFQsPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="rfqs/new" 
            element={
              <ProtectedRoute requiredAction="manage:rfq">
                <RfqCreateForm />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="rfqs/:rfqId" 
            element={
              <ProtectedRoute requiredAction="view:rfq">
                <RfqDetailPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="rfqs/:rfqId/quotation" 
            element={
              <ProtectedRoute requiredAction="manage:quotation">
                <QuotationEditorPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="orders" 
            element={
              <ProtectedRoute requiredAction="view:order">
                <OrdersPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="orders/:jobId" 
            element={
              <ProtectedRoute requiredAction="view:order">
                <JobDetailPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="dispatch" 
            element={
              <ProtectedRoute requiredAction="view:dispatch">
                <DispatchPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="dispatch/:dispatchId" 
            element={
              <ProtectedRoute requiredAction="view:dispatch">
                <DispatchDetailPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="customers" 
            element={
              <ProtectedRoute requiredAction="view:customers">
                <CustomersListPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="whatsapp-inbox" 
            element={
              <ProtectedRoute requiredAction="view:customers">
                <WhatsAppInboxPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="payments" 
            element={
              <ProtectedRoute requiredAction="view:customers">
                <PaymentsTrackerPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="customers/:customerId" 
            element={
              <ProtectedRoute requiredAction="view:customers">
                <CustomerDetailPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="inventory" 
            element={
              <ProtectedRoute requiredAction="view:inventory">
                <InventoryPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="reports" 
            element={
              <ProtectedRoute requiredAction="view:reports">
                <ReportsPage />
              </ProtectedRoute>
            } 
          />

          {/* Config & Audit settings pipelines */}
          <Route 
            path="settings/tenant" 
            element={
              <ProtectedRoute requiredAction="manage:settings">
                <TenantSettingsPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="settings/production-stages" 
            element={
              <ProtectedRoute requiredAction="manage:settings">
                <ProductionStagesPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="settings/whatsapp" 
            element={
              <ProtectedRoute requiredAction="manage:settings">
                <WhatsAppPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="settings/users" 
            element={
              <ProtectedRoute requiredAction="manage:users">
                <UsersRosterPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="settings/users/invite" 
            element={
              <ProtectedRoute requiredAction="manage:users">
                <InviteUserForm />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="activity" 
            element={
              <ProtectedRoute requiredAction="view:reports">
                <ActivityPage />
              </ProtectedRoute>
            } 
          />

          {/* Internal SaaS Admins boundary shard manager */}
          <Route 
            path="internal/tenants" 
            element={
              <ProtectedRoute requireSuperAdmin={true}>
                <InternalTenantsListPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="internal/tenants/:tenantId" 
            element={
              <ProtectedRoute requireSuperAdmin={true}>
                <InternalTenantDetailPage />
              </ProtectedRoute>
            } 
          />
        </Route>

        {/* Clean path recovery fallback redirects any unmatched routes to secure home */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}