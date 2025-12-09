import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { candidates, jobs, employers, users } from "../drizzle/schema";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(user: AuthenticatedUser): TrpcContext {
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

describe("AI Job Matching with Scores", () => {
  let testUserId: number;
  let testCandidateId: number;
  let testEmployerId: number;
  let testJobIds: number[] = [];

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test user with unique timestamp to avoid conflicts
    const timestamp = Date.now();
    const [user] = await db.insert(users).values({
      openId: `test-job-matching-user-${timestamp}`,
      name: "Test Job Seeker",
      email: `test-jobseeker-${timestamp}@example.com`,
      role: "user",
    });
    testUserId = user.insertId;

    // Create test candidate with skills
    const [candidate] = await db.insert(candidates).values({
      userId: testUserId,
      fullName: "Test Job Seeker",
      email: "test-jobseeker@example.com",
      location: "Riyadh, Saudi Arabia",
      headline: "Full Stack Developer",
      technicalSkills: ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS"],
      preferredWorkSetting: "hybrid",
    });
    testCandidateId = candidate.insertId;

    // Create test employer
    const [employer] = await db.insert(employers).values({
      userId: testUserId,
      companyName: "Test Tech Company",
      industry: "Technology",
    });
    testEmployerId = employer.insertId;

    // Create test jobs with varying skill requirements
    const job1 = await db.insert(jobs).values({
      employerId: testEmployerId,
      title: "Senior Full Stack Developer",
      location: "Riyadh, Saudi Arabia",
      workSetting: "hybrid",
      employmentType: "full_time",
      requiredSkills: ["React", "Node.js", "TypeScript", "PostgreSQL"], // 4/4 match (100%)
      status: "active",
    });
    testJobIds.push(job1[0].insertId);

    const job2 = await db.insert(jobs).values({
      employerId: testEmployerId,
      title: "Frontend Developer",
      location: "Riyadh, Saudi Arabia",
      workSetting: "remote",
      employmentType: "full_time",
      requiredSkills: ["React", "Vue.js", "CSS"], // 1/3 match (33%)
      status: "active",
    });
    testJobIds.push(job2[0].insertId);

    const job3 = await db.insert(jobs).values({
      employerId: testEmployerId,
      title: "DevOps Engineer",
      location: "Jeddah, Saudi Arabia",
      workSetting: "onsite",
      employmentType: "full_time",
      requiredSkills: ["Kubernetes", "Docker", "AWS"], // 1/3 match (33%)
      status: "active",
    });
    testJobIds.push(job3[0].insertId);
  });

  it("should calculate match scores for authenticated candidate", async () => {
    const user: AuthenticatedUser = {
      id: testUserId,
      openId: "test-job-matching-user",
      email: "test-jobseeker@example.com",
      name: "Test Job Seeker",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const ctx = createAuthContext(user);
    const caller = appRouter.createCaller(ctx);

    const jobsWithScores = await caller.job.getWithMatchScores();

    expect(jobsWithScores).toBeDefined();
    expect(jobsWithScores.length).toBeGreaterThan(0);

    // Find our test jobs
    const job1 = jobsWithScores.find(j => j.id === testJobIds[0]);
    const job2 = jobsWithScores.find(j => j.id === testJobIds[1]);
    const job3 = jobsWithScores.find(j => j.id === testJobIds[2]);

    expect(job1).toBeDefined();
    expect(job2).toBeDefined();
    expect(job3).toBeDefined();

    // Job 1 should have highest match score (100% skills + location + work setting bonus)
    expect(job1!.matchScore).toBeGreaterThan(90);
    
    // Job 2 should have medium match (33% skills + location bonus)
    expect(job2!.matchScore).toBeLessThan(job1!.matchScore);
    
    // Job 3 should have lowest match (33% skills, different location, different work setting)
    expect(job3!.matchScore).toBeLessThan(job2!.matchScore);

    console.log("Job 1 (Full Stack) match score:", job1!.matchScore);
    console.log("Job 2 (Frontend) match score:", job2!.matchScore);
    console.log("Job 3 (DevOps) match score:", job3!.matchScore);
  });

  it("should sort jobs by match score descending", async () => {
    const user: AuthenticatedUser = {
      id: testUserId,
      openId: "test-job-matching-user",
      email: "test-jobseeker@example.com",
      name: "Test Job Seeker",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const ctx = createAuthContext(user);
    const caller = appRouter.createCaller(ctx);

    const jobsWithScores = await caller.job.getWithMatchScores();

    // Verify jobs are sorted by match score (descending)
    for (let i = 0; i < jobsWithScores.length - 1; i++) {
      expect(jobsWithScores[i]!.matchScore).toBeGreaterThanOrEqual(
        jobsWithScores[i + 1]!.matchScore || 0
      );
    }
  });

  it("should include matched skills in results", async () => {
    const user: AuthenticatedUser = {
      id: testUserId,
      openId: "test-job-matching-user",
      email: "test-jobseeker@example.com",
      name: "Test Job Seeker",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const ctx = createAuthContext(user);
    const caller = appRouter.createCaller(ctx);

    const jobsWithScores = await caller.job.getWithMatchScores();
    const job1 = jobsWithScores.find(j => j.id === testJobIds[0]);

    expect(job1).toBeDefined();
    expect(job1!.matchedSkills).toBeDefined();
    expect(job1!.matchedSkills.length).toBeGreaterThan(0);
    
    // Should match React, Node.js, TypeScript, PostgreSQL
    expect(job1!.matchedSkills).toContain("React");
    expect(job1!.matchedSkills).toContain("Node.js");
    expect(job1!.matchedSkills).toContain("TypeScript");
    expect(job1!.matchedSkills).toContain("PostgreSQL");
  });
});
