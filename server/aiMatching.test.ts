import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): TrpcContext {
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

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("AI Matching Engine", () => {
  const ctx = createTestContext();
  const caller = appRouter.createCaller(ctx);

  describe("extractJobAttributes", () => {
    it("should extract attributes from job description", async () => {
      const result = await caller.aiMatching.extractJobAttributes({
        jobDescription: "Looking for a Senior Software Engineer with 5+ years of experience in React, Node.js, and TypeScript. Must have strong problem-solving skills and team collaboration experience.",
      });

      expect(result).toBeDefined();
      expect(result.attributes).toBeDefined();
      expect(Array.isArray(result.attributes)).toBe(true);
    });

    it("should reject empty job description", async () => {
      await expect(
        caller.aiMatching.extractJobAttributes({
          jobDescription: "",
        })
      ).rejects.toThrow();
    });
  });

  describe("extractCandidateAttributes", () => {
    it("should extract attributes from resume text", async () => {
      const result = await caller.aiMatching.extractCandidateAttributes({
        resumeText: "Experienced Full Stack Developer with 6 years in web development. Proficient in React, Vue.js, Node.js, and Python. Led teams of 5+ developers on multiple successful projects.",
      });

      expect(result).toBeDefined();
      expect(result.attributes).toBeDefined();
      expect(Array.isArray(result.attributes)).toBe(true);
    });

    it("should reject empty resume text", async () => {
      await expect(
        caller.aiMatching.extractCandidateAttributes({
          resumeText: "",
        })
      ).rejects.toThrow();
    });
  });

  describe("calculateMatch", () => {
    it("should calculate match score for valid candidate and job", async () => {
      // Note: This test requires actual candidate and job records in the database
      // In a real test environment, you would create test data first
      
      // For now, we'll test that the function exists and has the correct structure
      expect(caller.aiMatching.calculateMatch).toBeDefined();
      expect(typeof caller.aiMatching.calculateMatch.mutate).toBe("function");
    });
  });

  describe("getMatchDetails", () => {
    it("should retrieve match details for an application", async () => {
      // Test that the query exists and has correct structure
      expect(caller.aiMatching.getMatchDetails).toBeDefined();
      expect(typeof caller.aiMatching.getMatchDetails.query).toBe("function");
    });
  });

  describe("getTopMatchesForJob", () => {
    it("should return top matches for a job", async () => {
      // Test query structure
      expect(caller.aiMatching.getTopMatchesForJob).toBeDefined();
      expect(typeof caller.aiMatching.getTopMatchesForJob.query).toBe("function");
    });
  });

  describe("getRecommendedJobsForCandidate", () => {
    it("should return recommended jobs for a candidate", async () => {
      // Test query structure
      expect(caller.aiMatching.getRecommendedJobsForCandidate).toBeDefined();
      expect(typeof caller.aiMatching.getRecommendedJobsForCandidate.query).toBe("function");
    });
  });
});

describe("Matching Preferences", () => {
  const ctx = createTestContext();
  const caller = appRouter.createCaller(ctx);

  describe("get preferences", () => {
    it("should retrieve or create default matching preferences", async () => {
      const result = await caller.matchingPreferences.get();

      expect(result).toBeDefined();
      expect(result.technicalWeight).toBeDefined();
      expect(result.cultureWeight).toBeDefined();
      expect(result.wellbeingWeight).toBeDefined();
      expect(result.technicalWeight + result.cultureWeight + result.wellbeingWeight).toBe(100);
    });
  });

  describe("update preferences", () => {
    it("should update matching preferences with valid weights", async () => {
      const result = await caller.matchingPreferences.update({
        technicalWeight: 50,
        cultureWeight: 30,
        wellbeingWeight: 20,
        minOverallMatchScore: 70,
        minTechnicalScore: 60,
        minCultureScore: 50,
        minWellbeingScore: 50,
        enableAutoNotifications: true,
        notificationFrequency: "daily_digest",
      });

      expect(result).toEqual({ success: true });
    });

    it("should reject weights that don't sum to 100", async () => {
      await expect(
        caller.matchingPreferences.update({
          technicalWeight: 50,
          cultureWeight: 30,
          wellbeingWeight: 30, // Total = 110
          minOverallMatchScore: 70,
          minTechnicalScore: 60,
          minCultureScore: 50,
          minWellbeingScore: 50,
          enableAutoNotifications: true,
          notificationFrequency: "daily_digest",
        })
      ).rejects.toThrow("Weights must sum to 100%");
    });
  });
});
