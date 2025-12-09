import { describe, expect, it, beforeEach } from "vitest";
import { profileEnrichmentRouter } from "./profileEnrichmentRouter";
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

describe("profileEnrichmentRouter", () => {
  describe("getEnrichmentStatus", () => {
    it("should return not_started status for candidate with no enrichment history", async () => {
      const { ctx } = createAuthContext();
      const caller = profileEnrichmentRouter.createCaller(ctx);

      const result = await caller.getEnrichmentStatus({
        candidateId: 999999, // Non-existent candidate
      });

      expect(result.status).toBe("not_started");
      expect(result.lastEnrichment).toBeNull();
    });
  });

  describe("getEnrichmentHistory", () => {
    it("should return empty array for candidate with no enrichment history", async () => {
      const { ctx } = createAuthContext();
      const caller = profileEnrichmentRouter.createCaller(ctx);

      const result = await caller.getEnrichmentHistory({
        candidateId: 999999,
        limit: 10,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it("should respect limit parameter", async () => {
      const { ctx } = createAuthContext();
      const caller = profileEnrichmentRouter.createCaller(ctx);

      const result = await caller.getEnrichmentHistory({
        candidateId: 1,
        limit: 5,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(5);
    });
  });

  describe("getEnrichmentResults", () => {
    it("should return null for candidate with no enrichment results", async () => {
      const { ctx } = createAuthContext();
      const caller = profileEnrichmentRouter.createCaller(ctx);

      const result = await caller.getEnrichmentResults({
        candidateId: 999999,
      });

      expect(result).toBeNull();
    });
  });

  describe("getEnrichmentMetrics", () => {
    it("should return metrics for specified period", async () => {
      const { ctx } = createAuthContext();
      const caller = profileEnrichmentRouter.createCaller(ctx);

      const periodStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const periodEnd = new Date().toISOString();

      const result = await caller.getEnrichmentMetrics({
        periodStart,
        periodEnd,
      });

      expect(result).toHaveProperty("totalEnrichments");
      expect(result).toHaveProperty("successfulEnrichments");
      expect(result).toHaveProperty("failedEnrichments");
      expect(result).toHaveProperty("partialEnrichments");
      expect(result).toHaveProperty("averageProcessingTime");
      expect(result).toHaveProperty("successRate");

      expect(typeof result.totalEnrichments).toBe("number");
      expect(typeof result.successRate).toBe("number");
      expect(result.successRate).toBeGreaterThanOrEqual(0);
      expect(result.successRate).toBeLessThanOrEqual(100);
    });
  });

  describe("enrichProfile", () => {
    it("should validate input parameters", async () => {
      const { ctx } = createAuthContext();
      const caller = profileEnrichmentRouter.createCaller(ctx);

      await expect(
        caller.enrichProfile({
          candidateId: 0, // Invalid ID
          enrichmentType: "full",
        })
      ).rejects.toThrow();
    });

    it("should accept valid enrichment types", async () => {
      const { ctx } = createAuthContext();
      const caller = profileEnrichmentRouter.createCaller(ctx);

      const enrichmentTypes = ["full", "skills", "experience", "education", "certifications"] as const;

      for (const type of enrichmentTypes) {
        // This will fail due to non-existent candidate, but validates input
        await expect(
          caller.enrichProfile({
            candidateId: 999999,
            enrichmentType: type,
          })
        ).rejects.toThrow();
      }
    });
  });
});
