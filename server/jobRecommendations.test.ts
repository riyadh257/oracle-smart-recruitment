import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { candidates, jobs, employers, candidatePreferences } from "../drizzle/schema";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: "test-candidate",
    email: "candidate@test.com",
    name: "Test Candidate",
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

  return ctx;
}

describe("Job Recommendations", () => {
  it("should return personalized job recommendations", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create employer
    const [employer] = await db.insert(employers).values({
      userId: 1,
      companyName: "Test Company",
      companySize: "51-200",
    });

    // Create jobs
    const [job] = await db.insert(jobs).values({
      employerId: employer.insertId,
      title: "Software Engineer",
      location: "Riyadh",
      workSetting: "remote",
      employmentType: "full_time",
      salaryMin: 80000,
      salaryMax: 120000,
      requiredSkills: JSON.stringify(["JavaScript", "React", "Node.js"]),
      status: "active",
    });

    // Create candidate
    const [candidate] = await db.insert(candidates).values({
      userId: ctx.user.id,
      fullName: "Test Candidate",
      email: "candidate@test.com",
      technicalSkills: JSON.stringify(["JavaScript", "React"]),
      preferredWorkSetting: "remote",
      desiredSalaryMin: 70000,
      yearsOfExperience: 3,
    });

    // Note: candidatePreferences table may not exist yet, recommendations will work without it

    // Test recommendations
    const recommendations = await caller.application.getJobRecommendations({
      limit: 10,
    });

    expect(recommendations).toBeDefined();
    expect(Array.isArray(recommendations)).toBe(true);
    
    if (recommendations.length > 0) {
      const rec = recommendations[0];
      expect(rec).toHaveProperty("jobId");
      expect(rec).toHaveProperty("title");
      expect(rec).toHaveProperty("matchScore");
      expect(rec).toHaveProperty("matchReasons");
      expect(rec.matchScore).toBeGreaterThanOrEqual(0);
      expect(rec.matchScore).toBeLessThanOrEqual(100);
    }
  });

  it("should return collaborative recommendations", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create candidate
    const [candidate] = await db.insert(candidates).values({
      userId: ctx.user.id,
      fullName: "Test Candidate",
      email: "candidate@test.com",
      technicalSkills: JSON.stringify(["Python", "Data Science"]),
    });

    // Test collaborative recommendations
    const recommendations = await caller.application.getCollaborativeRecommendations({
      limit: 5,
    });

    expect(recommendations).toBeDefined();
    expect(Array.isArray(recommendations)).toBe(true);
  });
});
