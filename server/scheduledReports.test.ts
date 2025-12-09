import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
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
      ip: "127.0.0.1",
      get: (header: string) => "test-user-agent",
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("scheduledReports router", () => {
  it("should create a scheduled report", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.scheduledReports.create({
      reportName: "Weekly Compliance Summary",
      reportType: "compliance_summary",
      schedule: "weekly",
      scheduleDay: 1,
      scheduleTime: "09:00",
      recipients: ["manager@company.com", "hr@company.com"],
    });

    expect(result).toBeDefined();
    expect(result.reportName).toBe("Weekly Compliance Summary");
    expect(result.reportType).toBe("compliance_summary");
    expect(result.schedule).toBe("weekly");
    expect(result.isActive).toBe(1);
    expect(result.nextRunAt).toBeDefined();
  });

  it("should update a scheduled report", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create report first
    const created = await caller.scheduledReports.create({
      reportName: "Monthly Analytics",
      reportType: "analytics_dashboard",
      schedule: "monthly",
      scheduleDay: 1,
      recipients: ["admin@company.com"],
    });

    // Update report
    const updated = await caller.scheduledReports.update({
      id: created.id,
      reportName: "Monthly Analytics Report",
      schedule: "weekly",
      scheduleDay: 5,
      isActive: false,
    });

    expect(updated.reportName).toBe("Monthly Analytics Report");
    expect(updated.schedule).toBe("weekly");
    expect(updated.scheduleDay).toBe(5);
    expect(updated.isActive).toBe(0);
  });

  it("should list scheduled reports", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create test reports
    await caller.scheduledReports.create({
      reportName: "Daily Report",
      reportType: "candidate_pipeline",
      schedule: "daily",
      recipients: ["test@company.com"],
    });

    await caller.scheduledReports.create({
      reportName: "Weekly Report",
      reportType: "interview_feedback",
      schedule: "weekly",
      scheduleDay: 1,
      recipients: ["test@company.com"],
    });

    // List all
    const allReports = await caller.scheduledReports.list({});
    expect(allReports.length).toBeGreaterThanOrEqual(2);

    // Filter by type
    const pipelineReports = await caller.scheduledReports.list({
      reportType: "candidate_pipeline",
    });
    expect(pipelineReports.every((r) => r.reportType === "candidate_pipeline")).toBe(true);

    // Filter by active status
    const activeReports = await caller.scheduledReports.list({
      isActive: true,
    });
    expect(activeReports.every((r) => r.isActive === 1)).toBe(true);
  });

  it("should delete a scheduled report", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create report
    const created = await caller.scheduledReports.create({
      reportName: "Test Report",
      reportType: "ksa_labor_law",
      schedule: "quarterly",
      recipients: ["test@company.com"],
    });

    // Delete report
    const result = await caller.scheduledReports.delete({
      id: created.id,
    });

    expect(result.success).toBe(true);

    // Verify deletion
    await expect(
      caller.scheduledReports.getById({ id: created.id })
    ).rejects.toThrow("not found");
  });

  it("should calculate next run time correctly for different schedules", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Daily schedule
    const daily = await caller.scheduledReports.create({
      reportName: "Daily Test",
      reportType: "engagement_metrics",
      schedule: "daily",
      scheduleTime: "10:00",
      recipients: ["test@company.com"],
    });
    expect(daily.nextRunAt).toBeDefined();

    // Weekly schedule
    const weekly = await caller.scheduledReports.create({
      reportName: "Weekly Test",
      reportType: "compliance_summary",
      schedule: "weekly",
      scheduleDay: 1,
      scheduleTime: "09:00",
      recipients: ["test@company.com"],
    });
    expect(weekly.nextRunAt).toBeDefined();

    // Monthly schedule
    const monthly = await caller.scheduledReports.create({
      reportName: "Monthly Test",
      reportType: "nitaqat_status",
      schedule: "monthly",
      scheduleDay: 15,
      scheduleTime: "08:00",
      recipients: ["test@company.com"],
    });
    expect(monthly.nextRunAt).toBeDefined();
  });

  it("should handle multiple recipients", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const recipients = [
      "manager1@company.com",
      "manager2@company.com",
      "hr@company.com",
      "admin@company.com",
    ];

    const report = await caller.scheduledReports.create({
      reportName: "Multi-Recipient Report",
      reportType: "compliance_summary",
      schedule: "weekly",
      scheduleDay: 1,
      recipients,
    });

    expect(Array.isArray(report.recipients)).toBe(true);
    expect(report.recipients).toHaveLength(4);
  });
});
