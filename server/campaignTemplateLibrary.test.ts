import { describe, it, expect, vi } from "vitest";
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
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Campaign Template Library Router", () => {
  it("should have getTemplateLibrary procedure", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    expect(caller.campaignTemplateLibrary).toBeDefined();
    expect(caller.campaignTemplateLibrary.getTemplateLibrary).toBeDefined();
  });

  it("should return template library with default parameters", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.campaignTemplateLibrary.getTemplateLibrary({
      sortBy: 'performance',
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty("templates");
    expect(result).toHaveProperty("totalCount");
    expect(Array.isArray(result.templates)).toBe(true);
    expect(typeof result.totalCount).toBe("number");
  });

  it("should filter templates by category", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.campaignTemplateLibrary.getTemplateLibrary({
      category: 'welcome',
      sortBy: 'performance',
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result.templates)).toBe(true);
  });

  it("should have getRecommendedTemplates procedure", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    expect(caller.campaignTemplateLibrary.getRecommendedTemplates).toBeDefined();
  });

  it("should return recommended templates for segment", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.campaignTemplateLibrary.getRecommendedTemplates({
      segment: {
        industry: 'Technology',
        experienceLevel: 'Senior',
      },
      limit: 5,
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty("recommendations");
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(result.recommendations.length).toBeLessThanOrEqual(5);
  });

  it("should include ML-optimized send time in template data", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.campaignTemplateLibrary.getTemplateLibrary({
      sortBy: 'performance',
    });

    if (result.templates.length > 0) {
      const template = result.templates[0];
      expect(template).toHaveProperty("optimalDayOfWeek");
      expect(template).toHaveProperty("optimalHour");
      expect(template).toHaveProperty("expectedConversionRate");
      expect(template).toHaveProperty("confidence");
      
      expect(typeof template.optimalDayOfWeek).toBe("number");
      expect(typeof template.optimalHour).toBe("number");
      expect(typeof template.expectedConversionRate).toBe("number");
      expect(['high', 'medium', 'low']).toContain(template.confidence);
    }
  });
});
