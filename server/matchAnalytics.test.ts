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
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("matchAnalytics router", () => {
  it("should get match trends with valid date range", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const startDate = new Date("2024-01-01").toISOString();
    const endDate = new Date("2024-12-31").toISOString();

    const result = await caller.matchAnalytics.getTrends({
      startDate,
      endDate,
      groupBy: "week",
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should get attribute correlation analysis", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.matchAnalytics.getCorrelation({
      startDate: new Date("2024-01-01").toISOString(),
      endDate: new Date("2024-12-31").toISOString(),
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should get conversion rates", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.matchAnalytics.getConversionRates({
      startDate: new Date("2024-01-01").toISOString(),
      endDate: new Date("2024-12-31").toISOString(),
    });

    expect(result).toBeDefined();
    expect(result.stages).toBeDefined();
    expect(result.conversionRates).toBeDefined();
    expect(typeof result.conversionRates.overallConversion).toBe("number");
  });

  it("should get match analytics summary", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.matchAnalytics.getSummary({
      startDate: new Date("2024-01-01").toISOString(),
      endDate: new Date("2024-12-31").toISOString(),
    });

    expect(result).toBeDefined();
    if (result) {
      expect(typeof result.totalMatches).toBe("number");
    }
  });

  it("should get job category performance", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.matchAnalytics.getCategoryPerformance({
      startDate: new Date("2024-01-01").toISOString(),
      endDate: new Date("2024-12-31").toISOString(),
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should handle different groupBy options", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const startDate = new Date("2024-01-01").toISOString();
    const endDate = new Date("2024-12-31").toISOString();

    const dailyResult = await caller.matchAnalytics.getTrends({
      startDate,
      endDate,
      groupBy: "day",
    });

    const weeklyResult = await caller.matchAnalytics.getTrends({
      startDate,
      endDate,
      groupBy: "week",
    });

    const monthlyResult = await caller.matchAnalytics.getTrends({
      startDate,
      endDate,
      groupBy: "month",
    });

    expect(dailyResult).toBeDefined();
    expect(weeklyResult).toBeDefined();
    expect(monthlyResult).toBeDefined();
  });
});
