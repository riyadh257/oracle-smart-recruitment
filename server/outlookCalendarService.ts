import axios from 'axios';

/**
 * Outlook Calendar Service - Microsoft Graph API integration
 * Provides calendar operations for Outlook/Microsoft 365 calendars
 */

export interface OutlookCalendarEvent {
  subject: string;
  body?: {
    contentType: 'HTML' | 'Text';
    content: string;
  };
  location?: {
    displayName: string;
  };
  start: {
    dateTime: string; // ISO 8601 format
    timeZone: string;
  };
  end: {
    dateTime: string; // ISO 8601 format
    timeZone: string;
  };
  attendees?: Array<{
    emailAddress: {
      address: string;
      name?: string;
    };
    type: 'required' | 'optional' | 'resource';
  }>;
  isReminderOn?: boolean;
  reminderMinutesBeforeStart?: number;
}

export interface OutlookSearchEventsParams {
  startDateTime?: string; // ISO 8601 timestamp
  endDateTime?: string; // ISO 8601 timestamp
  filter?: string; // OData filter query
  top?: number; // Max results
}

/**
 * Get Microsoft Graph API access token
 * This requires OUTLOOK_CLIENT_ID, OUTLOOK_CLIENT_SECRET, and OUTLOOK_TENANT_ID env vars
 */
async function getAccessToken(): Promise<string> {
  const clientId = process.env.OUTLOOK_CLIENT_ID;
  const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
  const tenantId = process.env.OUTLOOK_TENANT_ID || 'common';

  if (!clientId || !clientSecret) {
    throw new Error('Outlook credentials not configured. Please set OUTLOOK_CLIENT_ID and OUTLOOK_CLIENT_SECRET environment variables.');
  }

  try {
    const response = await axios.post(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data.access_token;
  } catch (error: any) {
    console.error('Failed to get Outlook access token:', error.response?.data || error.message);
    throw new Error('Outlook authentication failed');
  }
}

/**
 * Search for Outlook calendar events
 */
export async function searchOutlookEvents(
  userId: string,
  params: OutlookSearchEventsParams
): Promise<any> {
  try {
    const accessToken = await getAccessToken();
    
    const queryParams = new URLSearchParams();
    if (params.startDateTime) {
      queryParams.append('startDateTime', params.startDateTime);
    }
    if (params.endDateTime) {
      queryParams.append('endDateTime', params.endDateTime);
    }
    if (params.filter) {
      queryParams.append('$filter', params.filter);
    }
    if (params.top) {
      queryParams.append('$top', params.top.toString());
    }

    const url = `https://graph.microsoft.com/v1.0/users/${userId}/calendar/events?${queryParams.toString()}`;
    
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('Failed to search Outlook events:', error.response?.data || error.message);
    throw new Error('Outlook calendar search failed');
  }
}

/**
 * Create an Outlook calendar event
 */
export async function createOutlookEvent(
  userId: string,
  event: OutlookCalendarEvent
): Promise<any> {
  try {
    const accessToken = await getAccessToken();
    
    const response = await axios.post(
      `https://graph.microsoft.com/v1.0/users/${userId}/calendar/events`,
      event,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Failed to create Outlook event:', error.response?.data || error.message);
    throw new Error('Outlook event creation failed');
  }
}

/**
 * Get a specific Outlook calendar event
 */
export async function getOutlookEvent(
  userId: string,
  eventId: string
): Promise<any> {
  try {
    const accessToken = await getAccessToken();
    
    const response = await axios.get(
      `https://graph.microsoft.com/v1.0/users/${userId}/calendar/events/${eventId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Failed to get Outlook event:', error.response?.data || error.message);
    throw new Error('Outlook event retrieval failed');
  }
}

/**
 * Update an Outlook calendar event
 */
export async function updateOutlookEvent(
  userId: string,
  eventId: string,
  updates: Partial<OutlookCalendarEvent>
): Promise<any> {
  try {
    const accessToken = await getAccessToken();
    
    const response = await axios.patch(
      `https://graph.microsoft.com/v1.0/users/${userId}/calendar/events/${eventId}`,
      updates,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Failed to update Outlook event:', error.response?.data || error.message);
    throw new Error('Outlook event update failed');
  }
}

/**
 * Delete an Outlook calendar event
 */
export async function deleteOutlookEvent(
  userId: string,
  eventId: string
): Promise<void> {
  try {
    const accessToken = await getAccessToken();
    
    await axios.delete(
      `https://graph.microsoft.com/v1.0/users/${userId}/calendar/events/${eventId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  } catch (error: any) {
    console.error('Failed to delete Outlook event:', error.response?.data || error.message);
    throw new Error('Outlook event deletion failed');
  }
}

/**
 * Check availability for a given time range in Outlook calendar
 */
export async function checkOutlookAvailability(
  userId: string,
  startTime: string,
  endTime: string
): Promise<{ available: boolean; conflictingEvents: any[] }> {
  try {
    const result = await searchOutlookEvents(userId, {
      startDateTime: startTime,
      endDateTime: endTime,
    });

    const conflictingEvents = result.value || [];

    return {
      available: conflictingEvents.length === 0,
      conflictingEvents,
    };
  } catch (error) {
    console.error('Failed to check Outlook availability:', error);
    throw new Error('Outlook availability check failed');
  }
}

/**
 * Find available time slots within a date range in Outlook calendar
 */
export async function findOutlookAvailableSlots(
  userId: string,
  startDate: Date,
  endDate: Date,
  durationMinutes: number,
  workingHoursStart: number = 9,
  workingHoursEnd: number = 17,
  timeZone: string = 'UTC'
): Promise<Array<{ start: string; end: string }>> {
  try {
    // Get all events in the date range
    const result = await searchOutlookEvents(userId, {
      startDateTime: startDate.toISOString(),
      endDateTime: endDate.toISOString(),
    });

    const busySlots = result.value || [];

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
          const eventStart = new Date(event.start?.dateTime);
          const eventEnd = new Date(event.end?.dateTime);
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
    console.error('Failed to find Outlook available slots:', error);
    throw new Error('Outlook available slots search failed');
  }
}

/**
 * Get calendar view (free/busy information) for multiple users
 * Useful for scheduling meetings with multiple attendees
 */
export async function getOutlookCalendarView(
  schedules: string[], // Array of email addresses
  startTime: string,
  endTime: string,
  availabilityViewInterval: number = 60 // Minutes
): Promise<any> {
  try {
    const accessToken = await getAccessToken();
    
    const response = await axios.post(
      'https://graph.microsoft.com/v1.0/me/calendar/getSchedule',
      {
        schedules,
        startTime: {
          dateTime: startTime,
          timeZone: 'UTC',
        },
        endTime: {
          dateTime: endTime,
          timeZone: 'UTC',
        },
        availabilityViewInterval,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Failed to get Outlook calendar view:', error.response?.data || error.message);
    throw new Error('Outlook calendar view retrieval failed');
  }
}
