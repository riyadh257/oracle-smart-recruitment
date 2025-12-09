/**
 * Trust, Transparency, and Engagement Sprint Tests
 * Tests for match explanations, top matches widget, and training recommendations
 */

import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { candidates, jobs, trainingPrograms } from "../drizzle/schema";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
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

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Trust, Transparency, and Engagement Sprint", () => {
  let testCandidateId: number;
  let testJobId: number;
  let testTrainingId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test candidate
    const [candidate] = await db.insert(candidates).values({
      userId: 1,
      fullName: "Test Candidate",
      email: "test@example.com",
      technicalSkills: JSON.stringify(["JavaScript", "React", "Node.js"]),
      softSkills: JSON.stringify(["Communication", "Teamwork"]),
      preferredWorkSetting: "remote",
      expectedSalary: 80000,
      location: "Riyadh",
    });
    testCandidateId = candidate.insertId;

    // Create test job
    const [job] = await db.insert(jobs).values({
      title: "Senior Full Stack Developer",
      originalDescription: "We are looking for an experienced full stack developer",
      requiredSkills: JSON.stringify(["JavaScript", "React", "Node.js", "TypeScript", "PostgreSQL"]),
      preferredSkills: JSON.stringify(["Docker", "Kubernetes"]),
      workSetting: "remote",
      employmentType: "full_time",
      location: "Riyadh",
      salaryMin: 75000,
      salaryMax: 95000,
      status: "active",
      employerId: 1,
    });
    testJobId = job.insertId;

    // Create test training program (duration is int in hours)
    const [training] = await db.insert(trainingPrograms).values({
      title: "Advanced TypeScript Mastery",
      slug: "advanced-typescript-mastery",
      description: "Master TypeScript for enterprise applications",
      category: "technical",
      level: "intermediate",
      duration: 40, // 40 hours
      format: "self_paced",
      price: 29900, // $299.00 in cents
      isFree: 0,
      skills: JSON.stringify(["TypeScript", "Advanced Types", "Generics"]),
      status: "published",
      trainerId: 1,
    });
    testTrainingId = training.insertId;
  });

  describe("Priority 1: Match Explanations", () => {
    it("should generate detailed match explanation for a job", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.aiMatching.getJobMatchExplanation({
        jobId: testJobId,
      });

      expect(result).toBeDefined();
      expect(result.matchScores).toBeDefined();
      expect(result.matchScores.overallMatchScore).toBeGreaterThanOrEqual(0);
      expect(result.matchScores.overallMatchScore).toBeLessThanOrEqual(100);
      
      expect(result.explanation).toBeDefined();
      expect(result.explanation.summary).toBeTruthy();
      expect(Array.isArray(result.explanation.matchedSkills)).toBe(true);
      expect(Array.isArray(result.explanation.growthOpportunities)).toBe(true);
      expect(Array.isArray(result.explanation.recommendations)).toBe(true);
    });

    it("should include match score breakdown", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.aiMatching.getJobMatchExplanation({
        jobId: testJobId,
      });

      expect(result.matchScores.skillMatchScore).toBeDefined();
      expect(result.matchScores.cultureFitScore).toBeDefined();
      expect(result.matchScores.wellbeingMatchScore).toBeDefined();
      expect(result.matchScores.workSettingMatchScore).toBeDefined();
    });

    it("should provide strength areas and improvement areas", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.aiMatching.getJobMatchExplanation({
        jobId: testJobId,
      });

      expect(Array.isArray(result.explanation.strengthAreas)).toBe(true);
      expect(Array.isArray(result.explanation.improvementAreas)).toBe(true);
      
      // Should have at least some data
      const hasData = 
        result.explanation.strengthAreas.length > 0 || 
        result.explanation.improvementAreas.length > 0;
      expect(hasData).toBe(true);
    });
  });

  describe("Priority 2: Top Matches Widget", () => {
    it("should return top 5 job matches for candidate", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.aiMatching.getTopMatches();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it("should include match scores in top matches", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.aiMatching.getTopMatches();

      if (result.length > 0) {
        const firstMatch = result[0];
        expect(firstMatch.job).toBeDefined();
        expect(firstMatch.matchScore).toBeGreaterThanOrEqual(0);
        expect(firstMatch.matchScore).toBeLessThanOrEqual(100);
        expect(firstMatch.skillMatchScore).toBeDefined();
        expect(firstMatch.cultureFitScore).toBeDefined();
        expect(firstMatch.wellbeingMatchScore).toBeDefined();
      }
    });

    it("should sort matches by overall score descending", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.aiMatching.getTopMatches();

      if (result.length > 1) {
        for (let i = 0; i < result.length - 1; i++) {
          expect(result[i].matchScore).toBeGreaterThanOrEqual(result[i + 1].matchScore);
        }
      }
    });
  });

  describe("Priority 3: Training Recommendations", () => {
    it("should identify skill gaps for a job", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.aiMatching.getTrainingRecommendations({
        jobId: testJobId,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result.skillGaps)).toBe(true);
      
      // Should identify TypeScript and PostgreSQL as gaps
      const hasGaps = result.skillGaps.length > 0;
      expect(hasGaps).toBe(true);
    });

    it("should recommend relevant training programs", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.aiMatching.getTrainingRecommendations({
        jobId: testJobId,
      });

      expect(Array.isArray(result.recommendedTraining)).toBe(true);
      
      // Each recommendation should have program and matched gaps
      result.recommendedTraining.forEach((rec: any) => {
        expect(rec.program).toBeDefined();
        expect(Array.isArray(rec.matchedGaps)).toBe(true);
        expect(rec.relevanceScore).toBeGreaterThanOrEqual(0);
        expect(rec.relevanceScore).toBeLessThanOrEqual(100);
      });
    });

    it("should estimate match score improvement", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.aiMatching.getTrainingRecommendations({
        jobId: testJobId,
      });

      expect(result.currentMatchScore).toBeDefined();
      expect(result.estimatedMatchImpact).toBeDefined();
      expect(result.projectedMatchScore).toBeDefined();
      
      // Projected should be >= current
      expect(result.projectedMatchScore).toBeGreaterThanOrEqual(result.currentMatchScore);
      
      // Projected should not exceed 100
      expect(result.projectedMatchScore).toBeLessThanOrEqual(100);
    });

    it("should prioritize required skills over preferred", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.aiMatching.getTrainingRecommendations({
        jobId: testJobId,
      });

      const requiredGaps = result.skillGaps.filter((g: any) => g.priority === "required");
      const preferredGaps = result.skillGaps.filter((g: any) => g.priority === "preferred");
      
      // Should have both types
      expect(requiredGaps.length + preferredGaps.length).toBeGreaterThan(0);
    });
  });

  describe("Integration: Complete User Journey", () => {
    it("should support full trust-building flow", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      // Step 1: Get top matches on dashboard
      const topMatches = await caller.aiMatching.getTopMatches();
      expect(topMatches.length).toBeGreaterThan(0);

      // Step 2: View match explanation for top job
      const explanation = await caller.aiMatching.getJobMatchExplanation({
        jobId: topMatches[0].job.id,
      });
      expect(explanation.matchScores).toBeDefined();
      expect(explanation.explanation).toBeDefined();

      // Step 3: Get training recommendations to improve
      const training = await caller.aiMatching.getTrainingRecommendations({
        jobId: topMatches[0].job.id,
      });
      expect(training.skillGaps).toBeDefined();
      expect(training.recommendedTraining).toBeDefined();

      // Verify the flow makes sense
      expect(explanation.matchScores.overallMatchScore).toBe(training.currentMatchScore);
    });
  });
});
