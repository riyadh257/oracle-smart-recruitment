import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { runScheduledJobs, getScheduledJobStatus } from "../scheduledJobRunner";
import { 
  notificationPreferences, 
  feedbackReminders,
  notificationHistory,
  users,
  interviewFeedback
} from "../../drizzle/schema";
import { eq, and, gte, lte, count, sql, desc } from "drizzle-orm";

export const adminRouter = router({
  // Get notification preferences for all users
  getAllNotificationPreferences: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const prefs = await db
      .select({
        id: notificationPreferences.id,
        userId: notificationPreferences.userId,
        userName: users.name,
        userEmail: users.email,
        enableEmailNotifications: notificationPreferences.enableEmailNotifications,
        enablePushNotifications: notificationPreferences.enablePushNotifications,
        enableSmsNotifications: notificationPreferences.enableSmsNotifications,
        quietHoursStart: notificationPreferences.quietHoursStart,
        quietHoursEnd: notificationPreferences.quietHoursEnd,
        timezone: notificationPreferences.timezone,
        updatedAt: notificationPreferences.updatedAt,
      })
      .from(notificationPreferences)
      .leftJoin(users, eq(notificationPreferences.userId, users.id))
      .orderBy(desc(notificationPreferences.updatedAt));

    return prefs;
  }),

  // Get feedback reminder statistics
  getFeedbackReminderStats: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Build date filter
      const filters = [];
      if (input.startDate) {
        filters.push(gte(feedbackReminders.createdAt, input.startDate));
      }
      if (input.endDate) {
        filters.push(lte(feedbackReminders.createdAt, input.endDate));
      }

      // Get overall stats
      const stats = await db
        .select({
          status: feedbackReminders.status,
          reminderType: feedbackReminders.reminderType,
          count: count(),
        })
        .from(feedbackReminders)
        .where(filters.length > 0 ? and(...filters) : undefined)
        .groupBy(feedbackReminders.status, feedbackReminders.reminderType);

      // Get recent reminders
      const recentReminders = await db
        .select()
        .from(feedbackReminders)
        .where(filters.length > 0 ? and(...filters) : undefined)
        .orderBy(desc(feedbackReminders.createdAt))
        .limit(50);

      // Calculate success rate
      const totalReminders = stats.reduce((sum, s) => sum + s.count, 0);
      const sentReminders = stats
        .filter((s) => s.status === "sent")
        .reduce((sum, s) => sum + s.count, 0);
      const successRate =
        totalReminders > 0 ? (sentReminders / totalReminders) * 100 : 0;

      return {
        stats,
        recentReminders,
        totalReminders,
        sentReminders,
        successRate,
      };
    }),

  // Get notification delivery statistics
  getNotificationStats: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const filters = [];
      if (input.startDate) {
        filters.push(gte(notificationHistory.createdAt, input.startDate));
      }
      if (input.endDate) {
        filters.push(lte(notificationHistory.createdAt, input.endDate));
      }

      // Get notification stats by type and delivery method
      const stats = await db
        .select({
          type: notificationHistory.type,
          deliveryMethod: notificationHistory.deliveryMethod,
          count: count(),
          pushSent: sql<number>`SUM(CASE WHEN ${notificationHistory.pushSent} = 1 THEN 1 ELSE 0 END)`,
          emailSent: sql<number>`SUM(CASE WHEN ${notificationHistory.emailSent} = 1 THEN 1 ELSE 0 END)`,
          smsSent: sql<number>`SUM(CASE WHEN ${notificationHistory.smsSent} = 1 THEN 1 ELSE 0 END)`,
        })
        .from(notificationHistory)
        .where(filters.length > 0 ? and(...filters) : undefined)
        .groupBy(notificationHistory.type, notificationHistory.deliveryMethod);

      return stats;
    }),

  // Get system health overview
  getSystemHealth: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get counts of various entities
    const [
      totalUsers,
      pendingReminders,
      failedReminders,
      recentNotifications,
      pendingFeedback,
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db
        .select({ count: count() })
        .from(feedbackReminders)
        .where(eq(feedbackReminders.status, "scheduled")),
      db
        .select({ count: count() })
        .from(feedbackReminders)
        .where(eq(feedbackReminders.status, "failed")),
      db
        .select({ count: count() })
        .from(notificationHistory)
        .where(
          gte(
            notificationHistory.createdAt,
            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          )
        ),
      db
        .select({ count: count() })
        .from(interviewFeedback)
        .where(eq(interviewFeedback.submittedBy, 0)), // Assuming 0 means not submitted
    ]);

    return {
      totalUsers: totalUsers[0]?.count || 0,
      pendingReminders: pendingReminders[0]?.count || 0,
      failedReminders: failedReminders[0]?.count || 0,
      recentNotifications: recentNotifications[0]?.count || 0,
      pendingFeedback: pendingFeedback[0]?.count || 0,
    };
  }),

  // Get scheduled job status
  getScheduledJobStatus: protectedProcedure.query(() => {
    return getScheduledJobStatus();
  }),

  // Manually trigger scheduled jobs
  runScheduledJobs: protectedProcedure.mutation(async () => {
    const results = await runScheduledJobs();
    return {
      success: true,
      results,
    };
  }),
});
