import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import {
  getMatchNotificationPreferences,
  getAllMatchNotificationPreferences,
  upsertMatchNotificationPreferences,
  deleteMatchNotificationPreferences,
  getMatchTimeline,
  getCandidateTimeline,
  getJobTimeline,
  createMatchTimelineEvent,
  getTimelineEventsByDateRange,
  createBulkComparisonAction,
  updateBulkComparisonAction,
  getBulkComparisonAction,
  getUserBulkComparisonActions,
  getJobBulkComparisonActions,
  executeBulkScheduleInterviews,
  executeBulkSendMessages,
  executeBulkChangeStatus,
} from "../dbPhase27";

// ============================================================================
// MATCH NOTIFICATION PREFERENCES ROUTER
// ============================================================================

export const matchNotificationPreferencesRouter = router({
  // Get preferences for a specific job or global default
  get: protectedProcedure
    .input(
      z.object({
        jobId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await getMatchNotificationPreferences(ctx.user.id, input.jobId);
    }),

  // Get all preferences for current user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await getAllMatchNotificationPreferences(ctx.user.id);
  }),

  // Create or update notification preferences
  upsert: protectedProcedure
    .input(
      z.object({
        jobId: z.number().optional(),
        minMatchScore: z.number().min(0).max(100).default(70),
        highScoreThreshold: z.number().min(0).max(100).default(85),
        exceptionalScoreThreshold: z.number().min(0).max(100).default(90),
        notifyViaEmail: z.boolean().default(true),
        notifyViaPush: z.boolean().default(true),
        notifyViaSms: z.boolean().default(false),
        instantNotifications: z.boolean().default(true),
        digestMode: z.boolean().default(false),
        digestFrequency: z.enum(['hourly', 'daily', 'weekly']).default('daily'),
        notifyOnlyNewCandidates: z.boolean().default(false),
        notifyOnScoreImprovement: z.boolean().default(true),
        minScoreImprovement: z.number().min(0).max(100).default(5),
        quietHoursEnabled: z.boolean().default(false),
        quietHoursStart: z.string().default('22:00'),
        quietHoursEnd: z.string().default('08:00'),
        timezone: z.string().default('Asia/Riyadh'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await upsertMatchNotificationPreferences({
        userId: ctx.user.id,
        jobId: input.jobId || null,
        minMatchScore: input.minMatchScore,
        highScoreThreshold: input.highScoreThreshold,
        exceptionalScoreThreshold: input.exceptionalScoreThreshold,
        notifyViaEmail: input.notifyViaEmail ? 1 : 0,
        notifyViaPush: input.notifyViaPush ? 1 : 0,
        notifyViaSms: input.notifyViaSms ? 1 : 0,
        instantNotifications: input.instantNotifications ? 1 : 0,
        digestMode: input.digestMode ? 1 : 0,
        digestFrequency: input.digestFrequency,
        notifyOnlyNewCandidates: input.notifyOnlyNewCandidates ? 1 : 0,
        notifyOnScoreImprovement: input.notifyOnScoreImprovement ? 1 : 0,
        minScoreImprovement: input.minScoreImprovement,
        quietHoursEnabled: input.quietHoursEnabled ? 1 : 0,
        quietHoursStart: input.quietHoursStart,
        quietHoursEnd: input.quietHoursEnd,
        timezone: input.timezone,
      });
    }),

  // Delete notification preferences
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await deleteMatchNotificationPreferences(input.id);
    }),
});

// ============================================================================
// MATCH TIMELINE ROUTER
// ============================================================================

