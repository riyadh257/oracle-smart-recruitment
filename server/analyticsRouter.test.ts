import { describe, expect, it } from "vitest";
import { analyticsRouter } from "./analyticsRouter";
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
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("analyticsRouter", () => {
  describe("getOverviewMetrics", () => {
    it("should return comprehensive overview metrics", async () => {
      const { ctx } = createAuthContext();
      const caller = analyticsRouter.createCaller(ctx);

      const periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const periodEnd = new Date().toISOString();

      const result = await caller.getOverviewMetrics({
        periodStart,
        periodEnd,
      });

      // Check notifications metrics
      expect(result).toHaveProperty("notifications");
      expect(result.notifications).toHaveProperty("sent");
      expect(result.notifications).toHaveProperty("read");
      expect(result.notifications).toHaveProperty("clicked");
      expect(result.notifications).toHaveProperty("readRate");
      expect(result.notifications).toHaveProperty("clickRate");

      // Check enrichment metrics
      expect(result).toHaveProperty("enrichment");
      expect(result.enrichment).toHaveProperty("started");
      expect(result.enrichment).toHaveProperty("completed");
      expect(result.enrichment).toHaveProperty("failed");
      expect(result.enrichment).toHaveProperty("successRate");

      // Check bulk operations metrics
      expect(result).toHaveProperty("bulkOperations");
      expect(result.bulkOperations).toHaveProperty("started");
      expect(result.bulkOperations).toHaveProperty("completed");
      expect(result.bulkOperations).toHaveProperty("failed");
      expect(result.bulkOperations).toHaveProperty("successRate");

      // Check email campaigns metrics
      expect(result).toHaveProperty("emailCampaigns");
      expect(result.emailCampaigns).toHaveProperty("sent");
      expect(result.emailCampaigns).toHaveProperty("opened");
      expect(result.emailCampaigns).toHaveProperty("clicked");
      expect(result.emailCampaigns).toHaveProperty("openRate");
      expect(result.emailCampaigns).toHaveProperty("clickRate");

      // Check time-to-hire metrics
      expect(result).toHaveProperty("timeToHire");
      expect(result.timeToHire).toHaveProperty("overall");
      expect(result.timeToHire).toHaveProperty("withEnrichment");
      expect(result.timeToHire).toHaveProperty("withoutEnrichment");
      expect(result.timeToHire).toHaveProperty("improvement");

      // Check hires metrics
      expect(result).toHaveProperty("hires");
      expect(result.hires).toHaveProperty("total");

      // Validate data types
      expect(typeof result.notifications.sent).toBe("number");
      expect(typeof result.notifications.readRate).toBe("number");
      expect(typeof result.enrichment.successRate).toBe("number");
      expect(typeof result.bulkOperations.successRate).toBe("number");
      expect(typeof result.emailCampaigns.openRate).toBe("number");
      expect(typeof result.timeToHire.overall).toBe("number");
    });

    it("should calculate rates correctly", async () => {
      const { ctx } = createAuthContext();
      const caller = analyticsRouter.createCaller(ctx);

      const periodStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const periodEnd = new Date().toISOString();

      const result = await caller.getOverviewMetrics({
        periodStart,
        periodEnd,
      });

      // All rates should be between 0 and 100
      expect(result.notifications.readRate).toBeGreaterThanOrEqual(0);
      expect(result.notifications.readRate).toBeLessThanOrEqual(100);
      expect(result.notifications.clickRate).toBeGreaterThanOrEqual(0);
      expect(result.notifications.clickRate).toBeLessThanOrEqual(100);

      expect(result.enrichment.successRate).toBeGreaterThanOrEqual(0);
      expect(result.enrichment.successRate).toBeLessThanOrEqual(100);

      expect(result.bulkOperations.successRate).toBeGreaterThanOrEqual(0);
      expect(result.bulkOperations.successRate).toBeLessThanOrEqual(100);

      expect(result.emailCampaigns.openRate).toBeGreaterThanOrEqual(0);
      expect(result.emailCampaigns.openRate).toBeLessThanOrEqual(100);
      expect(result.emailCampaigns.clickRate).toBeGreaterThanOrEqual(0);
      expect(result.emailCampaigns.clickRate).toBeLessThanOrEqual(100);
    });
  });

  describe("getNotificationMetrics", () => {
    it("should return notification engagement metrics", async () => {
      const { ctx } = createAuthContext();
      const caller = analyticsRouter.createCaller(ctx);

      const periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const periodEnd = new Date().toISOString();

      const result = await caller.getNotificationMetrics({
        periodStart,
        periodEnd,
      });

      expect(result).toHaveProperty("overall");
      expect(result).toHaveProperty("byType");

      expect(result.overall).toHaveProperty("sent");
      expect(result.overall).toHaveProperty("read");
      expect(result.overall).toHaveProperty("clicked");
      expect(result.overall).toHaveProperty("readRate");
      expect(result.overall).toHaveProperty("clickRate");
      expect(result.overall).toHaveProperty("avgResponseTime");

      expect(Array.isArray(result.byType)).toBe(true);

      // Validate by-type metrics structure
      for (const typeMetric of result.byType) {
        expect(typeMetric).toHaveProperty("type");
        expect(typeMetric).toHaveProperty("sent");
        expect(typeMetric).toHaveProperty("read");
        expect(typeMetric).toHaveProperty("clicked");
        expect(typeMetric).toHaveProperty("readRate");
        expect(typeMetric).toHaveProperty("clickRate");
      }
    });
  });

  describe("getEnrichmentMetrics", () => {
    it("should return profile enrichment metrics", async () => {
      const { ctx } = createAuthContext();
      const caller = analyticsRouter.createCaller(ctx);

      const periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const periodEnd = new Date().toISOString();

      const result = await caller.getEnrichmentMetrics({
        periodStart,
        periodEnd,
      });

      expect(result).toHaveProperty("overall");
      expect(result).toHaveProperty("byType");

      expect(result.overall).toHaveProperty("started");
      expect(result.overall).toHaveProperty("completed");
      expect(result.overall).toHaveProperty("failed");
      expect(result.overall).toHaveProperty("partial");
      expect(result.overall).toHaveProperty("successRate");
      expect(result.overall).toHaveProperty("avgProcessingTime");
      expect(result.overall).toHaveProperty("avgConfidence");

      expect(Array.isArray(result.byType)).toBe(true);

      // Validate by-type metrics structure
      for (const typeMetric of result.byType) {
        expect(typeMetric).toHaveProperty("type");
        expect(typeMetric).toHaveProperty("started");
        expect(typeMetric).toHaveProperty("completed");
        expect(typeMetric).toHaveProperty("failed");
        expect(typeMetric).toHaveProperty("successRate");
      }
    });
  });

  describe("getBulkOperationsMetrics", () => {
    it("should return bulk operations metrics", async () => {
      const { ctx } = createAuthContext();
      const caller = analyticsRouter.createCaller(ctx);

      const periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const periodEnd = new Date().toISOString();

      const result = await caller.getBulkOperationsMetrics({
        periodStart,
        periodEnd,
      });

      expect(result).toHaveProperty("overall");
      expect(result).toHaveProperty("byType");

      expect(result.overall).toHaveProperty("started");
      expect(result.overall).toHaveProperty("completed");
      expect(result.overall).toHaveProperty("failed");
      expect(result.overall).toHaveProperty("cancelled");
      expect(result.overall).toHaveProperty("operationSuccessRate");
      expect(result.overall).toHaveProperty("itemsProcessed");
      expect(result.overall).toHaveProperty("itemsSuccess");
      expect(result.overall).toHaveProperty("itemsFailed");
      expect(result.overall).toHaveProperty("itemSuccessRate");
      expect(result.overall).toHaveProperty("avgProcessingTime");

      expect(Array.isArray(result.byType)).toBe(true);

      // Validate by-type metrics structure
      for (const typeMetric of result.byType) {
        expect(typeMetric).toHaveProperty("type");
        expect(typeMetric).toHaveProperty("started");
        expect(typeMetric).toHaveProperty("completed");
        expect(typeMetric).toHaveProperty("failed");
        expect(typeMetric).toHaveProperty("itemsProcessed");
        expect(typeMetric).toHaveProperty("itemsSuccess");
        expect(typeMetric).toHaveProperty("operationSuccessRate");
        expect(typeMetric).toHaveProperty("itemSuccessRate");
      }
    });
  });

  describe("getTimeSeriesData", () => {
    it("should return time-series data for requested metrics", async () => {
      const { ctx } = createAuthContext();
      const caller = analyticsRouter.createCaller(ctx);

      const periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const periodEnd = new Date().toISOString();

      const result = await caller.getTimeSeriesData({
        periodStart,
        periodEnd,
        metrics: ["notifications", "enrichment", "bulkOperations", "emailCampaigns", "timeToHire"],
      });

      expect(result).toHaveProperty("notifications");
      expect(result).toHaveProperty("enrichment");
      expect(result).toHaveProperty("bulkOperations");
      expect(result).toHaveProperty("emailCampaigns");
      expect(result).toHaveProperty("timeToHire");

      expect(Array.isArray(result.notifications)).toBe(true);
      expect(Array.isArray(result.enrichment)).toBe(true);
      expect(Array.isArray(result.bulkOperations)).toBe(true);
      expect(Array.isArray(result.emailCampaigns)).toBe(true);
      expect(Array.isArray(result.timeToHire)).toBe(true);

      // Validate notifications time-series structure
      if (result.notifications.length > 0) {
        const notif = result.notifications[0];
        expect(notif).toHaveProperty("date");
        expect(notif).toHaveProperty("sent");
        expect(notif).toHaveProperty("read");
        expect(notif).toHaveProperty("clicked");
        expect(notif).toHaveProperty("readRate");
      }

      // Validate enrichment time-series structure
      if (result.enrichment.length > 0) {
        const enrich = result.enrichment[0];
        expect(enrich).toHaveProperty("date");
        expect(enrich).toHaveProperty("started");
        expect(enrich).toHaveProperty("completed");
        expect(enrich).toHaveProperty("failed");
        expect(enrich).toHaveProperty("successRate");
      }
    });

    it("should support selective metric retrieval", async () => {
      const { ctx } = createAuthContext();
      const caller = analyticsRouter.createCaller(ctx);

      const periodStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const periodEnd = new Date().toISOString();

      const result = await caller.getTimeSeriesData({
        periodStart,
        periodEnd,
        metrics: ["notifications"],
      });

      expect(result).toHaveProperty("notifications");
      expect(result).not.toHaveProperty("enrichment");
      expect(result).not.toHaveProperty("bulkOperations");
    });
  });

  describe("getCandidateFunnel", () => {
    it("should return candidate journey funnel", async () => {
      const { ctx } = createAuthContext();
      const caller = analyticsRouter.createCaller(ctx);

      const periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const periodEnd = new Date().toISOString();

      const result = await caller.getCandidateFunnel({
        periodStart,
        periodEnd,
      });

      expect(result).toHaveProperty("stages");
      expect(Array.isArray(result.stages)).toBe(true);

      // Should have all funnel stages
      const stageNames = result.stages.map(s => s.name);
      expect(stageNames).toContain("Candidates");
      expect(stageNames).toContain("Applications");
      expect(stageNames).toContain("Screening");
      expect(stageNames).toContain("Interviewing");
      expect(stageNames).toContain("Offered");
      expect(stageNames).toContain("Hired");

      // Validate stage structure
      for (const stage of result.stages) {
        expect(stage).toHaveProperty("name");
        expect(stage).toHaveProperty("count");
        expect(stage).toHaveProperty("conversionRate");
        expect(typeof stage.count).toBe("number");
        expect(typeof stage.conversionRate).toBe("number");
        expect(stage.conversionRate).toBeGreaterThanOrEqual(0);
        expect(stage.conversionRate).toBeLessThanOrEqual(100);
      }
    });
  });

  describe("exportAnalytics", () => {
    it("should export analytics as CSV", async () => {
      const { ctx } = createAuthContext();
      const caller = analyticsRouter.createCaller(ctx);

      const periodStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const periodEnd = new Date().toISOString();

      const result = await caller.exportAnalytics({
        periodStart,
        periodEnd,
        format: "csv",
      });

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("format");
      expect(result).toHaveProperty("data");
      expect(result.success).toBe(true);
      expect(result.format).toBe("csv");
      expect(typeof result.data).toBe("string");
      expect(result.data).toContain(","); // CSV should contain commas
    });

    it("should export analytics as JSON", async () => {
      const { ctx } = createAuthContext();
      const caller = analyticsRouter.createCaller(ctx);

      const periodStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const periodEnd = new Date().toISOString();

      const result = await caller.exportAnalytics({
        periodStart,
        periodEnd,
        format: "json",
      });

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("format");
      expect(result).toHaveProperty("data");
      expect(result.success).toBe(true);
      expect(result.format).toBe("json");
      expect(typeof result.data).toBe("string");
      
      // Should be valid JSON
      expect(() => JSON.parse(result.data)).not.toThrow();
    });
  });
});
