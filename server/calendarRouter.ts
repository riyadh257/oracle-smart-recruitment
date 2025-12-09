import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { 
  searchCalendarEvents, 
  createCalendarEvents, 
  getCalendarEvent,
  updateCalendarEvents,
  deleteCalendarEvents,
  checkAvailability,
  findAvailableSlots
} from "./calendarService";
import * as db from "./db";

/**
 * Calendar router - handles calendar integration operations
 */
export const calendarRouter = router({
  /**
   * Search calendar events
   */
  searchEvents: protectedProcedure
    .input(z.object({
      calendarId: z.string().optional(),
      timeMin: z.string().optional(),
      timeMax: z.string().optional(),
      query: z.string().optional(),
      maxResults: z.number().optional(),
    }))
    .query(async ({ input }) => {
      return await searchCalendarEvents({
        calendar_id: input.calendarId,
        time_min: input.timeMin,
        time_max: input.timeMax,
        q: input.query,
        max_results: input.maxResults,
      });
    }),

  /**
   * Create calendar event
   */
  createEvent: protectedProcedure
    .input(z.object({
      summary: z.string(),
      description: z.string().optional(),
      location: z.string().optional(),
      startTime: z.string(), // ISO 8601 format
      endTime: z.string(), // ISO 8601 format
      attendees: z.array(z.string()).optional(),
      reminders: z.array(z.number()).optional(),
      calendarId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const event = {
        summary: input.summary,
        description: input.description,
        location: input.location,
        start_time: input.startTime,
        end_time: input.endTime,
        attendees: input.attendees,
        reminders: input.reminders,
        calendar_id: input.calendarId,
      };

      return await createCalendarEvents([event]);
    }),

  /**
   * Get calendar event by ID
   */
  getEvent: protectedProcedure
    .input(z.object({
      eventId: z.string(),
      calendarId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return await getCalendarEvent(input.eventId, input.calendarId);
    }),

  /**
   * Update calendar event
   */
  updateEvent: protectedProcedure
    .input(z.object({
      eventId: z.string(),
      calendarId: z.string().optional(),
      summary: z.string().optional(),
      description: z.string().optional(),
      location: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      attendees: z.array(z.string()).optional(),
      reminders: z.array(z.number()).optional(),
    }))
    .mutation(async ({ input }) => {
      const event = {
        event_id: input.eventId,
        calendar_id: input.calendarId,
        summary: input.summary,
        description: input.description,
        location: input.location,
        start_time: input.startTime,
        end_time: input.endTime,
        attendees: input.attendees,
        reminders: input.reminders,
      };

      return await updateCalendarEvents([event]);
    }),

  /**
   * Delete calendar event
   */
  deleteEvent: protectedProcedure
    .input(z.object({
      eventId: z.string(),
      calendarId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await deleteCalendarEvents([{
        event_id: input.eventId,
        calendar_id: input.calendarId,
      }]);
    }),

  /**
   * Check availability for a time slot
   */
  checkAvailability: protectedProcedure
    .input(z.object({
      startTime: z.string(),
      endTime: z.string(),
      calendarId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return await checkAvailability(
        input.startTime,
        input.endTime,
        input.calendarId
      );
    }),

  /**
   * Find available time slots
   */
  findAvailableSlots: protectedProcedure
    .input(z.object({
      startDate: z.string(), // ISO 8601 date
      endDate: z.string(), // ISO 8601 date
      durationMinutes: z.number(),
      workingHoursStart: z.number().optional(),
      workingHoursEnd: z.number().optional(),
      calendarId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return await findAvailableSlots(
        new Date(input.startDate),
        new Date(input.endDate),
        input.durationMinutes,
        input.workingHoursStart,
        input.workingHoursEnd,
        input.calendarId
      );
    }),

  /**
   * Bulk schedule interviews with calendar integration
   */
  bulkScheduleInterviews: protectedProcedure
    .input(z.object({
      candidateEmails: z.array(z.string()),
      interviewTitle: z.string(),
      interviewDescription: z.string().optional(),
      location: z.string().optional(),
      durationMinutes: z.number(),
      startDate: z.string(),
      endDate: z.string(),
      workingHoursStart: z.number().optional(),
      workingHoursEnd: z.number().optional(),
      calendarId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Find available slots
      const availableSlots = await findAvailableSlots(
        new Date(input.startDate),
        new Date(input.endDate),
        input.durationMinutes,
        input.workingHoursStart,
        input.workingHoursEnd,
        input.calendarId
      );

      if (availableSlots.length < input.candidateEmails.length) {
        throw new Error(
          `Not enough available slots. Found ${availableSlots.length} slots for ${input.candidateEmails.length} candidates.`
        );
      }

      // Create calendar events for each candidate
      const events = input.candidateEmails.map((email, index) => ({
        summary: input.interviewTitle,
        description: input.interviewDescription,
        location: input.location,
        start_time: availableSlots[index].start,
        end_time: availableSlots[index].end,
        attendees: [email],
        reminders: [30, 60], // 30 min and 1 hour before
        calendar_id: input.calendarId,
      }));

      const result = await createCalendarEvents(events);

      return {
        success: true,
        scheduledCount: events.length,
        events: result,
      };
    }),

  /**
   * Get calendar connections for current user
   */
  getConnections: protectedProcedure
    .query(async ({ ctx }) => {
      const database = await db.getDb();
      if (!database) {
        throw new Error("Database not available");
      }

      const connections = await database.query.calendarConnections.findMany({
        where: (calendarConnections, { eq }) => eq(calendarConnections.userId, ctx.user.id),
      });

      return connections;
    }),

  /**
   * Sync calendar events to database
   */
  syncEvents: protectedProcedure
    .input(z.object({
      calendarId: z.string().optional(),
      daysAhead: z.number().default(30),
    }))
    .mutation(async ({ input, ctx }) => {
      const database = await db.getDb();
      if (!database) {
        throw new Error("Database not available");
      }

      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + input.daysAhead);

      // Fetch events from calendar
      const events = await searchCalendarEvents({
        calendar_id: input.calendarId,
        time_min: now.toISOString(),
        time_max: futureDate.toISOString(),
      });

      // Parse and store events
      const eventsData = events.content?.[0]?.text 
        ? JSON.parse(events.content[0].text).events || []
        : [];

      // TODO: Store events in database
      // This would require a calendar connection record first

      return {
        success: true,
        syncedCount: eventsData.length,
        lastSyncAt: new Date(),
      };
    }),
});
