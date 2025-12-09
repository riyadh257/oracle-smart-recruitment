import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as phase26Db from "./phase26-db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "admin" | "user" = "user"): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
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

describe("Phase 26: SMS Cost Monitoring", () => {
  it("should fetch SMS cost analytics for a date range", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const result = await caller.phase26.smsCost.getCostAnalytics({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty("summary");
    expect(result).toHaveProperty("byPurpose");
  });

  it("should fetch SMS logs by date range", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const result = await caller.phase26.smsCost.getLogsByDateRange({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should fetch SMS cost breakdown by purpose", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const result = await caller.phase26.smsCost.getCostByPurpose({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should fetch SMS logs with pagination", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.phase26.smsCost.getLogs({
      limit: 10,
      offset: 0,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeLessThanOrEqual(10);
  });
});

describe("Phase 26: Job Execution History", () => {
  it("should fetch recent job executions", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.phase26.jobExecution.getRecent({
      limit: 50,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeLessThanOrEqual(50);
  });

  it("should fetch failed job executions", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.phase26.jobExecution.getFailed({
      limit: 25,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should fetch job execution statistics", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.phase26.jobExecution.getStats({});

    expect(result).toBeDefined();
    // Stats should include execution counts
    if (result) {
      expect(result).toHaveProperty("totalExecutions");
      expect(result).toHaveProperty("completedCount");
      expect(result).toHaveProperty("failedCount");
    }
  });

  it("should fetch job executions by job name", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.phase26.jobExecution.getByJobName({
      jobName: "test-job",
      limit: 20,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should handle job execution retry with validation", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Test with non-existent job execution
    await expect(
      caller.phase26.jobExecution.retry({ id: 999999 })
    ).rejects.toThrow("Job execution not found");
  });

  it("should update job execution status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a test job execution first
    const testExecution = await phase26Db.createJobExecution({
      jobName: "test-status-update",
      jobType: "manual",
      status: "pending",
      triggerType: "manual",
      triggeredBy: ctx.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (testExecution.insertId) {
      const result = await caller.phase26.jobExecution.updateStatus({
        id: Number(testExecution.insertId),
        status: "completed",
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    }
  });
});

describe("Phase 26: Export History", () => {
  it("should fetch export history for current user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.phase26.exportHistory.getHistory({
      limit: 30,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeLessThanOrEqual(30);
  });

  it("should fetch export history by date range", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const result = await caller.phase26.exportHistory.getByDateRange({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should fetch export analytics", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.phase26.exportHistory.getAnalytics({
      days: 30,
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty("summary");
    expect(result).toHaveProperty("byDataType");
  });

  it("should handle unauthorized access to export", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Test with non-existent export
    await expect(
      caller.phase26.exportHistory.download({ id: 999999 })
    ).rejects.toThrow("Export not found");
  });

  it("should only allow admin to view expired exports", async () => {
    const { ctx } = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.phase26.exportHistory.getExpired()
    ).rejects.toThrow("Unauthorized: Admin access required");
  });

  it("should allow admin to view expired exports", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.phase26.exportHistory.getExpired();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should only allow admin to mark exports as expired", async () => {
    const { ctx } = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.phase26.exportHistory.markExpired({ id: 1 })
    ).rejects.toThrow("Unauthorized: Admin access required");
  });
});

describe("Phase 26: Database Helpers", () => {
  it("should create and retrieve SMS log", async () => {
    const testLog = await phase26Db.createSmsLog({
      userId: 1,
      phoneNumber: "+1234567890",
      message: "Test SMS",
      provider: "twilio",
      status: "pending",
      direction: "outbound",
      purpose: "notification",
      cost: 100, // $0.01 in cents
      segments: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(testLog).toBeDefined();
    expect(testLog.insertId).toBeDefined();

    if (testLog.insertId) {
      const retrieved = await phase26Db.getSmsLogById(Number(testLog.insertId));
      expect(retrieved).toBeDefined();
      if (retrieved) {
        expect(retrieved.phoneNumber).toBe("+1234567890");
        expect(retrieved.message).toBe("Test SMS");
      }
    }
  });

  it("should create and retrieve job execution", async () => {
    const testExecution = await phase26Db.createJobExecution({
      jobName: "test-job",
      jobType: "manual",
      status: "pending",
      triggerType: "manual",
      triggeredBy: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(testExecution).toBeDefined();
    expect(testExecution.insertId).toBeDefined();

    if (testExecution.insertId) {
      const retrieved = await phase26Db.getJobExecutionById(Number(testExecution.insertId));
      expect(retrieved).toBeDefined();
      if (retrieved) {
        expect(retrieved.jobName).toBe("test-job");
        expect(retrieved.status).toBe("pending");
      }
    }
  });

  it("should create and retrieve export history", async () => {
    const testExport = await phase26Db.createExportHistory({
      userId: 1,
      exportType: "csv",
      dataType: "candidates",
      fileName: "test-export.csv",
      status: "pending",
      recordCount: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(testExport).toBeDefined();
    expect(testExport.insertId).toBeDefined();

    if (testExport.insertId) {
      const retrieved = await phase26Db.getExportHistoryById(Number(testExport.insertId));
      expect(retrieved).toBeDefined();
      if (retrieved) {
        expect(retrieved.fileName).toBe("test-export.csv");
        expect(retrieved.exportType).toBe("csv");
      }
    }
  });
});


describe("Phase 26: Email Digest with Gmail MCP", () => {
  it("should generate weekly digest preview", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const preview = await caller.emailDigest.previewWeeklyDigest({});

    expect(preview).toBeDefined();
    expect(preview.content).toBeDefined();
    expect(preview.content.period).toBeDefined();
    expect(preview.content.jobHealthMetrics).toBeDefined();
    expect(preview.content.budgetInsights).toBeDefined();
  });

  it("should have digest history endpoint", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const history = await caller.emailDigest.getDigestHistory({
      limit: 10,
      offset: 0,
    });

    expect(Array.isArray(history)).toBe(true);
  });
});

describe("Phase 26: Budget Alert Automation", () => {
  it("should create budget threshold", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.budgetAlerts.createThreshold({
      name: "Test Monthly Budget",
      thresholdType: "monthly",
      thresholdAmount: 100000,
      currency: "SAR",
      warningPercentage: 80,
      criticalPercentage: 95,
      alertChannels: ["email"],
      alertRecipients: ["admin@example.com"],
    });

    expect(result.success).toBe(true);
    expect(result.thresholdId).toBeGreaterThan(0);
  });

  it("should get all budget thresholds", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const thresholds = await caller.budgetAlerts.getThresholds();

    expect(Array.isArray(thresholds)).toBe(true);
  });

  it("should get budget monitoring dashboard", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const dashboard = await caller.budgetAlerts.getDashboard();

    expect(dashboard).toBeDefined();
    expect(dashboard.summary).toBeDefined();
    expect(dashboard.summary.totalThresholds).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(dashboard.thresholds)).toBe(true);
    expect(Array.isArray(dashboard.recentAlerts)).toBe(true);
  });

  it("should get unacknowledged alerts", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const alerts = await caller.budgetAlerts.getUnacknowledgedAlerts();

    expect(Array.isArray(alerts)).toBe(true);
  });

  it("should get alert history", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const history = await caller.budgetAlerts.getAlertHistory({
      limit: 20,
    });

    expect(Array.isArray(history)).toBe(true);
  });
});

describe("Phase 26: Custom Template Builder", () => {
  it("should get predefined budget templates", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const templates = await caller.budgetTemplates.listTemplates({});

    expect(Array.isArray(templates)).toBe(true);
    expect(templates.length).toBeGreaterThan(0);
  });

  it("should get custom templates", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const customTemplates = await caller.budgetTemplates.getCustomTemplates();

    expect(Array.isArray(customTemplates)).toBe(true);
  });

  it("should search templates by query", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const results = await caller.budgetTemplates.searchTemplates({
      query: "tech",
    });

    expect(Array.isArray(results)).toBe(true);
  });

  it("should compare multiple templates", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const allTemplates = await caller.budgetTemplates.listTemplates({});
    
    if (allTemplates.length >= 2) {
      const templateIds = allTemplates.slice(0, 2).map(t => t.id);
      
      const comparison = await caller.budgetTemplates.compareTemplates({
        templateIds,
      });

      expect(Array.isArray(comparison)).toBe(true);
      expect(comparison.length).toBe(2);
      expect(comparison[0]).toHaveProperty('totalCost');
      expect(comparison[0]).toHaveProperty('estimatedROI');
    }
  });

  it("should preview template application", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const allTemplates = await caller.budgetTemplates.listTemplates({});
    
    if (allTemplates.length > 0) {
      const preview = await caller.budgetTemplates.previewTemplate({
        templateId: allTemplates[0].id,
        scenarioName: "Test Scenario Preview",
        budgetMultiplier: 1.0,
        recipientMultiplier: 1.0,
      });

      expect(preview).toBeDefined();
      expect(preview.templateId).toBe(allTemplates[0].id);
      expect(preview.scenarioName).toBe("Test Scenario Preview");
      expect(Array.isArray(preview.campaigns)).toBe(true);
      expect(preview.estimatedTotalCost).toBeGreaterThan(0);
    }
  });
});

describe("Phase 26: Integration Tests", () => {
  it("should have all Phase 26 routers registered", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    expect(caller.emailDigest).toBeDefined();
    expect(caller.budgetAlerts).toBeDefined();
    expect(caller.budgetTemplates).toBeDefined();
  });

  it("should have Gmail integration helper functions", async () => {
    const gmailModule = await import("./gmailIntegration");

    expect(gmailModule.sendGmailMessage).toBeDefined();
    expect(gmailModule.generateWeeklyDigestContent).toBeDefined();
    expect(gmailModule.generateBudgetAlertContent).toBeDefined();
    expect(gmailModule.htmlToPlainText).toBeDefined();
  });

  it("should have budget alert automation functions", async () => {
    const budgetAlertModule = await import("./budgetAlertAutomation");

    expect(budgetAlertModule.checkBudgetThreshold).toBeDefined();
    expect(budgetAlertModule.checkAllBudgetThresholds).toBeDefined();
    expect(budgetAlertModule.getBudgetAlertHistory).toBeDefined();
    expect(budgetAlertModule.acknowledgeBudgetAlert).toBeDefined();
  });
});
