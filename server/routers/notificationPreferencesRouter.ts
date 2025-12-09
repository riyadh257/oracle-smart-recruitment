import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { userNotificationPreferences } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Notification Preferences Router
 * Manages user-specific notification preferences including quiet hours and channel selection
 */
export const notificationPreferencesRouter = router({
  /**
   * Get user's notification preferences
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database not available",
      });
    }

    const prefs = await db
      .select()
      .from(userNotificationPreferences)
      .where(eq(userNotificationPreferences.userId, ctx.user.id))
      .limit(1);

    // Return default preferences if none exist
    if (prefs.length === 0) {
      return {
        quietHoursEnabled: false,
        quietHoursStart: "22:00",
        quietHoursEnd: "08:00",
        quietHoursTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        interviewReminderPush: true,
        interviewReminderEmail: true,
        feedbackRequestPush: true,
        feedbackRequestEmail: true,
        candidateResponsePush: true,
        candidateResponseEmail: true,
        engagementAlertPush: true,
        engagementAlertEmail: false,
        abTestResultPush: false,
        abTestResultEmail: true,
        systemUpdatePush: false,
        systemUpdateEmail: true,
        generalPush: true,
        generalEmail: true,
      };
    }

    return prefs[0];
  }),

  /**
   * Update notification preferences
   */
  update: protectedProcedure
    .input(
      z.object({
        quietHoursEnabled: z.boolean().optional(),
        quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        quietHoursTimezone: z.string().optional(),
        interviewReminderPush: z.boolean().optional(),
        interviewReminderEmail: z.boolean().optional(),
        feedbackRequestPush: z.boolean().optional(),
        feedbackRequestEmail: z.boolean().optional(),
        candidateResponsePush: z.boolean().optional(),
        candidateResponseEmail: z.boolean().optional(),
        engagementAlertPush: z.boolean().optional(),
        engagementAlertEmail: z.boolean().optional(),
        abTestResultPush: z.boolean().optional(),
        abTestResultEmail: z.boolean().optional(),
        systemUpdatePush: z.boolean().optional(),
        systemUpdateEmail: z.boolean().optional(),
        generalPush: z.boolean().optional(),
        generalEmail: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Check if preferences exist
      const existing = await db
        .select()
        .from(userNotificationPreferences)
        .where(eq(userNotificationPreferences.userId, ctx.user.id))
        .limit(1);

      if (existing.length === 0) {
        // Create new preferences
        await db.insert(userNotificationPreferences).values({
          userId: ctx.user.id,
          ...input,
        });
      } else {
        // Update existing preferences
        await db
          .update(userNotificationPreferences)
          .set({
            ...input,
            updatedAt: new Date(),
          })
          .where(eq(userNotificationPreferences.userId, ctx.user.id));
      }

      return { success: true };
    }),

  /**
   * Toggle quiet hours
   */
  toggleQuietHours: protectedProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Check if preferences exist
      const existing = await db
        .select()
        .from(userNotificationPreferences)
        .where(eq(userNotificationPreferences.userId, ctx.user.id))
        .limit(1);

      if (existing.length === 0) {
        // Create with quiet hours enabled
        await db.insert(userNotificationPreferences).values({
          userId: ctx.user.id,
          quietHoursEnabled: input.enabled,
        });
      } else {
        // Update existing
        await db
          .update(userNotificationPreferences)
          .set({
            quietHoursEnabled: input.enabled,
            updatedAt: new Date(),
          })
          .where(eq(userNotificationPreferences.userId, ctx.user.id));
      }

      return { success: true, enabled: input.enabled };
    }),

  /**
   * Update quiet hours schedule
   */
  updateQuietHours: protectedProcedure
    .input(
      z.object({
        start: z.string().regex(/^\d{2}:\d{2}$/),
        end: z.string().regex(/^\d{2}:\d{2}$/),
        timezone: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Check if preferences exist
      const existing = await db
        .select()
        .from(userNotificationPreferences)
        .where(eq(userNotificationPreferences.userId, ctx.user.id))
        .limit(1);

      if (existing.length === 0) {
        // Create with quiet hours settings
        await db.insert(userNotificationPreferences).values({
          userId: ctx.user.id,
          quietHoursStart: input.start,
          quietHoursEnd: input.end,
          quietHoursTimezone: input.timezone,
        });
      } else {
        // Update existing
        await db
          .update(userNotificationPreferences)
          .set({
            quietHoursStart: input.start,
            quietHoursEnd: input.end,
            quietHoursTimezone: input.timezone,
            updatedAt: new Date(),
          })
          .where(eq(userNotificationPreferences.userId, ctx.user.id));
      }

      return { success: true };
    }),

  /**
   * Update channel preferences for a specific notification type
   */
  updateChannelPreferences: protectedProcedure
    .input(
      z.object({
        notificationType: z.enum([
          "interviewReminder",
          "feedbackRequest",
          "candidateResponse",
          "engagementAlert",
          "abTestResult",
          "systemUpdate",
          "general",
        ]),
        push: z.boolean(),
        email: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Map notification type to column names
      const pushColumn = `${input.notificationType}Push`;
      const emailColumn = `${input.notificationType}Email`;

      // Check if preferences exist
      const existing = await db
        .select()
        .from(userNotificationPreferences)
        .where(eq(userNotificationPreferences.userId, ctx.user.id))
        .limit(1);

      const updateData: any = {
        [pushColumn]: input.push,
        [emailColumn]: input.email,
        updatedAt: new Date(),
      };

      if (existing.length === 0) {
        // Create with channel preferences
        await db.insert(userNotificationPreferences).values({
          userId: ctx.user.id,
          ...updateData,
        });
      } else {
        // Update existing
        await db
          .update(userNotificationPreferences)
          .set(updateData)
          .where(eq(userNotificationPreferences.userId, ctx.user.id));
      }

      return { success: true };
    }),
});
