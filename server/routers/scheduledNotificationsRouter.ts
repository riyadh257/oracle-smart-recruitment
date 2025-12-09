import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import {
  scheduleNotification,
  getScheduledNotificationById,
  getScheduledNotifications,
  getDueNotifications,
  cancelScheduledNotification,
  rescheduleNotification,
  getScheduledNotificationStats,
} from "../scheduledNotifications";

export const scheduledNotificationsRouter = router({
  // Schedule a new notification
  schedule: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        templateId: z.number().optional(),
        type: z.enum([
          'interview_reminder',
          'feedback_request',
          'candidate_response',
          'engagement_alert',
          'ab_test_result',
          'system_update',
          'general',
        ]),
        title: z.string().min(1).max(255),
        message: z.string().min(1),
        actionUrl: z.string().optional(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
        deliveryMethod: z.enum(['push', 'email', 'sms', 'push_email', 'push_sms', 'email_sms', 'all']),
        scheduledFor: z.string().or(z.date()),
        optimalSendTime: z.boolean().optional(),
        userSegment: z.string().optional(),
        campaignId: z.number().optional(),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await scheduleNotification(input);
    }),

  // Get scheduled notification by ID
  getById: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await getScheduledNotificationById(input.id);
    }),

  // List scheduled notifications with filters
  list: protectedProcedure
    .input(
      z.object({
        userId: z.number().optional(),
        status: z.enum(['queued', 'processing', 'sent', 'failed', 'cancelled']).optional(),
        type: z.enum([
          'interview_reminder',
          'feedback_request',
          'candidate_response',
          'engagement_alert',
          'ab_test_result',
          'system_update',
          'general',
        ]).optional(),
        userSegment: z.string().optional(),
        campaignId: z.number().optional(),
        fromDate: z.string().or(z.date()).optional(),
        toDate: z.string().or(z.date()).optional(),
        limit: z.number().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const filters: any = {};
      
      if (input?.userId) filters.userId = input.userId;
      if (input?.status) filters.status = input.status;
      if (input?.type) filters.type = input.type;
      if (input?.userSegment) filters.userSegment = input.userSegment;
      if (input?.campaignId) filters.campaignId = input.campaignId;
      if (input?.fromDate) {
        filters.fromDate = typeof input.fromDate === 'string' 
          ? new Date(input.fromDate) 
          : input.fromDate;
      }
      if (input?.toDate) {
        filters.toDate = typeof input.toDate === 'string' 
          ? new Date(input.toDate) 
          : input.toDate;
      }
      if (input?.limit) filters.limit = input.limit;

      return await getScheduledNotifications(filters);
    }),

  // Get due notifications (for processing)
  getDue: protectedProcedure.query(async () => {
    return await getDueNotifications();
  }),

  // Cancel a scheduled notification
  cancel: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      await cancelScheduledNotification(input.id);
      return { success: true };
    }),

  // Reschedule a notification
  reschedule: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        newScheduledTime: z.string().or(z.date()),
      })
    )
    .mutation(async ({ input }) => {
      return await rescheduleNotification(input.id, input.newScheduledTime);
    }),

  // Get statistics for scheduled notifications
  getStats: protectedProcedure
    .input(
      z.object({
        userId: z.number().optional(),
        campaignId: z.number().optional(),
        fromDate: z.string().or(z.date()).optional(),
        toDate: z.string().or(z.date()).optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const filters: any = {};
      
      if (input?.userId) filters.userId = input.userId;
      if (input?.campaignId) filters.campaignId = input.campaignId;
      if (input?.fromDate) {
        filters.fromDate = typeof input.fromDate === 'string' 
          ? new Date(input.fromDate) 
          : input.fromDate;
      }
      if (input?.toDate) {
        filters.toDate = typeof input.toDate === 'string' 
          ? new Date(input.toDate) 
          : input.toDate;
      }

      return await getScheduledNotificationStats(filters);
    }),

  // Bulk schedule notifications
  bulkSchedule: protectedProcedure
    .input(
      z.object({
        notifications: z.array(
          z.object({
            userId: z.number(),
            templateId: z.number().optional(),
            type: z.enum([
              'interview_reminder',
              'feedback_request',
              'candidate_response',
              'engagement_alert',
              'ab_test_result',
              'system_update',
              'general',
            ]),
            title: z.string().min(1).max(255),
            message: z.string().min(1),
            actionUrl: z.string().optional(),
            priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
            deliveryMethod: z.enum(['push', 'email', 'sms', 'push_email', 'push_sms', 'email_sms', 'all']),
            scheduledFor: z.string().or(z.date()),
            optimalSendTime: z.boolean().optional(),
            userSegment: z.string().optional(),
            campaignId: z.number().optional(),
            metadata: z.any().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const results = [];
      for (const notification of input.notifications) {
        try {
          const scheduled = await scheduleNotification(notification);
          results.push({ success: true, notification: scheduled });
        } catch (error) {
          results.push({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error',
            notification: null,
          });
        }
      }
      return results;
    }),
});
