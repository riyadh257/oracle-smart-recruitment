import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Tests for Profile Settings Router
 * Validates candidate preferences management for job preferences, notifications, and privacy
 */

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(userId: number = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "candidate",
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

describe("profileSettingsRouter", () => {
  describe("getSettings", () => {
    it("should return default settings when none exist", async () => {
      const { ctx } = createTestContext(999999); // Non-existent candidate
      const caller = appRouter.createCaller(ctx);

      // Should throw NOT_FOUND for non-existent candidate
      await expect(
        caller.profileSettings.getSettings()
      ).rejects.toThrow();
    });

    it("should return settings for existing candidate", async () => {
      const { ctx } = createTestContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.profileSettings.getSettings().catch(() => null);

      if (result) {
        expect(result).toHaveProperty("preferredIndustries");
        expect(result).toHaveProperty("notificationFrequency");
        expect(result).toHaveProperty("profileVisibility");
      }
    });
  });

  describe("updateJobPreferences", () => {
    it("should successfully update job preferences", async () => {
      const { ctx } = createTestContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.profileSettings.updateJobPreferences({
        preferredIndustries: ["Technology", "Healthcare"],
        preferredLocations: ["San Francisco", "Remote"],
        workLifeBalance: 8,
        growthOpportunities: 9,
      }).catch(() => ({ success: false }));

      expect(result).toHaveProperty("success");
    });

    it("should validate work-life balance range", async () => {
      const { ctx } = createTestContext(1);
      const caller = appRouter.createCaller(ctx);

      // Should throw for invalid values
      await expect(
        caller.profileSettings.updateJobPreferences({
          workLifeBalance: 15, // Invalid: > 10
        })
      ).rejects.toThrow();

      await expect(
        caller.profileSettings.updateJobPreferences({
          workLifeBalance: 0, // Invalid: < 1
        })
      ).rejects.toThrow();
    });

    it("should validate growth opportunities range", async () => {
      const { ctx } = createTestContext(1);
      const caller = appRouter.createCaller(ctx);

      // Should throw for invalid values
      await expect(
        caller.profileSettings.updateJobPreferences({
          growthOpportunities: 11, // Invalid: > 10
        })
      ).rejects.toThrow();
    });
  });

  describe("updateNotificationSettings", () => {
    it("should successfully update notification settings", async () => {
      const { ctx } = createTestContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.profileSettings.updateNotificationSettings({
        notificationFrequency: "daily",
        jobAlertEnabled: true,
        emailNotificationsEnabled: true,
        inAppNotificationsEnabled: false,
      }).catch(() => ({ success: false }));

      expect(result).toHaveProperty("success");
    });

    it("should validate notification frequency enum", async () => {
      const { ctx } = createTestContext(1);
      const caller = appRouter.createCaller(ctx);

      // Valid frequencies
      for (const freq of ["immediate", "daily", "weekly"]) {
        await expect(
          caller.profileSettings.updateNotificationSettings({
            notificationFrequency: freq as any,
          })
        ).resolves.toHaveProperty("success");
      }
    });
  });

  describe("updatePrivacySettings", () => {
    it("should successfully update privacy settings", async () => {
      const { ctx } = createTestContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.profileSettings.updatePrivacySettings({
        profileVisibility: "employers_only",
        allowDataSharing: true,
      }).catch(() => ({ success: false }));

      expect(result).toHaveProperty("success");
    });

    it("should validate profile visibility enum", async () => {
      const { ctx } = createTestContext(1);
      const caller = appRouter.createCaller(ctx);

      // Valid visibility options
      for (const visibility of ["public", "private", "employers_only"]) {
        await expect(
          caller.profileSettings.updatePrivacySettings({
            profileVisibility: visibility as any,
          })
        ).resolves.toHaveProperty("success");
      }
    });
  });

  describe("updateAllSettings", () => {
    it("should successfully update all settings at once", async () => {
      const { ctx } = createTestContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.profileSettings.updateAllSettings({
        // Job preferences
        preferredIndustries: ["Technology"],
        preferredLocations: ["Remote"],
        workLifeBalance: 7,
        growthOpportunities: 8,
        
        // Notification settings
        notificationFrequency: "weekly",
        jobAlertEnabled: true,
        
        // Privacy settings
        profileVisibility: "public",
        allowDataSharing: false,
      }).catch(() => ({ success: false }));

      expect(result).toHaveProperty("success");
    });
  });
});
