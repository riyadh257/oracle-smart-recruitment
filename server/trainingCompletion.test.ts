import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { programEnrollments, trainingPrograms, candidates, users } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

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
    res: {} as TrpcContext["res"],
  };
}

describe("Training Completion Tracking", () => {
  let testUserId: number;
  let testCandidateId: number;
  let testProgramId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const timestamp = Date.now();
    const uniqueId = `test-training-${timestamp}`;

    // Create test user
    const [userResult] = await db.insert(users).values({
      openId: uniqueId,
      email: `${uniqueId}@example.com`,
      name: "Training Test User",
      role: "user",
      loginMethod: "manus"
    });
    testUserId = userResult.insertId;

    // Create test candidate
    const [candidateResult] = await db.insert(candidates).values({
      userId: testUserId,
      fullName: "Training Test Candidate",
      email: `${uniqueId}@example.com`,
      phone: "1234567890",
      technicalSkills: JSON.stringify(["JavaScript", "React"]) as any
    });
    testCandidateId = candidateResult.insertId;

    // Create test training program
    const [programResult] = await db.insert(trainingPrograms).values({
      title: "Advanced TypeScript Test",
      slug: `advanced-typescript-${timestamp}`,
      description: "Learn advanced TypeScript concepts",
      category: "technical",
      level: "advanced",
      duration: 40,
      format: "self_paced",
      isFree: 1,
      isPublished: 1,
      skillsGained: JSON.stringify(["TypeScript", "Advanced Programming"]) as any
    });
    testProgramId = programResult.insertId;
  });

  it("should enroll a user in a training program", async () => {
    const ctx = createAuthContext(testUserId);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.trainingCompletion.enrollInProgram({
      programId: testProgramId
    });

    expect(result.success).toBe(true);
    expect(result.enrollmentId).toBeGreaterThan(0);

    // Verify enrollment was created
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [enrollment] = await db.select()
      .from(programEnrollments)
      .where(and(
        eq(programEnrollments.userId, testUserId),
        eq(programEnrollments.programId, testProgramId)
      ))
      .limit(1);

    expect(enrollment).toBeDefined();
    expect(enrollment?.status).toBe("enrolled");
  });

  it("should get user's enrollments", async () => {
    const ctx = createAuthContext(testUserId);
    const caller = appRouter.createCaller(ctx);

    const enrollments = await caller.trainingCompletion.getMyEnrollments();

    expect(Array.isArray(enrollments)).toBe(true);
    expect(enrollments.length).toBeGreaterThan(0);
    
    const testEnrollment = enrollments.find(e => e.programId === testProgramId);
    expect(testEnrollment).toBeDefined();
    expect(testEnrollment?.programTitle).toBe("Advanced TypeScript Test");
  });

  it("should mark training as completed and update skills", { timeout: 30000 }, async () => {
    const ctx = createAuthContext(testUserId);
    const caller = appRouter.createCaller(ctx);

    // Note: This test may take a while because it recalculates match scores for all active jobs
    const result = await caller.trainingCompletion.completeProgram({
      programId: testProgramId
    });

    expect(result.success).toBe(true);
    expect(result.enrollmentId).toBeGreaterThan(0);

    // Verify enrollment status updated
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [enrollment] = await db.select()
      .from(programEnrollments)
      .where(and(
        eq(programEnrollments.userId, testUserId),
        eq(programEnrollments.programId, testProgramId)
      ))
      .limit(1);

    expect(enrollment?.status).toBe("completed");
    expect(enrollment?.completedAt).toBeDefined();
    expect(enrollment?.progress).toBe(10000); // 100%

    // Verify candidate skills were updated
    const [candidate] = await db.select()
      .from(candidates)
      .where(eq(candidates.userId, testUserId))
      .limit(1);

    const skills = Array.isArray(candidate?.technicalSkills)
      ? candidate.technicalSkills
      : JSON.parse(candidate?.technicalSkills as any || "[]");

    expect(skills).toContain("TypeScript");
    expect(skills).toContain("Advanced Programming");
    
    // Match score improvements array should exist (may be empty if no jobs match)
    expect(Array.isArray(result.matchScoreImprovements)).toBe(true);
  });

  it("should prevent duplicate enrollments", async () => {
    const ctx = createAuthContext(testUserId);
    const caller = appRouter.createCaller(ctx);

    // Try to enroll again
    await expect(
      caller.trainingCompletion.enrollInProgram({
        programId: testProgramId
      })
    ).rejects.toThrow("Already enrolled in this program");
  });

  it("should get training recommendations", async () => {
    const ctx = createAuthContext(testUserId);
    const caller = appRouter.createCaller(ctx);

    const recommendations = await caller.trainingCompletion.getRecommendations({});

    expect(Array.isArray(recommendations)).toBe(true);
    // Recommendations may be empty if no skill gaps exist
  });
});