export const matchTimelineRouter = router({
  // Get timeline for a specific match (candidate + job)
  getMatch: protectedProcedure
    .input(
      z.object({
        candidateId: z.number(),
        jobId: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await getMatchTimeline(input.candidateId, input.jobId);
    }),

  // Get all timeline events for a candidate across all jobs
  getCandidate: protectedProcedure
    .input(z.object({ candidateId: z.number() }))
    .query(async ({ input }) => {
      return await getCandidateTimeline(input.candidateId);
    }),

  // Get all timeline events for a job across all candidates
  getJob: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ input }) => {
      return await getJobTimeline(input.jobId);
    }),

  // Get timeline events within a date range
  getByDateRange: protectedProcedure
    .input(
      z.object({
        candidateId: z.number(),
        jobId: z.number(),
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      return await getTimelineEventsByDateRange(
        input.candidateId,
        input.jobId,
        input.startDate,
        input.endDate
      );
    }),

  // Create a new timeline event
  create: protectedProcedure
    .input(
      z.object({
        candidateId: z.number(),
        jobId: z.number(),
        eventType: z.enum([
          'match_created',
          'match_viewed',
          'match_compared',
          'match_favorited',
          'match_unfavorited',
          'interview_scheduled',
          'message_sent',
          'status_changed',
          'feedback_submitted',
          'match_dismissed',
          'match_archived',
        ]),
        eventDescription: z.string().optional(),
        metadata: z.any().optional(),
        matchScore: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await createMatchTimelineEvent({
        candidateId: input.candidateId,
        jobId: input.jobId,
        userId: ctx.user.id,
        eventType: input.eventType,
        eventDescription: input.eventDescription || null,
        metadata: input.metadata || null,
        matchScore: input.matchScore || null,
        createdAt: new Date().toISOString(),
      });
    }),
});

// ============================================================================
// BULK COMPARISON ACTIONS ROUTER
// ============================================================================

