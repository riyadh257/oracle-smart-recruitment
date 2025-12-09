import { exec } from 'child_process';
import { promisify } from 'util';
import { getDb } from '../db';
import { workPermits } from '../../drizzle/schema';
import { and, eq, gte, lte, isNull } from 'drizzle-orm';

const execAsync = promisify(exec);

interface CalendarEvent {
  summary: string;
  description: string;
  start_time: string;
  end_time: string;
  reminders: number[];
  location?: string;
}

/**
 * Creates Google Calendar events for upcoming permit renewals
 * This service automatically schedules reminders for work permits expiring within the next 90 days
 */
export class CalendarReminderService {
  /**
   * Create calendar events for all permits expiring within the specified days
   * @param daysAhead Number of days to look ahead (default: 90)
   * @returns Array of created event IDs
   */
  async createPermitRenewalReminders(daysAhead: number = 90): Promise<string[]> {
    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + daysAhead);

    // Find permits expiring within the timeframe that don't have calendar events yet
    const expiringPermits = await db
      .select()
      .from(workPermits)
      .where(
        and(
          gte(workPermits.expiryDate, now),
          lte(workPermits.expiryDate, futureDate),
          isNull(workPermits.calendarEventId)
        )
      );

    if (expiringPermits.length === 0) {
      console.log('[CalendarReminder] No permits found requiring calendar events');
      return [];
    }

    const events: CalendarEvent[] = expiringPermits.map(permit => {
      const expiryDate = new Date(permit.expiryDate);
      const reminderDate = new Date(expiryDate);
      reminderDate.setDate(expiryDate.getDate() - 30); // Reminder 30 days before expiry

      return {
        summary: `Work Permit Renewal Required - ${permit.candidateName}`,
        description: `Work permit for ${permit.candidateName} (${permit.nationality}) expires on ${expiryDate.toLocaleDateString()}.\n\nPermit Number: ${permit.permitNumber}\nIqama Number: ${permit.iqamaNumber || 'N/A'}\nJob Title: ${permit.jobTitle}\n\nAction required: Initiate renewal process immediately to avoid compliance violations.`,
        start_time: reminderDate.toISOString(),
        end_time: new Date(reminderDate.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
        reminders: [
          10080, // 7 days before (in minutes)
          1440,  // 1 day before
          60     // 1 hour before
        ],
        location: 'HR Department'
      };
    });

    try {
      // Call Google Calendar MCP to create events
      const input = JSON.stringify({ events });
      const { stdout } = await execAsync(
        `manus-mcp-cli tool call google_calendar_create_events --server google-calendar --input '${input.replace(/'/g, "'\\''")}'`
      );

      const result = JSON.parse(stdout);
      
      if (!result.content || !Array.isArray(result.content)) {
        throw new Error('Invalid response from Google Calendar API');
      }

      // Extract event IDs from response
      const eventIds: string[] = [];
      for (let i = 0; i < result.content.length; i++) {
        const content = result.content[i];
        if (content.type === 'text' && content.text) {
          const match = content.text.match(/Event created: ([\w-]+)/);
          if (match && match[1]) {
            eventIds.push(match[1]);
            
            // Update database with calendar event ID
            await db
              .update(workPermits)
              .set({ calendarEventId: match[1] })
              .where(eq(workPermits.id, expiringPermits[i]!.id));
          }
        }
      }

      console.log(`[CalendarReminder] Created ${eventIds.length} calendar events for permit renewals`);
      return eventIds;
    } catch (error) {
      console.error('[CalendarReminder] Failed to create calendar events:', error);
      throw error;
    }
  }

  /**
   * Update an existing calendar event for a permit
   * @param permitId Database ID of the work permit
   * @param updates Partial event updates
   */
  async updatePermitReminderEvent(
    permitId: number,
    updates: {
      summary?: string;
      description?: string;
      start_time?: string;
      end_time?: string;
    }
  ): Promise<void> {
    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }

    const [permit] = await db
      .select()
      .from(workPermits)
      .where(eq(workPermits.id, permitId))
      .limit(1);

    if (!permit || !permit.calendarEventId) {
      throw new Error('Permit not found or has no associated calendar event');
    }

    try {
      const events = [{
        event_id: permit.calendarEventId,
        ...updates
      }];

      const input = JSON.stringify({ events });
      await execAsync(
        `manus-mcp-cli tool call google_calendar_update_events --server google-calendar --input '${input.replace(/'/g, "'\\''")}'`
      );

      console.log(`[CalendarReminder] Updated calendar event ${permit.calendarEventId}`);
    } catch (error) {
      console.error('[CalendarReminder] Failed to update calendar event:', error);
      throw error;
    }
  }

  /**
   * Delete a calendar event when a permit is renewed or cancelled
   * @param permitId Database ID of the work permit
   */
  async deletePermitReminderEvent(permitId: number): Promise<void> {
    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }

    const [permit] = await db
      .select()
      .from(workPermits)
      .where(eq(workPermits.id, permitId))
      .limit(1);

    if (!permit || !permit.calendarEventId) {
      return; // Nothing to delete
    }

    try {
      const events = [{
        event_id: permit.calendarEventId
      }];

      const input = JSON.stringify({ events });
      await execAsync(
        `manus-mcp-cli tool call google_calendar_delete_events --server google-calendar --input '${input.replace(/'/g, "'\\''")}'`
      );

      // Clear the calendar event ID from database
      await db
        .update(workPermits)
        .set({ calendarEventId: null })
        .where(eq(workPermits.id, permitId));

      console.log(`[CalendarReminder] Deleted calendar event ${permit.calendarEventId}`);
    } catch (error) {
      console.error('[CalendarReminder] Failed to delete calendar event:', error);
      throw error;
    }
  }
}

export const calendarReminderService = new CalendarReminderService();
