import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { calendarReminderService } from '../services/calendarReminderService';
import { getDb } from '../db';
import { workPermits } from '../../drizzle/schema';
import { and, gte, lte, isNull, eq } from 'drizzle-orm';

export const calendarRemindersRouter = router({
  /**
   * Create calendar events for all permits expiring within specified days
   */
  createRenewalReminders: protectedProcedure
    .input(
      z.object({
        daysAhead: z.number().min(1).max(365).default(90),
      })
    )
    .mutation(async ({ input }) => {
      const eventIds = await calendarReminderService.createPermitRenewalReminders(input.daysAhead);
      return {
        success: true,
        eventsCreated: eventIds.length,
        eventIds,
      };
    }),

  /**
   * Get list of permits that need calendar reminders
   */
  getPendingReminders: protectedProcedure
    .input(
      z.object({
        daysAhead: z.number().min(1).max(365).default(90),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + input.daysAhead);

      const permits = await db
        .select()
        .from(workPermits)
        .where(
          and(
            gte(workPermits.expiryDate, now),
            lte(workPermits.expiryDate, futureDate),
            isNull(workPermits.calendarEventId)
          )
        );

      return permits;
    }),

  /**
   * Update calendar event for a specific permit
   */
  updateReminderEvent: protectedProcedure
    .input(
      z.object({
        permitId: z.number(),
        updates: z.object({
          summary: z.string().optional(),
          description: z.string().optional(),
          start_time: z.string().optional(),
          end_time: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      await calendarReminderService.updatePermitReminderEvent(input.permitId, input.updates);
      return { success: true };
    }),

  /**
   * Delete calendar event for a permit (when renewed or cancelled)
   */
  deleteReminderEvent: protectedProcedure
    .input(
      z.object({
        permitId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      await calendarReminderService.deletePermitReminderEvent(input.permitId);
      return { success: true };
    }),

  /**
   * Get all permits with their calendar event status
   */
  getPermitsWithCalendarStatus: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }

    const permits = await db.select().from(workPermits);

    return permits.map(permit => ({
      ...permit,
      hasCalendarEvent: !!permit.calendarEventId,
      daysUntilExpiry: Math.ceil(
        (new Date(permit.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ),
    }));
  }),

  /**
   * Manually trigger calendar event creation for a specific permit
   */
  createSingleReminder: protectedProcedure
    .input(
      z.object({
        permitId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      const [permit] = await db
        .select()
        .from(workPermits)
        .where(eq(workPermits.id, input.permitId))
        .limit(1);

      if (!permit) {
        throw new Error('Permit not found');
      }

      if (permit.calendarEventId) {
        throw new Error('Calendar event already exists for this permit');
      }

      // Create single event by calling the service with a narrow time window
      const expiryDate = new Date(permit.expiryDate);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry < 0) {
        throw new Error('Cannot create reminder for expired permit');
      }

      const eventIds = await calendarReminderService.createPermitRenewalReminders(daysUntilExpiry + 1);

      return {
        success: true,
        eventId: eventIds[0] || null,
      };
    }),
});
