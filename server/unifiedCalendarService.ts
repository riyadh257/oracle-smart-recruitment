import {
  CalendarEvent,
  SearchEventsParams,
  searchCalendarEvents as searchGoogleEvents,
  createCalendarEvents as createGoogleEvents,
  updateCalendarEvents as updateGoogleEvents,
  deleteCalendarEvents as deleteGoogleEvents,
  checkAvailability as checkGoogleAvailability,
  findAvailableSlots as findGoogleAvailableSlots,
} from './calendarService';

import {
  OutlookCalendarEvent,
  OutlookSearchEventsParams,
  searchOutlookEvents,
  createOutlookEvent,
  updateOutlookEvent,
  deleteOutlookEvent,
  checkOutlookAvailability,
  findOutlookAvailableSlots,
} from './outlookCalendarService';

/**
 * Unified Calendar Service
 * Provides a single interface for both Google Calendar and Outlook Calendar operations
 */

export type CalendarProvider = 'google' | 'outlook';

export interface UnifiedCalendarConfig {
  provider: CalendarProvider;
  userId?: string; // Required for Outlook (email address)
  calendarId?: string; // Optional, defaults to 'primary' for Google
}

/**
 * Convert Google Calendar event to unified format
 */
function convertGoogleToUnified(event: any): any {
  return {
    id: event.id,
    summary: event.summary,
    description: event.description,
    location: event.location,
    startTime: event.start?.dateTime || event.start?.date,
    endTime: event.end?.dateTime || event.end?.date,
    attendees: event.attendees?.map((a: any) => a.email) || [],
    provider: 'google' as CalendarProvider,
  };
}

/**
 * Convert Outlook event to unified format
 */
function convertOutlookToUnified(event: any): any {
  return {
    id: event.id,
    summary: event.subject,
    description: event.body?.content,
    location: event.location?.displayName,
    startTime: event.start?.dateTime,
    endTime: event.end?.dateTime,
    attendees: event.attendees?.map((a: any) => a.emailAddress.address) || [],
    provider: 'outlook' as CalendarProvider,
  };
}

/**
 * Search for calendar events across providers
 */
export async function searchEvents(
  config: UnifiedCalendarConfig,
  params: {
    timeMin?: string;
    timeMax?: string;
    query?: string;
    maxResults?: number;
  }
): Promise<any[]> {
  try {
    if (config.provider === 'google') {
      const result = await searchGoogleEvents({
        calendar_id: config.calendarId || 'primary',
        time_min: params.timeMin,
        time_max: params.timeMax,
        q: params.query,
        max_results: params.maxResults,
      });

      const events = result.content?.[0]?.text 
        ? JSON.parse(result.content[0].text).events || []
        : [];

      return events.map(convertGoogleToUnified);
    } else {
      if (!config.userId) {
        throw new Error('userId is required for Outlook calendar operations');
      }

      const result = await searchOutlookEvents(config.userId, {
        startDateTime: params.timeMin,
        endDateTime: params.timeMax,
        top: params.maxResults,
      });

      const events = result.value || [];
      return events.map(convertOutlookToUnified);
    }
  } catch (error) {
    console.error(`Failed to search ${config.provider} events:`, error);
    throw error;
  }
}

/**
 * Create a calendar event
 */
export async function createEvent(
  config: UnifiedCalendarConfig,
  event: {
    summary: string;
    description?: string;
    location?: string;
    startTime: string;
    endTime: string;
    attendees?: string[];
    reminderMinutes?: number;
  }
): Promise<any> {
  try {
    if (config.provider === 'google') {
      const googleEvent: CalendarEvent = {
        summary: event.summary,
        description: event.description,
        location: event.location,
        start_time: event.startTime,
        end_time: event.endTime,
        attendees: event.attendees,
        reminders: event.reminderMinutes ? [event.reminderMinutes] : undefined,
        calendar_id: config.calendarId || 'primary',
      };

      const result = await createGoogleEvents([googleEvent]);
      return result;
    } else {
      if (!config.userId) {
        throw new Error('userId is required for Outlook calendar operations');
      }

      const outlookEvent: OutlookCalendarEvent = {
        subject: event.summary,
        body: event.description ? {
          contentType: 'Text',
          content: event.description,
        } : undefined,
        location: event.location ? {
          displayName: event.location,
        } : undefined,
        start: {
          dateTime: event.startTime,
          timeZone: 'UTC',
        },
        end: {
          dateTime: event.endTime,
          timeZone: 'UTC',
        },
        attendees: event.attendees?.map(email => ({
          emailAddress: { address: email },
          type: 'required' as const,
        })),
        isReminderOn: !!event.reminderMinutes,
        reminderMinutesBeforeStart: event.reminderMinutes,
      };

      const result = await createOutlookEvent(config.userId, outlookEvent);
      return convertOutlookToUnified(result);
    }
  } catch (error) {
    console.error(`Failed to create ${config.provider} event:`, error);
    throw error;
  }
}

/**
 * Update a calendar event
 */
