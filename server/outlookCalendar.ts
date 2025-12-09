/**
 * Outlook Calendar Integration Service
 * Provides calendar operations using Microsoft Graph API
 */

import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";

// Microsoft Graph API base URL
const GRAPH_API_BASE = "https://graph.microsoft.com/v1.0";

interface OutlookEvent {
  id: string;
  subject: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName: string;
  };
  attendees?: Array<{
    emailAddress: {
      address: string;
      name?: string;
    };
    type: string;
  }>;
}

/**
 * Make authenticated request to Microsoft Graph API
 */
async function makeGraphRequest(
  accessToken: string,
  endpoint: string,
  method: string = "GET",
  body?: any
): Promise<any> {
  const url = `${GRAPH_API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Microsoft Graph API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Get user's calendar events
 */
export async function getOutlookEvents(
  accessToken: string,
  startDate: Date,
  endDate: Date
): Promise<OutlookEvent[]> {
  const startDateTime = startDate.toISOString();
  const endDateTime = endDate.toISOString();

  const response = await makeGraphRequest(
    accessToken,
    `/me/calendar/calendarView?startDateTime=${startDateTime}&endDateTime=${endDateTime}&$orderby=start/dateTime`
  );

  return response.value || [];
}

/**
 * Create a calendar event in Outlook
 */
export async function createOutlookEvent(
  accessToken: string,
  event: {
    subject: string;
    start: Date;
    end: Date;
    location?: string;
    attendees?: Array<{ email: string; name?: string }>;
    body?: string;
  }
): Promise<OutlookEvent> {
  const eventData = {
    subject: event.subject,
    start: {
      dateTime: event.start.toISOString(),
      timeZone: "UTC",
    },
    end: {
      dateTime: event.end.toISOString(),
      timeZone: "UTC",
    },
    location: event.location
      ? {
          displayName: event.location,
        }
      : undefined,
    attendees: event.attendees?.map((attendee) => ({
      emailAddress: {
        address: attendee.email,
        name: attendee.name,
      },
      type: "required",
    })),
    body: event.body
      ? {
          contentType: "HTML",
          content: event.body,
        }
      : undefined,
  };

  return makeGraphRequest(accessToken, "/me/calendar/events", "POST", eventData);
}

/**
 * Update an existing calendar event
 */
export async function updateOutlookEvent(
  accessToken: string,
  eventId: string,
  updates: {
    subject?: string;
    start?: Date;
    end?: Date;
    location?: string;
    attendees?: Array<{ email: string; name?: string }>;
    body?: string;
  }
): Promise<OutlookEvent> {
  const eventData: any = {};

  if (updates.subject) eventData.subject = updates.subject;
  if (updates.start) {
    eventData.start = {
      dateTime: updates.start.toISOString(),
      timeZone: "UTC",
    };
  }
  if (updates.end) {
    eventData.end = {
      dateTime: updates.end.toISOString(),
      timeZone: "UTC",
    };
  }
  if (updates.location) {
    eventData.location = {
      displayName: updates.location,
    };
  }
  if (updates.attendees) {
    eventData.attendees = updates.attendees.map((attendee) => ({
      emailAddress: {
        address: attendee.email,
        name: attendee.name,
      },
      type: "required",
    }));
  }
  if (updates.body) {
    eventData.body = {
      contentType: "HTML",
      content: updates.body,
    };
  }

  return makeGraphRequest(
    accessToken,
    `/me/calendar/events/${eventId}`,
    "PATCH",
    eventData
  );
}

/**
 * Delete a calendar event
 */
export async function deleteOutlookEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  await makeGraphRequest(accessToken, `/me/calendar/events/${eventId}`, "DELETE");
}

/**
 * Check availability for a time slot
 */
export async function checkOutlookAvailability(
  accessToken: string,
  startTime: Date,
  endTime: Date,
  attendeeEmails: string[]
): Promise<{ email: string; available: boolean }[]> {
  const scheduleData = {
    schedules: attendeeEmails,
    startTime: {
      dateTime: startTime.toISOString(),
      timeZone: "UTC",
    },
    endTime: {
      dateTime: endTime.toISOString(),
      timeZone: "UTC",
    },
    availabilityViewInterval: 30, // 30-minute intervals
  };

  const response = await makeGraphRequest(
    accessToken,
    "/me/calendar/getSchedule",
    "POST",
    scheduleData
  );

  // Parse availability from response
  const availability = response.value?.map((schedule: any) => ({
    email: schedule.scheduleId,
    available: schedule.availabilityView === "0", // "0" means free
  })) || [];

  return availability;
}

/**
 * tRPC router for Outlook Calendar operations
 */
export const outlookCalendarRouter = router({
  /**
   * Get calendar events for a date range
   */
  getEvents: protectedProcedure
    .input(
      z.object({
        accessToken: z.string(),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ input }) => {
      return getOutlookEvents(input.accessToken, input.startDate, input.endDate);
    }),

  /**
   * Create a new calendar event
   */
  createEvent: protectedProcedure
    .input(
      z.object({
        accessToken: z.string(),
        subject: z.string(),
        start: z.date(),
        end: z.date(),
        location: z.string().optional(),
        attendees: z
          .array(
            z.object({
              email: z.string().email(),
              name: z.string().optional(),
            })
          )
          .optional(),
        body: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { accessToken, ...eventData } = input;
      return createOutlookEvent(accessToken, eventData);
    }),

  /**
   * Update an existing calendar event
   */
  updateEvent: protectedProcedure
    .input(
      z.object({
        accessToken: z.string(),
        eventId: z.string(),
        subject: z.string().optional(),
        start: z.date().optional(),
        end: z.date().optional(),
        location: z.string().optional(),
        attendees: z
          .array(
            z.object({
              email: z.string().email(),
              name: z.string().optional(),
            })
          )
          .optional(),
        body: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { accessToken, eventId, ...updates } = input;
      return updateOutlookEvent(accessToken, eventId, updates);
    }),

  /**
   * Delete a calendar event
   */
  deleteEvent: protectedProcedure
    .input(
      z.object({
        accessToken: z.string(),
        eventId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await deleteOutlookEvent(input.accessToken, input.eventId);
      return { success: true };
    }),

  /**
   * Check availability for attendees
   */
  checkAvailability: protectedProcedure
    .input(
      z.object({
        accessToken: z.string(),
        startTime: z.date(),
        endTime: z.date(),
        attendeeEmails: z.array(z.string().email()),
      })
    )
    .query(async ({ input }) => {
      return checkOutlookAvailability(
        input.accessToken,
        input.startTime,
        input.endTime,
        input.attendeeEmails
      );
    }),
});
