/**
 * Quiet Hours Service Module
 * Handles timezone-aware quiet hours scheduling and validation
 */

import { getDb } from "./db";
import { userNotificationPreferences, quietHoursSchedule, notificationQueue } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

export interface QuietHoursConfig {
  enabled: boolean;
  timezone: string;
  start: string; // HH:MM format
  end: string; // HH:MM format
  days?: string[]; // Array of day names
}

export interface QuietHoursScheduleEntry {
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string;
  endTime: string;
  timezone: string;
  isActive: boolean;
}

/**
 * Get user's quiet hours configuration
 */
export async function getUserQuietHours(userId: number): Promise<QuietHoursConfig | null> {
  const db = await getDb();
  if (!db) return null;

  const [prefs] = await db
    .select()
    .from(userNotificationPreferences)
    .where(eq(userNotificationPreferences.userId, userId))
    .limit(1);

  if (!prefs || !prefs.quietHoursEnabled) {
    return null;
  }

  return {
    enabled: Boolean(prefs.quietHoursEnabled),
    timezone: prefs.quietHoursTimezone || 'UTC',
    start: prefs.quietHoursStart || '22:00',
    end: prefs.quietHoursEnd || '08:00',
    days: prefs.quietHoursDays ? JSON.parse(prefs.quietHoursDays as string) : undefined,
  };
}

/**
 * Get user's day-specific quiet hours schedules
 */
export async function getUserQuietHoursSchedules(userId: number): Promise<QuietHoursScheduleEntry[]> {
  const db = await getDb();
  if (!db) return [];

  const schedules = await db
    .select()
    .from(quietHoursSchedule)
    .where(and(
      eq(quietHoursSchedule.userId, userId),
      eq(quietHoursSchedule.isActive, 1)
    ));

  return schedules.map(s => ({
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
    timezone: s.timezone,
    isActive: Boolean(s.isActive),
  }));
}

/**
 * Convert time string to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Get current time in user's timezone as minutes since midnight
 */
function getCurrentTimeInTimezone(timezone: string): { minutes: number; dayOfWeek: string } {
  const now = new Date();
  
  // Convert to user's timezone
  const userTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  
  const hours = userTime.getHours();
  const minutes = userTime.getMinutes();
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][userTime.getDay()];
  
  return {
    minutes: hours * 60 + minutes,
    dayOfWeek,
  };
}

/**
 * Check if current time is within quiet hours range
 */
function isTimeInRange(currentMinutes: number, startMinutes: number, endMinutes: number): boolean {
  // Handle overnight ranges (e.g., 22:00 to 08:00)
  if (endMinutes < startMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
  
  // Handle same-day ranges (e.g., 13:00 to 17:00)
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Check if notification should be sent now or queued
 */
export async function shouldQueueNotification(userId: number): Promise<{
  shouldQueue: boolean;
  reason?: string;
  nextAvailableTime?: Date;
}> {
  const db = await getDb();
  if (!db) {
    return { shouldQueue: false };
  }

  // Get user's quiet hours configuration
  const config = await getUserQuietHours(userId);
  if (!config || !config.enabled) {
    return { shouldQueue: false };
  }

  // Get current time in user's timezone
  const { minutes: currentMinutes, dayOfWeek } = getCurrentTimeInTimezone(config.timezone);

  // Check if specific day has custom quiet hours
  const daySchedules = await getUserQuietHoursSchedules(userId);
  const todaySchedule = daySchedules.find(s => s.dayOfWeek === dayOfWeek);

  let startMinutes: number;
  let endMinutes: number;

  if (todaySchedule) {
    // Use day-specific schedule
    startMinutes = timeToMinutes(todaySchedule.startTime);
    endMinutes = timeToMinutes(todaySchedule.endTime);
  } else {
    // Use default schedule
    startMinutes = timeToMinutes(config.start);
    endMinutes = timeToMinutes(config.end);
    
    // Check if today is in the allowed days (if specified)
    if (config.days && config.days.length > 0) {
      if (!config.days.includes(dayOfWeek)) {
        return { shouldQueue: false };
      }
    }
  }

  // Check if current time is in quiet hours
  const inQuietHours = isTimeInRange(currentMinutes, startMinutes, endMinutes);

  if (!inQuietHours) {
    return { shouldQueue: false };
  }

  // Calculate next available time
  const now = new Date();
  const userNow = new Date(now.toLocaleString('en-US', { timeZone: config.timezone }));
  
  let nextAvailable = new Date(userNow);
  
  // If overnight range and we're before midnight
  if (endMinutes < startMinutes && currentMinutes >= startMinutes) {
    // Next available is tomorrow at end time
    nextAvailable.setDate(nextAvailable.getDate() + 1);
    nextAvailable.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);
  } else {
    // Next available is today at end time
    nextAvailable.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);
  }

  return {
    shouldQueue: true,
    reason: `User is in quiet hours (${config.start} - ${config.end} ${config.timezone})`,
    nextAvailableTime: nextAvailable,
  };
}

