import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import {
  createMatchNotification,
  acknowledgeMatchNotification,
  getUnacknowledgedNotifications,
  getNotificationStats,
} from "./matchNotificationService";
import {
  createBulkMatchJob,
  getBulkMatchJobStatus,
  getBulkMatchResults,
  cancelBulkMatchJob,
} from "./bulkMatchingService";
import {
  submitMatchFeedback,
  getMatchFeedback,
  getPendingFeedbackRequests,
  getLatestFeedbackAnalytics,
  getFeedbackAnalyticsHistory,
  updateFeedbackAnalytics,
} from "./matchFeedbackService";

/**
 * Matching Router
 * Handles real-time match notifications, bulk matching operations, and feedback loop
 */

export const matchingRouter = router({
  // ============================================================================
  // REAL-TIME MATCH NOTIFICATIONS
  // ============================================================================
  
  notifications: router({
    /**
     * Get unacknowledged match notifications
     */
    getUnacknowledged: protectedProcedure
      .query(async ({ ctx }) => {
        return await getUnacknowledgedNotifications(ctx.user.id);
      }),

    /**
     * Acknowledge a match notification
     */
    acknowledge: protectedProcedure
      .input(z.object({
        notificationEventId: z.number(),
        action: z.enum(['viewed', 'contacted', 'scheduled', 'dismissed']),
      }))
      .mutation(async ({ input }) => {
        await acknowledgeMatchNotification(input.notificationEventId, input.action);
        return { success: true };
      }),

    /**
     * Get notification statistics
     */
    getStats: protectedProcedure
      .query(async ({ ctx }) => {
        return await getNotificationStats(ctx.user.id);
      }),

    /**
     * Manually trigger a match notification (for testing or manual matches)
     */
    triggerNotification: protectedProcedure
      .input(z.object({
        candidateId: z.number(),
        candidateName: z.string(),
        jobId: z.number(),
        jobTitle: z.string(),
        matchScore: z.number().min(0).max(100),
        skillMatchScore: z.number().min(0).max(100).optional(),
        cultureFitScore: z.number().min(0).max(100).optional(),
        wellbeingMatchScore: z.number().min(0).max(100).optional(),
        matchType: z.enum(['candidate_to_job', 'job_to_candidate', 'mutual']),
        matchId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await createMatchNotification({
          ...input,
          recruiterId: ctx.user.id,
        });
        return { success: true };
      }),
  }),

  // ============================================================================
  // BULK MATCHING OPERATIONS
  // ============================================================================
  
  bulkMatching: router({
    /**
     * Create a new bulk matching job
     */
    createJob: protectedProcedure
      .input(z.object({
        jobName: z.string(),
        matchType: z.enum(['candidates_to_job', 'jobs_to_candidate', 'all_to_all']),
        sourceType: z.enum(['file_upload', 'database_selection', 'api']),
        sourceData: z.object({
          candidateIds: z.array(z.number()).optional(),
          jobIds: z.array(z.number()).optional(),
          filters: z.any().optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        const jobId = await createBulkMatchJob({
          userId: ctx.user.id,
          ...input,
        });
        return { jobId, success: true };
      }),

    /**
     * Get bulk matching job status
     */
    getJobStatus: protectedProcedure
      .input(z.object({
        jobId: z.number(),
      }))
      .query(async ({ input }) => {
        return await getBulkMatchJobStatus(input.jobId);
      }),

    /**
     * Get bulk matching results
     */
    getResults: protectedProcedure
      .input(z.object({
        jobId: z.number(),
        limit: z.number().default(100),
      }))
      .query(async ({ input }) => {
        return await getBulkMatchResults(input.jobId, input.limit);
      }),

    /**
     * Cancel a bulk matching job
     */
    cancelJob: protectedProcedure
      .input(z.object({
        jobId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await cancelBulkMatchJob(input.jobId);
        return { success: true };
      }),

    /**
     * Get user's bulk matching jobs
     */
    getUserJobs: protectedProcedure
      .input(z.object({
        limit: z.number().default(20),
      }))
      .query(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const { bulkMatchJobs } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        const jobs = await db.select()
          .from(bulkMatchJobs)
          .where(eq(bulkMatchJobs.userId, ctx.user.id))
          .orderBy(desc(bulkMatchJobs.createdAt))
          .limit(input.limit);

        return jobs;
      }),
  }),

  // ============================================================================
  // MATCH OUTCOME FEEDBACK LOOP
  // ============================================================================
  
  feedback: router({
    /**
     * Submit match feedback
     */
    submit: protectedProcedure
      .input(z.object({
        candidateId: z.number(),
        jobId: z.number(),
        applicationId: z.number().optional(),
        matchId: z.number().optional(),
        
        // Original scores
        originalMatchScore: z.number().optional(),
        originalSkillScore: z.number().optional(),
        originalCultureScore: z.number().optional(),
        originalWellbeingScore: z.number().optional(),
        
        // Outcome
        wasHired: z.boolean(),
        hiredDate: z.string().optional(),
        matchSuccessful: z.boolean().optional(),
        
        // Ratings (1-5)
        skillMatchAccuracy: z.number().min(1).max(5).optional(),
        cultureFitAccuracy: z.number().min(1).max(5).optional(),
        wellbeingMatchAccuracy: z.number().min(1).max(5).optional(),
        overallSatisfaction: z.number().min(1).max(5).optional(),
        
        // Qualitative
        whatWorkedWell: z.string().optional(),
        whatDidntWork: z.string().optional(),
        unexpectedFactors: z.string().optional(),
        improvementSuggestions: z.string().optional(),
        
        // Performance
        employeePerformanceRating: z.number().min(1).max(5).optional(),
        retentionMonths: z.number().optional(),
        stillEmployed: z.boolean().optional(),
        
        // Metadata
        feedbackStage: z.enum(['30_days', '90_days', '6_months', '1_year', 'exit']),
        feedbackSource: z.enum(['recruiter', 'hiring_manager', 'hr', 'automated']).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const feedbackId = await submitMatchFeedback({
          ...input,
          recruiterId: ctx.user.id,
          hiredDate: input.hiredDate ? new Date(input.hiredDate) : undefined,
        });
        return { feedbackId, success: true };
      }),

    /**
     * Get feedback for a specific match
     */
    getForMatch: protectedProcedure
      .input(z.object({
        candidateId: z.number(),
        jobId: z.number(),
      }))
      .query(async ({ input }) => {
        return await getMatchFeedback(input.candidateId, input.jobId);
      }),

    /**
     * Get pending feedback requests
     */
    getPending: protectedProcedure
      .query(async ({ ctx }) => {
        return await getPendingFeedbackRequests(ctx.user.id);
      }),

    /**
     * Get latest feedback analytics
     */
    getLatestAnalytics: protectedProcedure
      .query(async () => {
        return await getLatestFeedbackAnalytics();
      }),

    /**
     * Get feedback analytics history
     */
    getAnalyticsHistory: protectedProcedure
      .input(z.object({
        limit: z.number().default(30),
      }))
      .query(async ({ input }) => {
        return await getFeedbackAnalyticsHistory(input.limit);
      }),

    /**
     * Manually trigger analytics update
     */
    updateAnalytics: protectedProcedure
      .mutation(async () => {
        await updateFeedbackAnalytics();
        return { success: true };
      }),
  }),
});
