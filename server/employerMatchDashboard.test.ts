import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { jobs, candidates, matchHistory } from "../drizzle/schema";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-employer-user",
    email: "employer@test.com",
    name: "Test Employer",
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

describe("employerMatchDashboard router", () => {
  let testJobId: number;
  let testCandidateId: number;
  let testMatchId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test job
    const jobResult = await db.insert(jobs).values({
      title: "Senior Software Engineer",
      location: "Riyadh, Saudi Arabia",
      status: "active",
      employerId: 1,
    });
    testJobId = Number(jobResult[0].insertId);

    // Create test candidate
    const candidateResult = await db.insert(candidates).values({
      name: "Test Candidate",
      email: "candidate@test.com",
      phone: "+966501234567",
      location: "Riyadh",
      yearsOfExperience: 5,
      currentJobTitle: "Software Engineer",
      currentCompany: "Tech Corp",
    });
    testCandidateId = Number(candidateResult[0].insertId);

    // Create test match
    const matchResult = await db.insert(matchHistory).values({
      candidateId: testCandidateId,
      jobId: testJobId,
      userId: 1,
      overallScore: 88,
      skillScore: 85,
      technicalScore: 90,
      cultureFitScore: 87,
      wellbeingScore: 82,
      burnoutRisk: 30,
      matchExplanation: "Excellent technical skills and strong culture fit",
      matchBreakdown: JSON.stringify({
        cultureFit: {
          innovation: 85,
          collaboration: 90,
          autonomy: 80,
          structure: 85,
          growth: 88,
        },
      }),
      topAttributes: JSON.stringify(["JavaScript", "React", "Node.js", "TypeScript"]),
      wasRecommended: 1,
      wasViewed: 0,
    });
    testMatchId = Number(matchResult[0].insertId);
  });

  it("should fetch active jobs", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const jobs = await caller.employerMatchDashboard.getActiveJobs();

    expect(jobs).toBeDefined();
    expect(Array.isArray(jobs)).toBe(true);
    expect(jobs.length).toBeGreaterThan(0);
    expect(jobs[0]).toHaveProperty("title");
    expect(jobs[0]).toHaveProperty("department");
    expect(jobs[0]).toHaveProperty("status", "active");
  });

  it("should fetch top matches for a job", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const matches = await caller.employerMatchDashboard.getTopMatchesForJob({
      jobId: testJobId,
      minScore: 70,
      limit: 10,
    });

    expect(matches).toBeDefined();
    expect(Array.isArray(matches)).toBe(true);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0]).toHaveProperty("overallScore");
    expect(matches[0].overallScore).toBeGreaterThanOrEqual(70);
    expect(matches[0]).toHaveProperty("candidateName");
    expect(matches[0]).toHaveProperty("cultureFitScore");
  });

  it("should fetch culture fit breakdown for a match", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const cultureFit = await caller.employerMatchDashboard.getCultureFitBreakdown({
      matchId: testMatchId,
    });

    expect(cultureFit).toBeDefined();
    expect(cultureFit).toHaveProperty("innovation");
    expect(cultureFit).toHaveProperty("collaboration");
    expect(cultureFit).toHaveProperty("autonomy");
    expect(cultureFit).toHaveProperty("structure");
    expect(cultureFit).toHaveProperty("growth");
    expect(cultureFit.innovation).toBeGreaterThanOrEqual(0);
    expect(cultureFit.innovation).toBeLessThanOrEqual(100);
  });

  it("should fetch hiring recommendations", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const recommendations = await caller.employerMatchDashboard.getHiringRecommendations({
      jobId: testJobId,
    });

    expect(recommendations).toBeDefined();
    expect(Array.isArray(recommendations)).toBe(true);
    if (recommendations.length > 0) {
      expect(recommendations[0]).toHaveProperty("candidateName");
      expect(recommendations[0]).toHaveProperty("overallScore");
      expect(recommendations[0]).toHaveProperty("insights");
      expect(Array.isArray(recommendations[0].insights)).toBe(true);
    }
  });

  it("should mark match as viewed", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.employerMatchDashboard.markMatchAsViewed({
      matchId: testMatchId,
    });

    expect(result).toEqual({ success: true });

    // Verify the match was marked as viewed
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const updatedMatch = await db
      .select()
      .from(matchHistory)
      .where((t) => t.id === testMatchId)
      .limit(1);

    expect(updatedMatch[0].wasViewed).toBe(1);
  });

  it("should fetch match statistics for a job", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.employerMatchDashboard.getMatchStatistics({
      jobId: testJobId,
    });

    expect(stats).toBeDefined();
    expect(stats).toHaveProperty("totalMatches");
    expect(stats).toHaveProperty("avgOverallScore");
    expect(stats).toHaveProperty("avgCultureScore");
    expect(stats).toHaveProperty("avgWellbeingScore");
    expect(stats).toHaveProperty("highScoreMatches");
    expect(stats.totalMatches).toBeGreaterThan(0);
  });

  it("should filter matches by minimum score", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const highScoreMatches = await caller.employerMatchDashboard.getTopMatchesForJob({
      jobId: testJobId,
      minScore: 85,
      limit: 10,
    });

    expect(highScoreMatches).toBeDefined();
    highScoreMatches.forEach((match) => {
      expect(match.overallScore).toBeGreaterThanOrEqual(85);
    });
  });
});
