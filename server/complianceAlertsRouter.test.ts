import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { complianceAlerts, employers, workPermits } from "../drizzle/schema";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-compliance-user",
    email: "compliance@test.com",
    name: "Test Compliance Officer",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("complianceAlerts router", () => {
  let testEmployerId: number;
  let testAlertId: number;
  let testPermitId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test employer
    const employerResult = await db.insert(employers).values({
      companyName: "Test Company",
      contactName: "Test Contact",
      contactEmail: "contact@testcompany.com",
      industry: "Technology",
      totalEmployees: 100,
      saudiEmployees: 30,
      nitaqatActivity: "large_tech",
      nitaqatBand: "yellow",
    });
    testEmployerId = Number(employerResult[0].insertId);

    // Create test compliance alert
    const alertResult = await db.insert(complianceAlerts).values({
      employerId: testEmployerId,
      alertType: "nitaqat_yellow_zone",
      severity: "warning",
      alertTitle: "Nitaqat Yellow Zone Warning",
      alertMessage: "Your company is in the Yellow zone. Immediate action required.",
      actionRequired: "Hire 5 more Saudi nationals to reach Green zone",
      alertStatus: "active",
      notificationSent: 0,
    });
    testAlertId = Number(alertResult[0].insertId);

    // Create test expiring work permit
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 15); // Expires in 15 days

    const permitResult = await db.insert(workPermits).values({
      employerId: testEmployerId,
      permitNumber: "WP123456",
      employeeName: "Test Employee",
      employeeNationalId: "1234567890",
      nationality: "India",
      occupation: "Software Engineer",
      issueDate: new Date().toISOString(),
      expiryDate: expiryDate.toISOString(),
      status: "active",
    });
    testPermitId = Number(permitResult[0].insertId);
  });

  it("should fetch active compliance alerts", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const alerts = await caller.complianceAlerts.getActiveAlerts({
      employerId: testEmployerId,
    });

    expect(alerts).toBeDefined();
    expect(Array.isArray(alerts)).toBe(true);
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0]).toHaveProperty("alertTitle");
    expect(alerts[0]).toHaveProperty("severity");
    expect(alerts[0]).toHaveProperty("alertStatus");
  });

  it("should fetch alert statistics", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.complianceAlerts.getAlertStatistics({
      employerId: testEmployerId,
    });

    expect(stats).toBeDefined();
    expect(stats).toHaveProperty("totalAlerts");
    expect(stats).toHaveProperty("criticalAlerts");
    expect(stats).toHaveProperty("warningAlerts");
    expect(stats).toHaveProperty("activeAlerts");
    expect(stats).toHaveProperty("acknowledgedAlerts");
    expect(stats).toHaveProperty("resolvedAlerts");
    expect(stats.totalAlerts).toBeGreaterThan(0);
  });

  it("should check for expiring work permits", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.complianceAlerts.checkExpiringWorkPermits({
      employerId: testEmployerId,
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("expiringPermitsCount");
    expect(result.expiringPermitsCount).toBeGreaterThan(0);
  });

  it("should acknowledge an alert", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.complianceAlerts.acknowledgeAlert({
      alertId: testAlertId,
      notes: "Reviewing the situation and preparing action plan",
    });

    expect(result).toEqual({ success: true });

    // Verify alert was acknowledged
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const updatedAlert = await db
      .select()
      .from(complianceAlerts)
      .where((t) => t.id === testAlertId)
      .limit(1);

    expect(updatedAlert[0].alertStatus).toBe("acknowledged");
    expect(updatedAlert[0].acknowledgedBy).toBe(1);
    expect(updatedAlert[0].acknowledgedAt).toBeDefined();
  });

  it("should resolve an alert", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.complianceAlerts.resolveAlert({
      alertId: testAlertId,
      notes: "Hired additional Saudi employees, now in Green zone",
    });

    expect(result).toEqual({ success: true });

    // Verify alert was resolved
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const updatedAlert = await db
      .select()
      .from(complianceAlerts)
      .where((t) => t.id === testAlertId)
      .limit(1);

    expect(updatedAlert[0].alertStatus).toBe("resolved");
    expect(updatedAlert[0].resolvedAt).toBeDefined();
  });

  it("should filter alerts by severity", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const criticalAlerts = await caller.complianceAlerts.getActiveAlerts({
      employerId: testEmployerId,
      severity: "critical",
    });

    expect(criticalAlerts).toBeDefined();
    expect(Array.isArray(criticalAlerts)).toBe(true);
    criticalAlerts.forEach((alert) => {
      expect(alert.severity).toBe("critical");
    });
  });

  it("should filter alerts by status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const activeAlerts = await caller.complianceAlerts.getActiveAlerts({
      employerId: testEmployerId,
      status: "active",
    });

    expect(activeAlerts).toBeDefined();
    expect(Array.isArray(activeAlerts)).toBe(true);
    activeAlerts.forEach((alert) => {
      expect(alert.alertStatus).toBe("active");
    });
  });

  it("should create alerts for expiring permits with correct severity", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Run the check
    await caller.complianceAlerts.checkExpiringWorkPermits({
      employerId: testEmployerId,
    });

    // Fetch alerts
    const alerts = await caller.complianceAlerts.getActiveAlerts({
      employerId: testEmployerId,
    });

    const permitAlerts = alerts.filter((a) => a.alertType === "permit_expiring");
    expect(permitAlerts.length).toBeGreaterThan(0);

    const permitAlert = permitAlerts[0];
    expect(permitAlert.alertTitle).toContain("Work Permit Expiring");
    expect(permitAlert.actionRequired).toBeDefined();
    expect(permitAlert.actionRequired).toContain("renewal");
  });
});
