/**
 * Quiet Hours Helper
 * Utility functions for checking if current time falls within quiet hours
 */

export interface QuietHoursConfig {
  quietHoursEnabled: number;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  timezone: string | null;
}

/**
 * Check if the current time is within quiet hours for a given configuration
 * @param config Quiet hours configuration
 * @returns true if currently in quiet hours, false otherwise
 */
export function isInQuietHours(config: QuietHoursConfig): boolean {
  // If quiet hours not enabled, always allow
  if (!config.quietHoursEnabled) {
    return false;
  }

  // If start/end times not configured, allow
  if (!config.quietHoursStart || !config.quietHoursEnd) {
    return false;
  }

  const timezone = config.timezone || 'Asia/Riyadh';
  
  try {
    // Get current time in user's timezone
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    
    const currentTime = formatter.format(now);
    const [currentHour, currentMinute] = currentTime.split(':').map(Number);
    const currentMinutes = currentHour * 60 + currentMinute;

    // Parse quiet hours
    const [startHour, startMinute] = config.quietHoursStart.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;

    const [endHour, endMinute] = config.quietHoursEnd.split(':').map(Number);
    const endMinutes = endHour * 60 + endMinute;

    // Handle cases where quiet hours span midnight
    if (startMinutes > endMinutes) {
      // e.g., 22:00 to 08:00
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    } else {
      // e.g., 08:00 to 22:00 (unusual but possible)
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }
  } catch (error) {
    console.error('[Quiet Hours] Error checking quiet hours:', error);
    // On error, allow notification (fail open)
    return false;
  }
}

/**
 * Check if a notification should be sent based on quiet hours
 * @param config Quiet hours configuration
 * @returns true if notification should be sent, false if it should be delayed
 */
export function shouldSendNotification(config: QuietHoursConfig): boolean {
  return !isInQuietHours(config);
}
