import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import * as dbAnalytics from "../dbNotificationAnalytics";

export const notificationAnalyticsDashboardRouter = router({
  // ============================================================================
  // Engagement Tracking
  // ============================================================================

  trackEngagement: protectedProcedure
    .input(
      z.object({
        notificationId: z.number(),
        deliveredAt: z.string().optional(),
        deliveryDuration: z.number().optional(),
        viewedAt: z.string().optional(),
        clickedAt: z.string().optional(),
        actionTakenAt: z.string().optional(),
        actionType: z.string().optional(),
        dismissedAt: z.string().optional(),
        deviceType: z.string().optional(),
        browserType: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await dbAnalytics.trackNotificationEngagement({
        userId: ctx.user.id,
        ...input,
      });
    }),

  updateEngagement: protectedProcedure
    .input(
      z.object({
        notificationId: z.number(),
        viewedAt: z.string().optional(),
        clickedAt: z.string().optional(),
        actionTakenAt: z.string().optional(),
        actionType: z.string().optional(),
        dismissedAt: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { notificationId, ...updates } = input;
      return await dbAnalytics.updateNotificationEngagement(notificationId, ctx.user.id, updates);
    }),

  getEngagement: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .query(async ({ input }) => {
      return await dbAnalytics.getNotificationEngagement(input.notificationId);
    }),

  // ============================================================================
  // Performance Analytics
  // ============================================================================

  calculatePerformance: protectedProcedure
    .input(
      z.object({
        notificationType: z.string(),
        channel: z.enum(["push", "email", "sms"]),
        periodStart: z.string(),
        periodEnd: z.string(),
      })
    )
    .query(async ({ input }) => {
      return await dbAnalytics.calculatePerformanceSummary(
        input.notificationType,
        input.channel,
        input.periodStart,
        input.periodEnd
      );
    }),

  getPerformanceSummaries: protectedProcedure
    .input(
      z
        .object({
          notificationType: z.string().optional(),
          channel: z.enum(["push", "email", "sms"]).optional(),
          periodStart: z.string().optional(),
          periodEnd: z.string().optional(),
          limit: z.number().default(50),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return await dbAnalytics.getPerformanceSummaries(input || {});
    }),

  // ============================================================================
  // Dashboard Analytics
  // ============================================================================

  getTypePerformance: protectedProcedure
    .input(
      z
        .object({
          days: z.number().default(30),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return await dbAnalytics.getNotificationTypePerformance(ctx.user.id, input?.days);
    }),

  getChannelComparison: protectedProcedure
    .input(
      z
        .object({
          days: z.number().default(30),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return await dbAnalytics.getChannelComparison(ctx.user.id, input?.days);
    }),

  // ============================================================================
  // Batch Performance Calculation (for scheduled jobs)
  // ============================================================================

  batchCalculatePerformance: protectedProcedure
    .input(
      z.object({
        types: z.array(z.string()),
        channels: z.array(z.enum(["push", "email", "sms"])),
        periodStart: z.string(),
        periodEnd: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const results = [];

      for (const type of input.types) {
        for (const channel of input.channels) {
          const summary = await dbAnalytics.calculatePerformanceSummary(
            type,
            channel,
            input.periodStart,
            input.periodEnd
          );
          await dbAnalytics.savePerformanceSummary(summary);
          results.push(summary);
        }
      }

      return results;
    }),
});
