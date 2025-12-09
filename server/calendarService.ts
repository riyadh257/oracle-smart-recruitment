import { execSync } from 'child_process';

/**
 * Calendar Service - Wraps Google Calendar MCP tools for calendar integration
 */

export interface CalendarEvent {
  summary: string;
  description?: string;
  location?: string;
  start_time: string; // RFC3339 format
  end_time: string; // RFC3339 format
  attendees?: string[];
  reminders?: number[]; // Minutes before event
  calendar_id?: string;
}

export interface SearchEventsParams {
  calendar_id?: string;
  time_min?: string; // RFC3339 timestamp
  time_max?: string; // RFC3339 timestamp
  q?: string; // Search query
  max_results?: number;
}

/**
 * Search for calendar events
 */
export async function searchCalendarEvents(params: SearchEventsParams) {
  try {
    const input = JSON.stringify(params);
    const result = execSync(
      `manus-mcp-cli tool call google_calendar_search_events --server google-calendar --input '${input}'`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );
    return JSON.parse(result);
  } catch (error) {
    console.error('Failed to search calendar events:', error);
    throw new Error('Calendar search failed');
  }
}

/**
 * Create calendar event(s)
 */
export async function createCalendarEvents(events: CalendarEvent[]) {
  try {
    const input = JSON.stringify({ events });
    const result = execSync(
      `manus-mcp-cli tool call google_calendar_create_events --server google-calendar --input '${input}'`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );
    return JSON.parse(result);
  } catch (error) {
    console.error('Failed to create calendar events:', error);
    throw new Error('Calendar event creation failed');
  }
}

/**
 * Get a specific calendar event
 */
export async function getCalendarEvent(eventId: string, calendarId: string = 'primary') {
  try {
    const input = JSON.stringify({ event_id: eventId, calendar_id: calendarId });
    const result = execSync(
      `manus-mcp-cli tool call google_calendar_get_event --server google-calendar --input '${input}'`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );
    return JSON.parse(result);
  } catch (error) {
    console.error('Failed to get calendar event:', error);
    throw new Error('Calendar event retrieval failed');
  }
}

/**
 * Update calendar event(s)
 */
export async function updateCalendarEvents(events: Array<{
  event_id: string;
  calendar_id?: string;
  summary?: string;
  description?: string;
  location?: string;
  start_time?: string;
  end_time?: string;
  attendees?: string[];
  reminders?: number[];
}>) {
  try {
    const input = JSON.stringify({ events });
    const result = execSync(
      `manus-mcp-cli tool call google_calendar_update_events --server google-calendar --input '${input}'`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );
    return JSON.parse(result);
  } catch (error) {
    console.error('Failed to update calendar events:', error);
    throw new Error('Calendar event update failed');
  }
}

/**
 * Delete calendar event(s)
 */
export async function deleteCalendarEvents(events: Array<{
  event_id: string;
  calendar_id?: string;
}>) {
  try {
    const input = JSON.stringify({ events });
    const result = execSync(
      `manus-mcp-cli tool call google_calendar_delete_events --server google-calendar --input '${input}'`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );
    return JSON.parse(result);
  } catch (error) {
    console.error('Failed to delete calendar events:', error);
    throw new Error('Calendar event deletion failed');
  }
}

/**
 * Check availability for a given time range
 * Returns true if the time slot is available (no conflicts)
 */
export async function checkAvailability(
  startTime: string,
  endTime: string,
  calendarId: string = 'primary'
): Promise<{ available: boolean; conflictingEvents: any[] }> {
  try {
    const events = await searchCalendarEvents({
      calendar_id: calendarId,
      time_min: startTime,
      time_max: endTime,
    });

    const conflictingEvents = events.content?.[0]?.text 
      ? JSON.parse(events.content[0].text).events || []
      : [];

    return {
      available: conflictingEvents.length === 0,
      conflictingEvents,
    };
  } catch (error) {
    console.error('Failed to check availability:', error);
    throw new Error('Availability check failed');
  }
}

/**
 * Find available time slots within a date range
 */
export async function findAvailableSlots(
  startDate: Date,
  endDate: Date,
  durationMinutes: number,
  workingHoursStart: number = 9, // 9 AM
  workingHoursEnd: number = 17, // 5 PM
  calendarId: string = 'primary'
): Promise<Array<{ start: string; end: string }>> {
  try {
    // Get all events in the date range
    const events = await searchCalendarEvents({
      calendar_id: calendarId,
      time_min: startDate.toISOString(),
      time_max: endDate.toISOString(),
    });

    const busySlots = events.content?.[0]?.text 
      ? JSON.parse(events.content[0].text).events || []
      : [];

    // Generate potential time slots
    const availableSlots: Array<{ start: string; end: string }> = [];
    const currentDate = new Date(startDate);

    while (currentDate < endDate) {
      // Check each hour within working hours
      for (let hour = workingHoursStart; hour < workingHoursEnd; hour++) {
        const slotStart = new Date(currentDate);
        slotStart.setHours(hour, 0, 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

        // Check if slot is within working hours
        if (slotEnd.getHours() > workingHoursEnd) {
          continue;
        }

        // Check for conflicts with busy slots
        const hasConflict = busySlots.some((event: any) => {
          const eventStart = new Date(event.start?.dateTime || event.start?.date);
          const eventEnd = new Date(event.end?.dateTime || event.end?.date);
          return (slotStart < eventEnd && slotEnd > eventStart);
        });

        if (!hasConflict) {
          availableSlots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
          });
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return availableSlots;
  } catch (error) {
    console.error('Failed to find available slots:', error);
    throw new Error('Available slots search failed');
  }
}
