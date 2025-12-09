import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./_core/context";

export type ComplianceRole = 'hr_admin' | 'hr_manager' | 'hr_viewer';

export interface CompliancePermissions {
  canViewCompliance: boolean;
  canEditCompliance: boolean;
  canDeleteCompliance: boolean;
  canManageEmployees: boolean;
  canConfigureSettings: boolean;
  canExportReports: boolean;
  canImportData: boolean;
  canManageRoles: boolean;
}

/**
 * Get permissions for a compliance role
 */
export function getCompliancePermissions(role: ComplianceRole): CompliancePermissions {
  switch (role) {
    case 'hr_admin':
      return {
        canViewCompliance: true,
        canEditCompliance: true,
        canDeleteCompliance: true,
        canManageEmployees: true,
        canConfigureSettings: true,
        canExportReports: true,
        canImportData: true,
        canManageRoles: true,
      };
    
    case 'hr_manager':
      return {
        canViewCompliance: true,
        canEditCompliance: true,
        canDeleteCompliance: false,
        canManageEmployees: true,
        canConfigureSettings: true,
        canExportReports: true,
        canImportData: true,
        canManageRoles: false,
      };
    
    case 'hr_viewer':
      return {
        canViewCompliance: true,
        canEditCompliance: false,
        canDeleteCompliance: false,
        canManageEmployees: false,
        canConfigureSettings: false,
        canExportReports: true,
        canImportData: false,
        canManageRoles: false,
      };
    
    default:
      return {
        canViewCompliance: false,
        canEditCompliance: false,
        canDeleteCompliance: false,
        canManageEmployees: false,
        canConfigureSettings: false,
        canExportReports: false,
        canImportData: false,
        canManageRoles: false,
      };
  }
}

/**
 * Get user's compliance role from context
 */
export function getUserComplianceRole(ctx: TrpcContext): ComplianceRole {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  }
  
  // Check if user has compliance_role field (from database)
  const user = ctx.user as any;
  return user.compliance_role || 'hr_viewer';
}

/**
 * Check if user has required permission
 */
export function requirePermission(
  ctx: TrpcContext,
  permission: keyof CompliancePermissions
): void {
  const role = getUserComplianceRole(ctx);
  const permissions = getCompliancePermissions(role);
  
  if (!permissions[permission]) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Insufficient permissions. Required: ${permission}`,
    });
  }
}

/**
 * Middleware factory for role-based access control
 */
export function requireCompliancePermission(permission: keyof CompliancePermissions) {
  return (ctx: TrpcContext) => {
    requirePermission(ctx, permission);
    return ctx;
  };
}

/**
 * Get user's compliance permissions
 */
export function getUserPermissions(ctx: TrpcContext): CompliancePermissions {
  const role = getUserComplianceRole(ctx);
  return getCompliancePermissions(role);
}
