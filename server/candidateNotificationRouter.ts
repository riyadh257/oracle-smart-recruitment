import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getCandidateNotificationPreferences,
  upsertCandidateNotificationPreferences,
  createApplicationStatusHistory,
  getApplicationStatusHistory,
  getApplicationWithCandidate,
  getPendingStatusNotifications,
  markStatusHistoryNotificationSent,
} from "./candidateNotificationDb";
import { getDb } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { applications, candidates } from "../drizzle/schema";

export const candidateNotificationRouter = router({
  /**
   * Get notification preferences for a candidate
   */
  getPreferences: protectedProcedure
    .input(z.object({ candidateId: z.number() }))
    .query(async ({ input }) => {
      const prefs = await getCandidateNotificationPreferences(input.candidateId);
      
      // Return default preferences if none exist
      if (!prefs) {
        return {
          candidateId: input.candidateId,
          jobAlertFrequency: "daily_digest" as const,
          applicationStatusUpdates: true,
          interviewReminders: true,
          newJobMatches: true,
          companyUpdates: false,
          careerTips: false,
          quietHoursEnabled: false,
          quietHoursStart: "22:00",
          quietHoursEnd: "08:00",
          timezone: "Asia/Riyadh",
        };
      }
      
      return prefs;
    }),

  /**
   * Update notification preferences for a candidate
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        candidateId: z.number(),
        jobAlertFrequency: z.enum(["instant", "daily_digest", "weekly_summary", "off"]),
        applicationStatusUpdates: z.boolean(),
        interviewReminders: z.boolean(),
        newJobMatches: z.boolean(),
        companyUpdates: z.boolean(),
        careerTips: z.boolean(),
        quietHoursEnabled: z.boolean().optional(),
        quietHoursStart: z.string().optional(),
        quietHoursEnd: z.string().optional(),
        timezone: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await upsertCandidateNotificationPreferences(input);
      return result;
    }),

  /**
   * Get application status history for an application
   */
  getStatusHistory: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .query(async ({ input }) => {
      const history = await getApplicationStatusHistory(input.applicationId);
      return history;
    }),

  /**
   * Update application status and create history entry
   */
  updateApplicationStatus: protectedProcedure
    .input(
      z.object({
        applicationId: z.number(),
        newStatus: z.enum(["submitted", "screening", "interviewing", "offered", "rejected"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Get current application
      const app = await db
        .select()
        .from(applications)
        .where(eq(applications.id, input.applicationId))
        .limit(1);

      if (!app[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Application not found" });
      }

      const previousStatus = app[0].status;

      // Update application status
      await db
        .update(applications)
        .set({ status: input.newStatus, updatedAt: new Date() })
        .where(eq(applications.id, input.applicationId));

      // Create status history entry
      await createApplicationStatusHistory({
        applicationId: input.applicationId,
        previousStatus: previousStatus,
        newStatus: input.newStatus,
        changedBy: ctx.user.id,
        notes: input.notes,
        notificationSent: false,
      });

      return { success: true };
    }),

  /**
   * Get pending status notifications (for background job)
   */
  getPendingNotifications: protectedProcedure.query(async () => {
    const pending = await getPendingStatusNotifications();
    return pending;
  }),

  /**
   * Mark notification as sent
   */
  markNotificationSent: protectedProcedure
    .input(z.object({ historyId: z.number() }))
    .mutation(async ({ input }) => {
      await markStatusHistoryNotificationSent(input.historyId);
      return { success: true };
    }),

  /**
   * Get recruiter dashboard quick actions data
   */
  getQuickActions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Get pending applications count (submitted status)
    const pendingApps = await db
      .select()
      .from(applications)
      .where(eq(applications.status, "submitted"));

    // Get upcoming interviews (next 7 days)
    const { interviews } = await import("../drizzle/schema");
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const upcomingInterviews = await db
      .select()
      .from(interviews)
      .where(
        and(
          eq(interviews.status, "scheduled"),
        )
      )
      .orderBy(interviews.scheduledAt)
      .limit(5);

    // Get recent application status changes (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const { applicationStatusHistory } = await import("../drizzle/schema");
    const recentStatusChanges = await db
      .select()
      .from(applicationStatusHistory)
      .orderBy(desc(applicationStatusHistory.createdAt))
      .limit(10);

    return {
      pendingApplicationsCount: pendingApps.length,
      upcomingInterviews: upcomingInterviews.slice(0, 5),
      recentStatusChanges: recentStatusChanges,
      digestPerformance: {
        todayApplications: pendingApps.filter((app) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return new Date(app.createdAt) >= today;
        }).length,
        weekApplications: pendingApps.filter((app) => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return new Date(app.createdAt) >= weekAgo;
        }).length,
      },
    };
  }),
});
