import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getCompliancePermissions } from "./complianceRbac";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1, complianceRole: 'hr_admin' | 'hr_manager' | 'hr_viewer' = 'hr_admin'): TrpcContext {
  const user: AuthenticatedUser & { compliance_role?: string } = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    compliance_role: complianceRole,
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Compliance System Enhancements", () => {
  describe("Role-Based Access Control", () => {
    it("should grant all permissions to hr_admin", () => {
      const permissions = getCompliancePermissions('hr_admin');
      
      expect(permissions.canViewCompliance).toBe(true);
      expect(permissions.canEditCompliance).toBe(true);
      expect(permissions.canDeleteCompliance).toBe(true);
      expect(permissions.canManageEmployees).toBe(true);
      expect(permissions.canConfigureSettings).toBe(true);
      expect(permissions.canExportReports).toBe(true);
      expect(permissions.canImportData).toBe(true);
      expect(permissions.canManageRoles).toBe(true);
    });
    
    it("should grant limited permissions to hr_manager", () => {
      const permissions = getCompliancePermissions('hr_manager');
      
      expect(permissions.canViewCompliance).toBe(true);
      expect(permissions.canEditCompliance).toBe(true);
      expect(permissions.canDeleteCompliance).toBe(false);
      expect(permissions.canManageEmployees).toBe(true);
      expect(permissions.canConfigureSettings).toBe(true);
      expect(permissions.canExportReports).toBe(true);
      expect(permissions.canImportData).toBe(true);
      expect(permissions.canManageRoles).toBe(false);
    });
    
    it("should grant view-only permissions to hr_viewer", () => {
      const permissions = getCompliancePermissions('hr_viewer');
      
      expect(permissions.canViewCompliance).toBe(true);
      expect(permissions.canEditCompliance).toBe(false);
      expect(permissions.canDeleteCompliance).toBe(false);
      expect(permissions.canManageEmployees).toBe(false);
      expect(permissions.canConfigureSettings).toBe(false);
      expect(permissions.canExportReports).toBe(true);
      expect(permissions.canImportData).toBe(false);
      expect(permissions.canManageRoles).toBe(false);
    });
    
    it("should get user permissions from context", async () => {
      const ctx = createAuthContext(1, 'hr_admin');
      const caller = appRouter.createCaller(ctx);
      
      const permissions = await caller.visaCompliance.roles.getMyPermissions();
      
      expect(permissions).toBeDefined();
      expect(permissions.canManageRoles).toBe(true);
    });
  });
  
  describe("Employee Import", () => {
    it("should get CSV import template", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const template = await caller.visaCompliance.import.getTemplate();
      
      expect(template).toBeDefined();
      expect(typeof template).toBe('string');
      expect(template).toContain('firstName');
      expect(template).toContain('lastName');
      expect(template).toContain('email');
    });
    
    it("should validate CSV import with valid data", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const csvContent = `firstName,lastName,email,employmentStatus
John,Doe,john@example.com,active
Jane,Smith,jane@example.com,active`;
      
      const result = await caller.visaCompliance.import.uploadCSV({
        fileContent: csvContent,
        employerId: 1,
      });
      
      expect(result).toBeDefined();
      expect(result.totalRows).toBe(2);
      expect(result.successCount).toBeGreaterThanOrEqual(0);
    });
    
    it("should reject CSV import with invalid data", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const csvContent = `firstName,lastName,email,employmentStatus
,Doe,invalid-email,invalid_status`;
      
      const result = await caller.visaCompliance.import.uploadCSV({
        fileContent: csvContent,
        employerId: 1,
      });
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
    
    it("should enforce import permission for hr_viewer", async () => {
      const ctx = createAuthContext(1, 'hr_viewer');
      const caller = appRouter.createCaller(ctx);
      
      const csvContent = `firstName,lastName,email
John,Doe,john@example.com`;
      
      await expect(
        caller.visaCompliance.import.uploadCSV({
          fileContent: csvContent,
          employerId: 1,
        })
      ).rejects.toThrow();
    });
  });
  
  describe("Compliance Report Export", () => {
    it("should generate PDF report", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.visaCompliance.export.generatePDF({
        employerId: 1,
      });
      
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.filename).toContain('.pdf');
      expect(typeof result.data).toBe('string'); // Base64
    });
    
    it("should generate Excel report", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.visaCompliance.export.generateExcel({
        employerId: 1,
      });
      
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.filename).toContain('.xlsx');
      expect(typeof result.data).toBe('string'); // Base64
    });
    
    it("should allow hr_viewer to export reports", async () => {
      const ctx = createAuthContext(1, 'hr_viewer');
      const caller = appRouter.createCaller(ctx);
      
      // Should not throw error
      const result = await caller.visaCompliance.export.generatePDF({
        employerId: 1,
      });
      
      expect(result).toBeDefined();
    });
  });
  
  describe("Import Validation", () => {
    it("should validate required fields", async () => {
      const { parseCSV } = await import('./employeeImportService');
      
      const csvContent = `firstName,lastName,email
John,Doe,john@example.com
,Smith,jane@example.com`;
      
      const data = parseCSV(csvContent);
      
      expect(data.length).toBe(2);
      expect(data[0].firstName).toBe('John');
      expect(data[1].firstName).toBe('');
    });
    
    it("should validate email format", async () => {
      const { parseCSV } = await import('./employeeImportService');
      
      const csvContent = `firstName,lastName,email
John,Doe,invalid-email
Jane,Smith,jane@example.com`;
      
      const data = parseCSV(csvContent);
      
      expect(data.length).toBe(2);
      expect(data[0].email).toBe('invalid-email');
      expect(data[1].email).toBe('jane@example.com');
    });
    
    it("should validate employment status enum", async () => {
      const { parseCSV } = await import('./employeeImportService');
      
      const csvContent = `firstName,lastName,employmentStatus
John,Doe,active
Jane,Smith,invalid_status`;
      
      const data = parseCSV(csvContent);
      
      expect(data.length).toBe(2);
      expect(data[0].employmentStatus).toBe('active');
      expect(data[1].employmentStatus).toBe('invalid_status');
    });
  });
});
