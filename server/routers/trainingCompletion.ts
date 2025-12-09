/**
 * Training Completion Router
 * tRPC procedures for training completion tracking and match score recalculation
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { completeTrainingProgram, getTrainingRecommendations } from "../trainingCompletionTracking";
import { getDb } from "../db";
import { programEnrollments, trainingPrograms } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const trainingCompletionRouter = router({
  /**
   * Mark a training program as completed
   * Automatically recalculates match scores
   */
  completeProgram: protectedProcedure
    .input(z.object({
      programId: z.number()
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await completeTrainingProgram(ctx.user.id, input.programId);
      return result;
    }),

  /**
   * Get training recommendations for current user
   * Optionally filtered by a specific job
   */
  getRecommendations: protectedProcedure
    .input(z.object({
      jobId: z.number().optional()
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get candidate ID from user
      const { getCandidateByUserId } = await import("../db");
      const candidate = await getCandidateByUserId(ctx.user.id);
      
      if (!candidate) {
        throw new Error("Candidate profile not found");
      }

      const recommendations = await getTrainingRecommendations(candidate.id, input.jobId);
      return recommendations;
    }),

  /**
   * Get user's training enrollments and completion status
   */
  getMyEnrollments: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const enrollments = await db.select({
        id: programEnrollments.id,
        programId: programEnrollments.programId,
        status: programEnrollments.status,
        progress: programEnrollments.progress,
        enrolledAt: programEnrollments.enrolledAt,
        completedAt: programEnrollments.completedAt,
        certificateUrl: programEnrollments.certificateUrl,
        programTitle: trainingPrograms.title,
        programDescription: trainingPrograms.description,
        programCategory: trainingPrograms.category,
        programLevel: trainingPrograms.level,
        programDuration: trainingPrograms.duration,
        skillsGained: trainingPrograms.skillsGained
      })
      .from(programEnrollments)
      .leftJoin(trainingPrograms, eq(programEnrollments.programId, trainingPrograms.id))
      .where(eq(programEnrollments.userId, ctx.user.id));

      return enrollments;
    }),

  /**
   * Enroll in a training program
   */
  enrollInProgram: protectedProcedure
    .input(z.object({
      programId: z.number()
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if already enrolled
      const [existing] = await db.select()
        .from(programEnrollments)
        .where(and(
          eq(programEnrollments.userId, ctx.user.id),
          eq(programEnrollments.programId, input.programId)
        ))
        .limit(1);

      if (existing) {
        throw new Error("Already enrolled in this program");
      }

      // Create enrollment
      const [result] = await db.insert(programEnrollments).values({
        userId: ctx.user.id,
        programId: input.programId,
        status: 'enrolled',
        progress: 0,
        enrolledAt: new Date().toISOString()
      });

      return {
        success: true,
        enrollmentId: result.insertId
      };
    })
});