export const bulkComparisonActionsRouter = router({
  // Get a specific bulk action by ID
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await getBulkComparisonAction(input.id);
    }),

  // Get all bulk actions for current user
  getUserActions: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      return await getUserBulkComparisonActions(ctx.user.id, input.limit);
    }),

  // Get all bulk actions for a specific job
  getJobActions: protectedProcedure
    .input(
      z.object({
        jobId: z.number(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      return await getJobBulkComparisonActions(input.jobId, input.limit);
    }),

  // Execute bulk schedule interviews
  scheduleInterviews: protectedProcedure
    .input(
      z.object({
        candidateIds: z.array(z.number()).min(1),
        jobId: z.number(),
        scheduledDateTime: z.string(),
        templateId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create bulk action record
      const bulkAction = await createBulkComparisonAction({
        userId: ctx.user.id,
        jobId: input.jobId,
        actionType: 'bulk_schedule_interviews',
        candidateIds: input.candidateIds,
        totalCandidates: input.candidateIds.length,
        successfulActions: 0,
        failedActions: 0,
        interviewTemplateId: input.templateId || null,
        scheduledDateTime: input.scheduledDateTime,
        messageContent: null,
        newStatus: null,
        status: 'processing',
        progress: 0,
        errorMessages: null,
        resultsSummary: null,
        startedAt: new Date().toISOString(),
        completedAt: null,
      });

      try {
        // Execute the bulk operation
        const results = await executeBulkScheduleInterviews(
          input.candidateIds,
          input.jobId,
          input.scheduledDateTime,
          input.templateId
        );

        // Update bulk action with results
        await updateBulkComparisonAction(bulkAction.id, {
          successfulActions: results.successful,
          failedActions: results.failed,
          status: results.failed > 0 ? 'partially_completed' : 'completed',
          progress: 100,
          errorMessages: results.errors.length > 0 ? results.errors : null,
          resultsSummary: {
            total: input.candidateIds.length,
            successful: results.successful,
            failed: results.failed,
          },
          completedAt: new Date().toISOString(),
        });

        return {
          success: true,
          bulkActionId: bulkAction.id,
          results,
        };
      } catch (error) {
        // Update bulk action with error
        await updateBulkComparisonAction(bulkAction.id, {
          status: 'failed',
          errorMessages: [
            {
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          ],
          completedAt: new Date().toISOString(),
        });

        throw error;
      }
    }),

  // Execute bulk send messages
  sendMessages: protectedProcedure
    .input(
      z.object({
        candidateIds: z.array(z.number()).min(1),
        jobId: z.number(),
        messageContent: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create bulk action record
      const bulkAction = await createBulkComparisonAction({
        userId: ctx.user.id,
        jobId: input.jobId,
        actionType: 'bulk_send_messages',
        candidateIds: input.candidateIds,
        totalCandidates: input.candidateIds.length,
        successfulActions: 0,
        failedActions: 0,
        interviewTemplateId: null,
        scheduledDateTime: null,
        messageContent: input.messageContent,
        newStatus: null,
        status: 'processing',
        progress: 0,
        errorMessages: null,
        resultsSummary: null,
        startedAt: new Date().toISOString(),
        completedAt: null,
      });

      try {
        // Execute the bulk operation
        const results = await executeBulkSendMessages(
          input.candidateIds,
          input.jobId,
          input.messageContent
        );

        // Update bulk action with results
        await updateBulkComparisonAction(bulkAction.id, {
          successfulActions: results.successful,
          failedActions: results.failed,
          status: results.failed > 0 ? 'partially_completed' : 'completed',
          progress: 100,
          errorMessages: results.errors.length > 0 ? results.errors : null,
          resultsSummary: {
            total: input.candidateIds.length,
            successful: results.successful,
            failed: results.failed,
          },
          completedAt: new Date().toISOString(),
        });

        return {
          success: true,
          bulkActionId: bulkAction.id,
          results,
        };
      } catch (error) {
        // Update bulk action with error
        await updateBulkComparisonAction(bulkAction.id, {
          status: 'failed',
          errorMessages: [
            {
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          ],
          completedAt: new Date().toISOString(),
        });

        throw error;
      }
    }),

  // Execute bulk change status
  changeStatus: protectedProcedure
    .input(
      z.object({
        candidateIds: z.array(z.number()).min(1),
        jobId: z.number(),
        newStatus: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create bulk action record
      const bulkAction = await createBulkComparisonAction({
        userId: ctx.user.id,
        jobId: input.jobId,
        actionType: 'bulk_change_status',
        candidateIds: input.candidateIds,
        totalCandidates: input.candidateIds.length,
        successfulActions: 0,
        failedActions: 0,
        interviewTemplateId: null,
        scheduledDateTime: null,
        messageContent: null,
        newStatus: input.newStatus,
        status: 'processing',
        progress: 0,
        errorMessages: null,
        resultsSummary: null,
        startedAt: new Date().toISOString(),
        completedAt: null,
      });

      try {
        // Execute the bulk operation
        const results = await executeBulkChangeStatus(
          input.candidateIds,
          input.jobId,
          input.newStatus
        );

        // Update bulk action with results
        await updateBulkComparisonAction(bulkAction.id, {
          successfulActions: results.successful,
          failedActions: results.failed,
          status: results.failed > 0 ? 'partially_completed' : 'completed',
          progress: 100,
          errorMessages: results.errors.length > 0 ? results.errors : null,
          resultsSummary: {
            total: input.candidateIds.length,
            successful: results.successful,
            failed: results.failed,
          },
          completedAt: new Date().toISOString(),
        });

        return {
          success: true,
          bulkActionId: bulkAction.id,
          results,
        };
      } catch (error) {
        // Update bulk action with error
        await updateBulkComparisonAction(bulkAction.id, {
          status: 'failed',
          errorMessages: [
            {
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          ],
          completedAt: new Date().toISOString(),
        });

        throw error;
      }
    }),
});

// ============================================================================
// MAIN PHASE 27 ROUTER
// ============================================================================

export const phase27Router = router({
  notificationPreferences: matchNotificationPreferencesRouter,
  timeline: matchTimelineRouter,
  bulkActions: bulkComparisonActionsRouter,
});