/**
 * Queue notification for later delivery
 */
export async function queueNotification(
  userId: number,
  type: 'interview_reminder' | 'feedback_request' | 'candidate_response' | 'engagement_alert' | 'ab_test_result' | 'system_update' | 'general',
  title: string,
  message: string,
  deliveryMethod: 'push' | 'email' | 'sms' | 'push_email' | 'push_sms' | 'email_sms' | 'all',
  options?: {
    actionUrl?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    scheduledFor?: Date;
    metadata?: any;
  }
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Determine scheduled time
  let scheduledFor = options?.scheduledFor;
  if (!scheduledFor) {
    const queueCheck = await shouldQueueNotification(userId);
    scheduledFor = queueCheck.nextAvailableTime || new Date();
  }

  const [result] = await db.insert(notificationQueue).values({
    userId,
    type,
    title,
    message,
    actionUrl: options?.actionUrl || null,
    priority: options?.priority || 'medium',
    deliveryMethod,
    scheduledFor: scheduledFor.toISOString(),
    status: 'queued',
    attempts: 0,
    metadata: options?.metadata ? JSON.stringify(options.metadata) : null,
  });

  return result.insertId;
}

/**
 * Process queued notifications (called by scheduled job)
 */
export async function processQueuedNotifications(): Promise<{
  processed: number;
  failed: number;
}> {
  const db = await getDb();
  if (!db) return { processed: 0, failed: 0 };

  const now = new Date();

  // Get notifications that are ready to be sent
  const readyNotifications = await db
    .select()
    .from(notificationQueue)
    .where(and(
      eq(notificationQueue.status, 'queued'),
      // scheduledFor <= now (using string comparison since timestamps are strings)
    ))
    .limit(100); // Process in batches

  let processed = 0;
  let failed = 0;

  for (const notification of readyNotifications) {
    try {
      // Check if user is still in quiet hours
      const queueCheck = await shouldQueueNotification(notification.userId);
      
      if (queueCheck.shouldQueue) {
        // Still in quiet hours, reschedule
        await db
          .update(notificationQueue)
          .set({
            scheduledFor: queueCheck.nextAvailableTime!.toISOString(),
            attempts: notification.attempts + 1,
            lastAttemptAt: now.toISOString(),
          })
          .where(eq(notificationQueue.id, notification.id));
        continue;
      }

      // Send notification (this would call the actual notification service)
      // For now, just mark as sent
      await db
        .update(notificationQueue)
        .set({
          status: 'sent',
          lastAttemptAt: now.toISOString(),
        })
        .where(eq(notificationQueue.id, notification.id));

      processed++;
    } catch (error) {
      // Mark as failed
      await db
        .update(notificationQueue)
        .set({
          status: 'failed',
          attempts: notification.attempts + 1,
          lastAttemptAt: now.toISOString(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        })
        .where(eq(notificationQueue.id, notification.id));

      failed++;
    }
  }

  return { processed, failed };
}

/**
 * Cancel queued notification
 */
export async function cancelQueuedNotification(notificationId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .update(notificationQueue)
    .set({
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    })
    .where(eq(notificationQueue.id, notificationId));

  return true;
}

/**
 * Get queued notifications for user
 */
export async function getUserQueuedNotifications(userId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(notificationQueue)
    .where(and(
      eq(notificationQueue.userId, userId),
      eq(notificationQueue.status, 'queued')
    ))
    .orderBy(notificationQueue.scheduledFor);
}
