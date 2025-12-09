import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Tests for Morning Digest Router
 * Validates digest preferences, email generation, and delivery tracking
 */

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(userId: number = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
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
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("morningDigestRouter", () => {
  describe("getPreferences", () => {
    it("should return default preferences when none exist", async () => {
      const { ctx } = createTestContext(999999); // Non-existent user
      const caller = appRouter.createCaller(ctx);

      const result = await caller.morningDigest.getPreferences();

      expect(result).toHaveProperty("enabled");
      expect(result).toHaveProperty("frequency");
      expect(result).toHaveProperty("deliveryTime");
      expect(result).toHaveProperty("minMatchScore");
      expect(result).toHaveProperty("maxMatchesPerDigest");
    });

    it("should return existing preferences for user", async () => {
      const { ctx } = createTestContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.morningDigest.getPreferences();

      expect(typeof result.enabled).toBe("boolean");
      expect(["daily", "weekly", "biweekly"]).toContain(result.frequency);
      expect(typeof result.minMatchScore).toBe("number");
      expect(result.minMatchScore).toBeGreaterThanOrEqual(0);
      expect(result.minMatchScore).toBeLessThanOrEqual(100);
    });
  });

  describe("updatePreferences", () => {
    it("should successfully update digest preferences", async () => {
      const { ctx } = createTestContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.morningDigest.updatePreferences({
        enabled: true,
        frequency: "daily",
        deliveryTime: "09:00",
        minMatchScore: 75,
        maxMatchesPerDigest: 15,
      });

      expect(result).toEqual({ success: true });
    });

    it("should validate match score range", async () => {
      const { ctx } = createTestContext(1);
      const caller = appRouter.createCaller(ctx);

      // Should not throw for valid scores
      await expect(
        caller.morningDigest.updatePreferences({
          minMatchScore: 50,
        })
      ).resolves.toHaveProperty("success", true);

      // Should throw for invalid scores
      await expect(
        caller.morningDigest.updatePreferences({
          minMatchScore: 150, // Invalid: > 100
        })
      ).rejects.toThrow();
    });
  });

  describe("getDeliveryHistory", () => {
    it("should return delivery history for user", async () => {
      const { ctx } = createTestContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.morningDigest.getDeliveryHistory({
        limit: 10,
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it("should respect limit parameter", async () => {
      const { ctx } = createTestContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.morningDigest.getDeliveryHistory({
        limit: 5,
      });

      expect(result.length).toBeLessThanOrEqual(5);
    });
  });

  describe("previewDigest", () => {
    it("should generate preview without sending email", async () => {
      const { ctx } = createTestContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.morningDigest.previewDigest();

      expect(result).toHaveProperty("matches");
      expect(result).toHaveProperty("totalCount");
      expect(result).toHaveProperty("highQualityCount");
      expect(Array.isArray(result.matches)).toBe(true);
    });
  });

  describe("trackOpen", () => {
    it("should track email open event", async () => {
      const { ctx } = createTestContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.morningDigest.trackOpen({
        trackingId: "test-tracking-id",
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe("trackClick", () => {
    it("should track email click event", async () => {
      const { ctx } = createTestContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.morningDigest.trackClick({
        trackingId: "test-tracking-id",
      });

      expect(result).toEqual({ success: true });
    });
  });
});
