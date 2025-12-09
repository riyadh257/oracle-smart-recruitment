import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";
import { getDb } from "../db";
import { trainingPrograms, programEnrollments, lessonProgress } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

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

describe("training router", () => {
  let testProgramId: number;
  let testEnrollmentId: number;

  beforeAll(async () => {
    // Create a test training program
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [result] = await db.insert(trainingPrograms).values({
      title: "Test JavaScript Course",
      slug: "test-javascript-course",
      description: "Learn JavaScript fundamentals",
      category: "technical",
      level: "beginner",
      duration: 40,
      format: "self_paced",
      price: 0,
      isFree: 1,
      isPublished: 1,
      isFeatured: 1,
      certificateAwarded: 1,
      enrollmentCount: 0,
      averageRating: 0,
      reviewCount: 0,
    });

    testProgramId = result.insertId;
  });

  describe("listPrograms", () => {
    it("returns published programs", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const programs = await caller.training.listPrograms({
        limit: 10,
        offset: 0,
      });

      expect(programs).toBeDefined();
      expect(Array.isArray(programs)).toBe(true);
      expect(programs.length).toBeGreaterThan(0);
      
      // Verify all returned programs are published
      programs.forEach(program => {
        expect(program.isPublished).toBe(1);
      });
    });

    it("filters programs by category", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const programs = await caller.training.listPrograms({
        category: "technical",
        limit: 10,
        offset: 0,
      });

      expect(programs).toBeDefined();
      programs.forEach(program => {
        expect(program.category).toBe("technical");
      });
    });

    it("filters programs by level", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const programs = await caller.training.listPrograms({
        level: "beginner",
        limit: 10,
        offset: 0,
      });

      expect(programs).toBeDefined();
      programs.forEach(program => {
        expect(program.level).toBe("beginner");
      });
    });

    it("filters free programs only", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const programs = await caller.training.listPrograms({
        isFree: true,
        limit: 10,
        offset: 0,
      });

      expect(programs).toBeDefined();
      programs.forEach(program => {
        expect(program.isFree).toBe(1);
      });
    });
  });

  describe("getFeaturedPrograms", () => {
    it("returns only featured programs", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const programs = await caller.training.getFeaturedPrograms({ limit: 5 });

      expect(programs).toBeDefined();
      expect(Array.isArray(programs)).toBe(true);
      
      programs.forEach(program => {
        expect(program.isFeatured).toBe(1);
        expect(program.isPublished).toBe(1);
      });
    });

    it("respects limit parameter", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const programs = await caller.training.getFeaturedPrograms({ limit: 3 });

      expect(programs.length).toBeLessThanOrEqual(3);
    });
  });

  describe("enrollInProgram", () => {
    it("successfully enrolls user in a program", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.training.enrollInProgram({
        programId: testProgramId,
      });

      expect(result.success).toBe(true);
      expect(result.enrollmentId).toBeDefined();
      
      testEnrollmentId = result.enrollmentId;

      // Verify enrollment was created
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const enrollment = await db
        .select()
        .from(programEnrollments)
        .where(eq(programEnrollments.id, testEnrollmentId))
        .limit(1);

      expect(enrollment.length).toBe(1);
      expect(enrollment[0].userId).toBe(ctx.user.id);
      expect(enrollment[0].programId).toBe(testProgramId);
      expect(enrollment[0].status).toBe("enrolled");
    });

    it("prevents duplicate enrollment", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Try to enroll again
      await expect(
        caller.training.enrollInProgram({ programId: testProgramId })
      ).rejects.toThrow("Already enrolled");
    });
  });

  describe("getMyEnrollments", () => {
    it("returns user's enrollments", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const enrollments = await caller.training.getMyEnrollments({});

      expect(enrollments).toBeDefined();
      expect(Array.isArray(enrollments)).toBe(true);
      expect(enrollments.length).toBeGreaterThan(0);

      // Verify enrollment belongs to user
      enrollments.forEach(({ enrollment }) => {
        expect(enrollment.userId).toBe(ctx.user.id);
      });
    });

    it("filters enrollments by status", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const enrollments = await caller.training.getMyEnrollments({
        status: "enrolled",
      });

      enrollments.forEach(({ enrollment }) => {
        expect(enrollment.status).toBe("enrolled");
      });
    });
  });

  describe("getEnrollmentDetails", () => {
    it("returns enrollment with program and progress", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const details = await caller.training.getEnrollmentDetails({
        enrollmentId: testEnrollmentId,
      });

      expect(details).toBeDefined();
      expect(details.enrollment).toBeDefined();
      expect(details.program).toBeDefined();
      expect(details.modules).toBeDefined();
      expect(Array.isArray(details.modules)).toBe(true);

      expect(details.enrollment.id).toBe(testEnrollmentId);
      expect(details.program.id).toBe(testProgramId);
    });

    it("throws error for non-existent enrollment", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.training.getEnrollmentDetails({ enrollmentId: 999999 })
      ).rejects.toThrow("Enrollment not found");
    });

    it("prevents access to other user's enrollment", async () => {
      const ctx = createAuthContext(999); // Different user
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.training.getEnrollmentDetails({ enrollmentId: testEnrollmentId })
      ).rejects.toThrow("Enrollment not found");
    });
  });

  describe("updateLessonProgress", () => {
    it("creates new lesson progress record", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Note: This test assumes there's at least one lesson in the test program
      // In a real scenario, you'd create test modules and lessons first
      
      const result = await caller.training.updateLessonProgress({
        enrollmentId: testEnrollmentId,
        lessonId: 1, // Assuming lesson ID 1 exists
        progress: 5000, // 50%
        status: "in_progress",
        timeSpent: 600, // 10 minutes
      });

      expect(result.success).toBe(true);
    });

    it("updates existing lesson progress", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.training.updateLessonProgress({
        enrollmentId: testEnrollmentId,
        lessonId: 1,
        progress: 10000, // 100%
        status: "completed",
        timeSpent: 300, // Additional 5 minutes
      });

      expect(result.success).toBe(true);

      // Verify progress was updated
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const progress = await db
        .select()
        .from(lessonProgress)
        .where(eq(lessonProgress.enrollmentId, testEnrollmentId))
        .limit(1);

      if (progress.length > 0) {
        expect(progress[0].status).toBe("completed");
        expect(progress[0].progress).toBe(10000);
      }
    });
  });

  describe("submitReview", () => {
    it("creates a new review", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.training.submitReview({
        programId: testProgramId,
        rating: 5,
        review: "Excellent course! Learned a lot.",
      });

      expect(result.success).toBe(true);
    });

    it("updates existing review", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.training.submitReview({
        programId: testProgramId,
        rating: 4,
        review: "Good course, but could be better.",
      });

      expect(result.success).toBe(true);
    });

    it("validates rating range", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.training.submitReview({
          programId: testProgramId,
          rating: 6, // Invalid: max is 5
          review: "Test",
        })
      ).rejects.toThrow();
    });
  });

  describe("getProgramReviews", () => {
    it("returns reviews for a program", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const reviews = await caller.training.getProgramReviews({
        programId: testProgramId,
        limit: 10,
        offset: 0,
      });

      expect(reviews).toBeDefined();
      expect(Array.isArray(reviews)).toBe(true);
    });

    it("respects limit parameter", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const reviews = await caller.training.getProgramReviews({
        programId: testProgramId,
        limit: 5,
        offset: 0,
      });

      expect(reviews.length).toBeLessThanOrEqual(5);
    });
  });
});
