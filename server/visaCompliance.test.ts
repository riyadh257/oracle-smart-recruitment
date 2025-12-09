import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
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

describe("Visa Compliance System", () => {
  describe("Employee Management", () => {
    it("should create a new employee", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const employee = await caller.visaCompliance.employees.create({
        employerId: 1,
        firstName: "Ahmed",
        lastName: "Al-Rashid",
        email: "ahmed@example.com",
        phoneNumber: "+966501234567",
        nationality: "Egyptian",
        jobTitle: "Software Engineer",
        department: "Engineering",
        employmentStatus: "active",
        hireDate: new Date().toISOString(),
        isSaudiNational: 0,
      });

      expect(employee).toBeDefined();
      expect(employee.id).toBeGreaterThan(0);
      expect(employee.firstName).toBe("Ahmed");
      expect(employee.lastName).toBe("Al-Rashid");
    });

    it("should list employees by employer", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const employees = await caller.visaCompliance.employees.list({
        employerId: 1,
      });

      expect(Array.isArray(employees)).toBe(true);
    });

    it("should update employee information", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create employee first
      const employee = await caller.visaCompliance.employees.create({
        employerId: 1,
        firstName: "Test",
        lastName: "Employee",
        employmentStatus: "active",
      });

      // Update employee
      const result = await caller.visaCompliance.employees.update({
        id: employee.id,
        data: {
          jobTitle: "Senior Engineer",
          department: "R&D",
        },
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Visa Compliance Tracking", () => {
    it("should create visa compliance record", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create employee first
      const employee = await caller.visaCompliance.employees.create({
        employerId: 1,
        firstName: "John",
        lastName: "Doe",
        employmentStatus: "active",
      });

      // Create visa compliance record
      const compliance = await caller.visaCompliance.compliance.create({
        employeeId: employee.id,
        documentType: "work_permit",
        documentNumber: "WP123456",
        issueDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
        renewalStatus: "not_started",
      });

      expect(compliance).toBeDefined();
      expect(compliance.id).toBeGreaterThan(0);
      expect(compliance.documentType).toBe("work_permit");
    });

    it("should get expiring documents", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const expiringDocs = await caller.visaCompliance.compliance.getExpiring({
        daysThreshold: 30,
      });

      expect(Array.isArray(expiringDocs)).toBe(true);
    });

    it("should update compliance status", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create employee and compliance record
      const employee = await caller.visaCompliance.employees.create({
        employerId: 1,
        firstName: "Jane",
        lastName: "Smith",
        employmentStatus: "active",
      });

      const compliance = await caller.visaCompliance.compliance.create({
        employeeId: employee.id,
        documentType: "visa",
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // Update status
      const result = await caller.visaCompliance.compliance.updateStatus({
        id: compliance.id,
        data: {
          status: "expiring_soon",
          renewalStatus: "in_progress",
        },
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Compliance Alerts", () => {
    it("should get active alerts", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const alerts = await caller.visaCompliance.alerts.getActive();

      expect(Array.isArray(alerts)).toBe(true);
    });

    it("should acknowledge alert", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Get active alerts
      const alerts = await caller.visaCompliance.alerts.getActive();

      if (alerts.length > 0) {
        const result = await caller.visaCompliance.alerts.acknowledge({
          alertId: alerts[0].alert.id,
        });

        expect(result.success).toBe(true);
      }
    });
  });

  describe("WhatsApp Settings", () => {
    it("should get WhatsApp settings", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const settings = await caller.visaCompliance.whatsapp.getSettings();

      // Settings might be null if not configured yet
      expect(settings === null || typeof settings === 'object').toBe(true);
    });

    it("should update WhatsApp settings", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.visaCompliance.whatsapp.updateSettings({
        phoneNumber: "+966501234567",
        countryCode: "+966",
        enableDailySummary: 1,
        enableCriticalAlerts: 1,
        enableWeeklyReports: 0,
        dailySummaryTime: "09:00",
        weeklyReportDay: "monday",
        isActive: 1,
      });

      expect(result.success).toBe(true);
    });

    it("should get WhatsApp notification logs", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const logs = await caller.visaCompliance.whatsapp.getLogs({
        limit: 10,
      });

      expect(Array.isArray(logs)).toBe(true);
    });
  });

  describe("Analytics", () => {
    it("should get compliance analytics overview", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const analytics = await caller.visaCompliance.analytics.getOverview({
        employerId: 1,
      });

      expect(analytics).toBeDefined();
      expect(typeof analytics.totalEmployees).toBe('number');
      expect(typeof analytics.expiringSoon).toBe('number');
      expect(typeof analytics.expired).toBe('number');
    });

    it("should get compliance trends", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const trends = await caller.visaCompliance.analytics.getTrends({
        employerId: 1,
        days: 90,
      });

      expect(Array.isArray(trends)).toBe(true);
    });
  });
});
