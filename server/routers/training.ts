import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { 
  trainingPrograms, 
  courseModules, 
  courseLessons,
  programEnrollments,
  lessonProgress,
  quizAttempts,
  programReviews,
  candidateSkills,
  skillsTaxonomy
} from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const trainingRouter = router({
  // ============================================================================
  // TRAINING PROGRAMS CATALOG
  // ============================================================================
  
  // Get all published training programs with filters
  listPrograms: publicProcedure
    .input(z.object({
      category: z.enum(['technical','soft_skills','industry_specific','certification','language','leadership']).optional(),
      level: z.enum(['beginner','intermediate','advanced','expert']).optional(),
      isFree: z.boolean().optional(),
      searchQuery: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      let query = db.select().from(trainingPrograms).where(eq(trainingPrograms.isPublished, 1));

      // Apply filters
      const conditions = [eq(trainingPrograms.isPublished, 1)];
      
      if (input.category) {
        conditions.push(eq(trainingPrograms.category, input.category));
      }
      
      if (input.level) {
        conditions.push(eq(trainingPrograms.level, input.level));
      }
      
      if (input.isFree !== undefined) {
        conditions.push(eq(trainingPrograms.isFree, input.isFree ? 1 : 0));
      }

      const programs = await db
        .select()
        .from(trainingPrograms)
        .where(and(...conditions))
        .orderBy(desc(trainingPrograms.isFeatured), desc(trainingPrograms.averageRating))
        .limit(input.limit)
        .offset(input.offset);

      return programs;
    }),

  // Get single program details with modules and lessons
  getProgramDetails: publicProcedure
    .input(z.object({ programId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const program = await db
        .select()
        .from(trainingPrograms)
        .where(eq(trainingPrograms.id, input.programId))
        .limit(1);

      if (!program.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Program not found" });
      }

      // Get modules with lessons
      const modules = await db
        .select()
        .from(courseModules)
        .where(eq(courseModules.programId, input.programId))
        .orderBy(courseModules.orderIndex);

      const modulesWithLessons = await Promise.all(
        modules.map(async (module) => {
          const lessons = await db
            .select()
            .from(courseLessons)
            .where(eq(courseLessons.moduleId, module.id))
            .orderBy(courseLessons.orderIndex);

          return {
            ...module,
            lessons,
          };
        })
      );

      return {
        ...program[0],
        modules: modulesWithLessons,
      };
    }),

  // Get featured programs
  getFeaturedPrograms: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(6) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const programs = await db
        .select()
        .from(trainingPrograms)
        .where(and(
          eq(trainingPrograms.isPublished, 1),
          eq(trainingPrograms.isFeatured, 1)
        ))
        .orderBy(desc(trainingPrograms.averageRating))
        .limit(input.limit);

      return programs;
    }),

  // ============================================================================
  // ENROLLMENT MANAGEMENT
  // ============================================================================

  // Enroll in a program
  enrollInProgram: protectedProcedure
    .input(z.object({ programId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Check if already enrolled
      const existing = await db
        .select()
        .from(programEnrollments)
        .where(and(
          eq(programEnrollments.userId, ctx.user.id),
          eq(programEnrollments.programId, input.programId)
        ))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Already enrolled in this program" });
      }

      // Create enrollment
      const [enrollment] = await db.insert(programEnrollments).values({
        userId: ctx.user.id,
        programId: input.programId,
        status: 'enrolled',
        progress: 0,
        enrolledAt: new Date().toISOString(),
      });

      // Update enrollment count
      await db
        .update(trainingPrograms)
        .set({ enrollmentCount: sql`${trainingPrograms.enrollmentCount} + 1` })
        .where(eq(trainingPrograms.id, input.programId));

      return { success: true, enrollmentId: enrollment.insertId };
    }),

  // Get user's enrollments
  getMyEnrollments: protectedProcedure
    .input(z.object({
      status: z.enum(['enrolled','in_progress','completed','dropped','expired']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [eq(programEnrollments.userId, ctx.user.id)];
      
      if (input.status) {
        conditions.push(eq(programEnrollments.status, input.status));
      }

      const enrollments = await db
        .select({
          enrollment: programEnrollments,
          program: trainingPrograms,
        })
        .from(programEnrollments)
        .leftJoin(trainingPrograms, eq(programEnrollments.programId, trainingPrograms.id))
        .where(and(...conditions))
        .orderBy(desc(programEnrollments.enrolledAt));

      return enrollments;
    }),

  // Get enrollment details with progress
  getEnrollmentDetails: protectedProcedure
    .input(z.object({ enrollmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const enrollment = await db
        .select()
        .from(programEnrollments)
        .where(and(
          eq(programEnrollments.id, input.enrollmentId),
          eq(programEnrollments.userId, ctx.user.id)
        ))
        .limit(1);

      if (!enrollment.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Enrollment not found" });
      }

      // Get program details
      const program = await db
        .select()
        .from(trainingPrograms)
        .where(eq(trainingPrograms.id, enrollment[0].programId!))
        .limit(1);

      // Get modules with lessons and progress
      const modules = await db
        .select()
        .from(courseModules)
        .where(eq(courseModules.programId, enrollment[0].programId!))
        .orderBy(courseModules.orderIndex);

      const modulesWithProgress = await Promise.all(
        modules.map(async (module) => {
          const lessons = await db
            .select()
            .from(courseLessons)
            .where(eq(courseLessons.moduleId, module.id))
            .orderBy(courseLessons.orderIndex);

          const lessonsWithProgress = await Promise.all(
            lessons.map(async (lesson) => {
              const progress = await db
                .select()
                .from(lessonProgress)
                .where(and(
                  eq(lessonProgress.enrollmentId, input.enrollmentId),
                  eq(lessonProgress.lessonId, lesson.id)
                ))
                .limit(1);

              return {
                ...lesson,
                progress: progress[0] || null,
              };
            })
          );

          return {
            ...module,
            lessons: lessonsWithProgress,
          };
        })
      );

      return {
        enrollment: enrollment[0],
        program: program[0],
        modules: modulesWithProgress,
      };
    }),

  // Update lesson progress
  updateLessonProgress: protectedProcedure
    .input(z.object({
      enrollmentId: z.number(),
      lessonId: z.number(),
      progress: z.number().min(0).max(10000), // Percentage * 100
      status: z.enum(['not_started','in_progress','completed']),
      timeSpent: z.number().min(0).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verify enrollment belongs to user
      const enrollment = await db
        .select()
        .from(programEnrollments)
        .where(and(
          eq(programEnrollments.id, input.enrollmentId),
          eq(programEnrollments.userId, ctx.user.id)
        ))
        .limit(1);

      if (!enrollment.length) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      // Upsert lesson progress
      const existing = await db
        .select()
        .from(lessonProgress)
        .where(and(
          eq(lessonProgress.enrollmentId, input.enrollmentId),
          eq(lessonProgress.lessonId, input.lessonId)
        ))
        .limit(1);

      const now = new Date().toISOString();

      if (existing.length > 0) {
        await db
          .update(lessonProgress)
          .set({
            status: input.status,
            progress: input.progress,
            timeSpent: input.timeSpent ? sql`${lessonProgress.timeSpent} + ${input.timeSpent}` : lessonProgress.timeSpent,
            lastAccessedAt: now,
            completedAt: input.status === 'completed' ? now : existing[0].completedAt,
            notes: input.notes || existing[0].notes,
          })
          .where(eq(lessonProgress.id, existing[0].id));
      } else {
        await db.insert(lessonProgress).values({
          enrollmentId: input.enrollmentId,
          lessonId: input.lessonId,
          status: input.status,
          progress: input.progress,
          timeSpent: input.timeSpent || 0,
          lastAccessedAt: now,
          completedAt: input.status === 'completed' ? now : null,
          notes: input.notes,
        });
      }

      // Update enrollment status and overall progress
      await db
        .update(programEnrollments)
        .set({
          status: 'in_progress',
          lastAccessedAt: now,
          timeSpent: input.timeSpent ? sql`${programEnrollments.timeSpent} + ${input.timeSpent}` : programEnrollments.timeSpent,
          currentLessonId: input.lessonId,
        })
        .where(eq(programEnrollments.id, input.enrollmentId));

      return { success: true };
    }),

  // Submit quiz attempt
  submitQuizAttempt: protectedProcedure
    .input(z.object({
      enrollmentId: z.number(),
      lessonId: z.number(),
      answers: z.any(), // JSON object
      score: z.number(),
      maxScore: z.number(),
      timeSpent: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Get attempt number
      const attempts = await db
        .select()
        .from(quizAttempts)
        .where(and(
          eq(quizAttempts.enrollmentId, input.enrollmentId),
          eq(quizAttempts.lessonId, input.lessonId)
        ));

      const attemptNumber = attempts.length + 1;
      const passed = input.score >= (input.maxScore * 0.7); // 70% passing score

      await db.insert(quizAttempts).values({
        enrollmentId: input.enrollmentId,
        lessonId: input.lessonId,
        attemptNumber,
        score: input.score,
        maxScore: input.maxScore,
        passed: passed ? 1 : 0,
        answers: JSON.stringify(input.answers),
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        timeSpent: input.timeSpent,
      });

      // If passed, mark lesson as completed
      if (passed) {
        await db
          .update(lessonProgress)
          .set({
            status: 'completed',
            progress: 10000,
            completedAt: new Date().toISOString(),
          })
          .where(and(
            eq(lessonProgress.enrollmentId, input.enrollmentId),
            eq(lessonProgress.lessonId, input.lessonId)
          ));
      }

      return { success: true, passed, attemptNumber };
    }),

  // Complete program and generate certificate
  completeProgram: protectedProcedure
    .input(z.object({ enrollmentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const enrollment = await db
        .select()
        .from(programEnrollments)
        .where(and(
          eq(programEnrollments.id, input.enrollmentId),
          eq(programEnrollments.userId, ctx.user.id)
        ))
        .limit(1);

      if (!enrollment.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Enrollment not found" });
      }

      // Mark as completed
      await db
        .update(programEnrollments)
        .set({
          status: 'completed',
          progress: 10000,
          completedAt: new Date().toISOString(),
        })
        .where(eq(programEnrollments.id, input.enrollmentId));

      // Get program to add skills to candidate profile
      const program = await db
        .select()
        .from(trainingPrograms)
        .where(eq(trainingPrograms.id, enrollment[0].programId!))
        .limit(1);

      // TODO: Add skills gained from program to candidate profile
      // This will be implemented in the skills router

      return { success: true, certificateUrl: enrollment[0].certificateUrl };
    }),

  // ============================================================================
  // REVIEWS & RATINGS
  // ============================================================================

  // Submit program review
  submitReview: protectedProcedure
    .input(z.object({
      programId: z.number(),
      rating: z.number().min(1).max(5),
      review: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Check if user completed the program
      const enrollment = await db
        .select()
        .from(programEnrollments)
        .where(and(
          eq(programEnrollments.userId, ctx.user.id),
          eq(programEnrollments.programId, input.programId),
          eq(programEnrollments.status, 'completed')
        ))
        .limit(1);

      const isVerified = enrollment.length > 0 ? 1 : 0;

      // Upsert review
      const existing = await db
        .select()
        .from(programReviews)
        .where(and(
          eq(programReviews.userId, ctx.user.id),
          eq(programReviews.programId, input.programId)
        ))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(programReviews)
          .set({
            rating: input.rating,
            review: input.review,
            isVerifiedEnrollment: isVerified,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(programReviews.id, existing[0].id));
      } else {
        await db.insert(programReviews).values({
          programId: input.programId,
          userId: ctx.user.id,
          rating: input.rating,
          review: input.review,
          isVerifiedEnrollment: isVerified,
        });
      }

      // Update program average rating
      const reviews = await db
        .select()
        .from(programReviews)
        .where(eq(programReviews.programId, input.programId));

      const avgRating = Math.round(
        (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 100
      );

      await db
        .update(trainingPrograms)
        .set({
          averageRating: avgRating,
          reviewCount: reviews.length,
        })
        .where(eq(trainingPrograms.id, input.programId));

      return { success: true };
    }),

  // Get program reviews
  getProgramReviews: publicProcedure
    .input(z.object({
      programId: z.number(),
      limit: z.number().min(1).max(50).default(10),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const reviews = await db
        .select()
        .from(programReviews)
        .where(eq(programReviews.programId, input.programId))
        .orderBy(desc(programReviews.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return reviews;
    }),
});
