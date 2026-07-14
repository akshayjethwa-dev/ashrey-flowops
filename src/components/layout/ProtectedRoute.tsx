// src/components/layout/ProtectedRoute.tsx

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { isSuperAdmin } from '../../utils/permissions';
import { Lock, LogOut } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireSuperAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles,
  requireSuperAdmin
}) => {
  const { authStatus, profile, signOut } = useAuth();
  const location = useLocation();

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="animate-spin h-8 w-8 border-3 border-sky-600 border-t-transparent rounded-full" />
        <p className="mt-4 text-xs font-mono text-slate-400 uppercase tracking-widest animate-pulse">
          Resolving credentials...
        </p>
      </div>
    );
  }

  // Enforce unauthenticated boundary
  if (authStatus === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Enforce Suspension boundary 
  if (authStatus === 'suspended') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-lg p-8 shadow-xs">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5 font-bold">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2 uppercase tracking-wide">
            Account Suspended
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-8">
            Your access to this workspace has been deactivated by the system administrator. Please contact management for further assistance.
          </p>
          <button 
            onClick={signOut} 
            className="w-full bg-slate-900 hover:bg-slate-800 text-white h-11 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Safely</span>
          </button>
        </div>
      </div>
    );
  }

  // Check Super Admin constraints if targeted
  if (requireSuperAdmin && !isSuperAdmin(profile)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white border border-slate-200 rounded-lg p-8 shadow-xs">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
            🚨
          </div>
          <h2 className="text-base font-bold text-red-650 mb-2 uppercase tracking-wide">
            Super-Admin Required
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed mb-6">
            This module is reserved exclusively for the core Ashrey Systems administration team.
          </p>
          <Navigate to="/dashboard" replace />
        </div>
      </div>
    );
  }

  // Check Role Permissions constraints if targeted
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white border border-slate-200 rounded-lg p-8 shadow-xs">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
            ⚠️
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-2 uppercase tracking-wide">
            Access Restricted
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed mb-6">
            Your current account role ({profile.role.toUpperCase()}) does not have permissions to access this administrative board.
          </p>
          <Navigate to="/dashboard" replace />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};