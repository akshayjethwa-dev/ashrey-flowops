// src/utils/permissions.ts

import { UserRole, UserProfile, TenantUser } from '../types';

export type PermissionAction =
  | 'view:dashboard'
  | 'view:rfq'
  | 'manage:rfq'
  | 'view:quotation'
  | 'manage:quotation'
  | 'edit:pricing'
  | 'view:order'
  | 'manage:order'
  | 'manage:production'
  | 'view:dispatch'
  | 'manage:dispatch'
  | 'view:customers'
  | 'manage:customers'
  | 'view:inventory'
  | 'manage:inventory'
  | 'view:reports'
  | 'manage:settings'
  | 'manage:users';

// 🔒 Central RBAC Policy Map
const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  admin: [
    'view:dashboard', 'view:rfq', 'manage:rfq', 'view:quotation', 'manage:quotation', 'edit:pricing',
    'view:order', 'manage:order', 'manage:production', 'view:dispatch', 'manage:dispatch',
    'view:customers', 'manage:customers', 'view:inventory', 'manage:inventory', 'view:reports', 
    'manage:settings', 'manage:users'
  ],
  sales: [
    'view:dashboard', 'view:rfq', 'manage:rfq', 'view:quotation', 'manage:quotation', 'edit:pricing',
    'view:customers', 'manage:customers', 'view:inventory', 'view:reports'
  ],
  production: [
    'view:dashboard', 'view:order', 'manage:order', 'manage:production', 'view:inventory', 'manage:inventory', 'view:reports'
  ],
  dispatch: [
    'view:dashboard', 'view:order', 'view:dispatch', 'manage:dispatch', 'view:inventory', 'manage:inventory', 'view:reports'
  ],
  management: [
    // AC: Management has view-only where intended
    'view:dashboard', 'view:rfq', 'view:quotation', 'view:order', 'view:dispatch', 
    'view:customers', 'view:inventory', 'view:reports'
  ]
};

export const isSuperAdmin = (
  user: UserProfile | TenantUser | null | undefined
): boolean => {
  if (!user) return false;
  return !!(user as any).isSuperAdmin;
};

export const hasRole = (
  user: UserProfile | TenantUser | null | undefined,
  role: string | UserRole
): boolean => {
  if (!user) return false;
  return user.role.toLowerCase() === role.toLowerCase();
};

/**
 * Checks if a user has permission to perform a specific action based on the RBAC map.
 */
export const canPerformAction = (
  user: UserProfile | TenantUser | null | undefined,
  action: PermissionAction
): boolean => {
  if (!user) return false;
  if (isSuperAdmin(user)) return true; // Super-admins bypass tenancy RBAC

  const role = user.role.toLowerCase() as UserRole;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(action);
};

/**
 * Legacy wrapper mapping modules to the new RBAC system for backwards compatibility in nav.
 */
export const canViewModule = (
  user: UserProfile | TenantUser | null | undefined,
  module: string
): boolean => {
  if (!user) return false;
  const normalizedModule = module.toUpperCase();

  switch (normalizedModule) {
    case 'DASHBOARD': return canPerformAction(user, 'view:dashboard');
    case 'RFQ':
    case 'QUOTATION':
    case 'QUOTATIONS': return canPerformAction(user, 'view:rfq');
    case 'PRODUCTION':
    case 'ORDER':
    case 'ORDERS':
    case 'JOB': return canPerformAction(user, 'view:order');
    case 'DISPATCH':
    case 'LOGISTICS': return canPerformAction(user, 'view:dispatch');
    case 'CUSTOMERS':
    case 'CUSTOMER': return canPerformAction(user, 'view:customers');
    case 'SETTINGS':
    case 'TENANT':
    case 'PRODUCTION_STAGES':
    case 'WHATSAPP': return canPerformAction(user, 'manage:settings');
    case 'USERS':
    case 'USER':
    case 'ROSTER': return canPerformAction(user, 'manage:users');
    default: return false;
  }
};