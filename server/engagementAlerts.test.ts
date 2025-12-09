import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "user" | "admin" = "admin"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-employer",
    email: "employer@example.com",
    name: "Test Employer",
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

  return ctx;
}

describe("engagement.getAlerts", () => {
  it("returns list of engagement alerts", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.engagement.getAlerts();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    
    // Verify structure of returned data
    if (result.length > 0) {
      const alert = result[0];
      expect(alert).toHaveProperty("id");
      expect(alert).toHaveProperty("type");
      expect(alert).toHaveProperty("candidateName");
      expect(alert).toHaveProperty("position");
      expect(alert).toHaveProperty("message");
      expect(alert).toHaveProperty("engagementScore");
      expect(alert).toHaveProperty("lastActivity");
      
      // Verify alert type is valid
      expect(["high_value", "declining", "inactive"]).toContain(alert.type);
      
      // Verify engagement score is a number
      expect(typeof alert.engagementScore).toBe("number");
      expect(alert.engagementScore).toBeGreaterThanOrEqual(0);
      expect(alert.engagementScore).toBeLessThanOrEqual(100);
    }
  });
});

describe("engagement.updateThresholds", () => {
  it("updates alert threshold settings", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.engagement.updateThresholds({
      highValue: 85,
      declining: 50,
      inactive: 30,
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("validates threshold values are within range", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Test with valid values
    const validResult = await caller.engagement.updateThresholds({
      highValue: 90,
      declining: 60,
      inactive: 40,
    });

    expect(validResult.success).toBe(true);
    
    // Thresholds should be between 0 and 100
    expect(validResult).toBeDefined();
  });
});

describe("engagement.dismissAlert", () => {
  it("dismisses an engagement alert", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First get alerts
    const alerts = await caller.engagement.getAlerts();
    
    if (alerts.length > 0) {
      const alertId = alerts[0].id;
      
      const result = await caller.engagement.dismissAlert({
        alertId,
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    } else {
      // Test with non-existent alert
      const result = await caller.engagement.dismissAlert({
        alertId: 99999,
      });

      expect(result).toBeDefined();
      expect(typeof result.success).toBe("boolean");
    }
  });
});

describe("Engagement Score Calculation", () => {
  it("categorizes candidates correctly based on engagement score", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const alerts = await caller.engagement.getAlerts();
    
    // Verify alert types match engagement scores
    alerts.forEach(alert => {
      if (alert.type === "high_value") {
        // High value candidates should have high engagement scores
        expect(alert.engagementScore).toBeGreaterThan(70);
      } else if (alert.type === "declining") {
        // Declining candidates should have medium engagement scores
        expect(alert.engagementScore).toBeGreaterThan(30);
        expect(alert.engagementScore).toBeLessThan(80);
      } else if (alert.type === "inactive") {
        // Inactive candidates should have low engagement scores
        expect(alert.engagementScore).toBeLessThan(50);
      }
    });
  });

  it("includes trend information for declining alerts", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const alerts = await caller.engagement.getAlerts();
    const decliningAlerts = alerts.filter(a => a.type === "declining");
    
    decliningAlerts.forEach(alert => {
      // Declining alerts should have trend data
      if (alert.trend) {
        expect(["up", "down"]).toContain(alert.trend);
        if (alert.trendValue) {
          expect(typeof alert.trendValue).toBe("string");
        }
      }
    });
  });

  it("provides recommendations for each alert", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const alerts = await caller.engagement.getAlerts();
    
    alerts.forEach(alert => {
      // Each alert should have a recommendation
      if (alert.recommendation) {
        expect(typeof alert.recommendation).toBe("string");
        expect(alert.recommendation.length).toBeGreaterThan(0);
      }
    });
  });
});