export async function updateEvent(
  config: UnifiedCalendarConfig,
  eventId: string,
  updates: {
    summary?: string;
    description?: string;
    location?: string;
    startTime?: string;
    endTime?: string;
    attendees?: string[];
  }
): Promise<any> {
  try {
    if (config.provider === 'google') {
      const googleUpdates = {
        event_id: eventId,
        calendar_id: config.calendarId || 'primary',
        summary: updates.summary,
        description: updates.description,
        location: updates.location,
        start_time: updates.startTime,
        end_time: updates.endTime,
        attendees: updates.attendees,
      };

      const result = await updateGoogleEvents([googleUpdates]);
      return result;
    } else {
      if (!config.userId) {
        throw new Error('userId is required for Outlook calendar operations');
      }

      const outlookUpdates: Partial<OutlookCalendarEvent> = {};
      if (updates.summary) outlookUpdates.subject = updates.summary;
      if (updates.description) {
        outlookUpdates.body = {
          contentType: 'Text',
          content: updates.description,
        };
      }
      if (updates.location) {
        outlookUpdates.location = {
          displayName: updates.location,
        };
      }
      if (updates.startTime) {
        outlookUpdates.start = {
          dateTime: updates.startTime,
          timeZone: 'UTC',
        };
      }
      if (updates.endTime) {
        outlookUpdates.end = {
          dateTime: updates.endTime,
          timeZone: 'UTC',
        };
      }
      if (updates.attendees) {
        outlookUpdates.attendees = updates.attendees.map(email => ({
          emailAddress: { address: email },
          type: 'required' as const,
        }));
      }

      const result = await updateOutlookEvent(config.userId, eventId, outlookUpdates);
      return convertOutlookToUnified(result);
    }
  } catch (error) {
    console.error(`Failed to update ${config.provider} event:`, error);
    throw error;
  }
}

/**
 * Delete a calendar event
 */
export async function deleteEvent(
  config: UnifiedCalendarConfig,
  eventId: string
): Promise<void> {
  try {
    if (config.provider === 'google') {
      await deleteGoogleEvents([{
        event_id: eventId,
        calendar_id: config.calendarId || 'primary',
      }]);
    } else {
      if (!config.userId) {
        throw new Error('userId is required for Outlook calendar operations');
      }

      await deleteOutlookEvent(config.userId, eventId);
    }
  } catch (error) {
    console.error(`Failed to delete ${config.provider} event:`, error);
    throw error;
  }
}

/**
 * Check availability for a time slot
 */
export async function checkAvailability(
  config: UnifiedCalendarConfig,
  startTime: string,
  endTime: string
): Promise<{ available: boolean; conflictingEvents: any[] }> {
  try {
    if (config.provider === 'google') {
      return await checkGoogleAvailability(
        startTime,
        endTime,
        config.calendarId || 'primary'
      );
    } else {
      if (!config.userId) {
        throw new Error('userId is required for Outlook calendar operations');
      }

      return await checkOutlookAvailability(config.userId, startTime, endTime);
    }
  } catch (error) {
    console.error(`Failed to check ${config.provider} availability:`, error);
    throw error;
  }
}

/**
 * Find available time slots
 */
export async function findAvailableSlots(
  config: UnifiedCalendarConfig,
  startDate: Date,
  endDate: Date,
  durationMinutes: number,
  workingHoursStart: number = 9,
  workingHoursEnd: number = 17
): Promise<Array<{ start: string; end: string }>> {
  try {
    if (config.provider === 'google') {
      return await findGoogleAvailableSlots(
        startDate,
        endDate,
        durationMinutes,
        workingHoursStart,
        workingHoursEnd,
        config.calendarId || 'primary'
      );
    } else {
      if (!config.userId) {
        throw new Error('userId is required for Outlook calendar operations');
      }

      return await findOutlookAvailableSlots(
        config.userId,
        startDate,
        endDate,
        durationMinutes,
        workingHoursStart,
        workingHoursEnd
      );
    }
  } catch (error) {
    console.error(`Failed to find ${config.provider} available slots:`, error);
    throw error;
  }
}

/**
 * Get user's preferred calendar provider from settings
 * This can be extended to read from user preferences in the database
 */
export function getUserCalendarConfig(userId: number): UnifiedCalendarConfig {
  // For now, default to Google Calendar
  // In the future, this could read from user preferences table
  return {
    provider: 'google',
    calendarId: 'primary',
  };
}

/**
 * Check if Outlook integration is configured
 */
export function isOutlookConfigured(): boolean {
  return !!(
    process.env.OUTLOOK_CLIENT_ID &&
    process.env.OUTLOOK_CLIENT_SECRET
  );
}

/**
 * Check if Google Calendar integration is configured
 */
export function isGoogleCalendarConfigured(): boolean {
  // Google Calendar uses MCP, which is always available
  return true;
}

/**
 * Get available calendar providers
 */
export function getAvailableProviders(): CalendarProvider[] {
  const providers: CalendarProvider[] = [];
  
  if (isGoogleCalendarConfigured()) {
    providers.push('google');
  }
  
  if (isOutlookConfigured()) {
    providers.push('outlook');
  }
  
  return providers;
}
