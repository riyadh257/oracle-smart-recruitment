/**
 * Feedback Reminders Router
 * tRPC procedures for managing automated feedback reminders
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  scheduleFeedbackReminders,
  processDueFeedbackReminders,
  cancelFeedbackReminders,
  getReminderStats,
} from "../feedbackReminderService";
import { getDb } from "../db";
import { feedbackReminders } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const feedbackRemindersRouter = router({
  /**
   * Get reminder statistics
   */
  getStats: protectedProcedure.query(async () => {
    return await getReminderStats();
  }),

  /**
   * Get all reminders for an application
   */
  getByApplication: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const reminders = await db
        .select()
        .from(feedbackReminders)
        .where(eq(feedbackReminders.applicationId, input.applicationId))
        .orderBy(desc(feedbackReminders.scheduledFor));

      return reminders;
    }),

  /**
   * Get all pending reminders
   */
  getPending: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const reminders = await db
      .select()
      .from(feedbackReminders)
      .where(eq(feedbackReminders.status, "scheduled"))
      .orderBy(desc(feedbackReminders.scheduledFor))
      .limit(100);

    return reminders;
  }),

  /**
   * Schedule reminders for an application
   */
  schedule: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .mutation(async ({ input }) => {
      await scheduleFeedbackReminders(input.applicationId);
      return { success: true };
    }),

  /**
   * Cancel reminders for an application
   */
  cancel: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .mutation(async ({ input }) => {
      await cancelFeedbackReminders(input.applicationId);
      return { success: true };
    }),

  /**
   * Manually trigger processing of due reminders (admin only)
   */
  processDue: protectedProcedure.mutation(async () => {
    const sentCount = await processDueFeedbackReminders();
    return { success: true, sentCount };
  }),

  /**
   * Get reminder history with pagination
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const offset = (input.page - 1) * input.pageSize;

      const reminders = await db
        .select()
        .from(feedbackReminders)
        .orderBy(desc(feedbackReminders.createdAt))
        .limit(input.pageSize)
        .offset(offset);

      return {
        reminders,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),
});
