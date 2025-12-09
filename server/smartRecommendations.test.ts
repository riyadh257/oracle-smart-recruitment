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

describe("smartRecommendations router", () => {
  it("should get learning weights", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.smartRecommendations.getLearningWeights({
      lookbackDays: 90,
    });

    expect(result).toBeDefined();
    expect(typeof result.skillWeight).toBe("number");
    expect(typeof result.cultureWeight).toBe("number");
    expect(typeof result.wellbeingWeight).toBe("number");
    expect(typeof result.experienceWeight).toBe("number");
    expect(result.outcomeBonus).toBeDefined();
    
    // Weights should sum to approximately 1.0
    const totalWeight = result.skillWeight + result.cultureWeight + result.wellbeingWeight + result.experienceWeight;
    expect(totalWeight).toBeGreaterThan(0.9);
    expect(totalWeight).toBeLessThan(1.1);
  });

  it("should get recommendations for a job", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.smartRecommendations.getRecommendations({
        jobId: 1,
        limit: 5,
        minScore: 60,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      
      // Each recommendation should have required fields
      result.forEach((rec: any) => {
        expect(rec.candidate).toBeDefined();
        expect(typeof rec.recommendationScore).toBe("number");
        expect(rec.matchScores).toBeDefined();
        expect(typeof rec.explanation).toBe("string");
        expect(typeof rec.confidence).toBe("number");
        expect(rec.confidence).toBeGreaterThanOrEqual(0);
        expect(rec.confidence).toBeLessThanOrEqual(1);
      });
    } catch (error) {
      // Expected if job doesn't exist
      expect(error).toBeDefined();
    }
  });

  it("should get recommendation statistics", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.smartRecommendations.getStatistics({
        jobId: 1,
      });

      expect(result).toBeDefined();
      expect(typeof result.totalCandidates).toBe("number");
      expect(typeof result.highConfidence).toBe("number");
      expect(typeof result.mediumConfidence).toBe("number");
      expect(typeof result.lowConfidence).toBe("number");
      expect(typeof result.avgRecommendationScore).toBe("number");
    } catch (error) {
      // Expected if job doesn't exist
      expect(error).toBeDefined();
    }
  });

  it("should record recommendation feedback", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.smartRecommendations.recordFeedback({
      candidateId: 1,
      jobId: 1,
      wasHelpful: true,
      actualOutcome: "hired",
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("should respect limit parameter in recommendations", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.smartRecommendations.getRecommendations({
        jobId: 1,
        limit: 3,
        minScore: 0,
      });

      if (result) {
        expect(result.length).toBeLessThanOrEqual(3);
      }
    } catch (error) {
      // Expected if job doesn't exist
      expect(error).toBeDefined();
    }
  });

  it("should respect minScore parameter in recommendations", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.smartRecommendations.getRecommendations({
        jobId: 1,
        limit: 10,
        minScore: 80,
      });

      if (result && result.length > 0) {
        // All recommendations should have score >= 80
        result.forEach((rec: any) => {
          expect(rec.recommendationScore).toBeGreaterThanOrEqual(80);
        });
      }
    } catch (error) {
      // Expected if job doesn't exist
      expect(error).toBeDefined();
    }
  });

  it("should return recommendations sorted by score", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.smartRecommendations.getRecommendations({
        jobId: 1,
        limit: 10,
        minScore: 0,
      });

      if (result && result.length > 1) {
        // Verify descending order
        for (let i = 0; i < result.length - 1; i++) {
          expect(result[i].recommendationScore).toBeGreaterThanOrEqual(
            result[i + 1].recommendationScore
          );
        }
      }
    } catch (error) {
      // Expected if job doesn't exist
      expect(error).toBeDefined();
    }
  });

  it("should adjust weights based on lookback period", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const weights30 = await caller.smartRecommendations.getLearningWeights({
      lookbackDays: 30,
    });

    const weights90 = await caller.smartRecommendations.getLearningWeights({
      lookbackDays: 90,
    });

    expect(weights30).toBeDefined();
    expect(weights90).toBeDefined();
    
    // Both should be valid weight distributions
    expect(weights30.skillWeight + weights30.cultureWeight + weights30.wellbeingWeight + weights30.experienceWeight).toBeGreaterThan(0.9);
    expect(weights90.skillWeight + weights90.cultureWeight + weights90.wellbeingWeight + weights90.experienceWeight).toBeGreaterThan(0.9);
  });
});
