import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

interface SuggestedSlot {
  start: string;
  end: string;
  duration: number;
}

/**
 * Fetch busy times from Google Calendar using MCP
 */
async function fetchBusyTimes(startDate: Date, endDate: Date): Promise<{ start: Date; end: Date }[]> {
  try {
    const timeMin = startDate.toISOString();
    const timeMax = endDate.toISOString();

    const command = `manus-mcp-cli tool call google_calendar_search_events --server google-calendar --input '${JSON.stringify({
      calendar_id: "primary",
      time_min: timeMin,
      time_max: timeMax,
      max_results: 250,
    })}'`;

    const { stdout } = await execAsync(command);
    const response = JSON.parse(stdout);

    if (!response.content || response.content.length === 0) {
      return [];
    }

    const events = JSON.parse(response.content[0].text);
    const busyTimes: { start: Date; end: Date }[] = [];

    for (const event of events.items || []) {
      if (event.start && event.end) {
        const start = event.start.dateTime ? new Date(event.start.dateTime) : new Date(event.start.date);
        const end = event.end.dateTime ? new Date(event.end.dateTime) : new Date(event.end.date);
        busyTimes.push({ start, end });
      }
    }

    return busyTimes;
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return [];
  }
}

/**
 * Check if a time slot overlaps with any busy times
 */
function isSlotAvailable(
  slotStart: Date,
  slotEnd: Date,
  busyTimes: { start: Date; end: Date }[]
): boolean {
  for (const busy of busyTimes) {
    // Check for overlap
    if (slotStart < busy.end && slotEnd > busy.start) {
      return false;
    }
  }
  return true;
}

/**
 * Generate time slots for a given day
 */
function generateDaySlots(
  date: Date,
  startHour: number,
  endHour: number,
  slotDuration: number
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const currentDate = new Date(date);
  currentDate.setHours(startHour, 0, 0, 0);

  const endTime = new Date(date);
  endTime.setHours(endHour, 0, 0, 0);

  while (currentDate < endTime) {
    const slotEnd = new Date(currentDate);
    slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

    if (slotEnd <= endTime) {
      slots.push({
        start: new Date(currentDate),
        end: slotEnd,
        available: true, // Will be updated based on calendar
      });
    }

    currentDate.setMinutes(currentDate.getMinutes() + slotDuration);
  }

  return slots;
}

/**
 * Auto-suggest interview slots based on Google Calendar availability
 * @param durationMinutes - Duration of the interview in minutes
 * @param daysAhead - Number of days to look ahead (default: 7)
 * @param workingHoursStart - Start of working hours (default: 9)
 * @param workingHoursEnd - End of working hours (default: 17)
 * @param maxSuggestions - Maximum number of suggestions to return (default: 5)
 */
export async function suggestInterviewSlots(
  durationMinutes: number = 60,
  daysAhead: number = 7,
  workingHoursStart: number = 9,
  workingHoursEnd: number = 17,
  maxSuggestions: number = 5
): Promise<SuggestedSlot[]> {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + daysAhead);

  // Fetch busy times from calendar
  const busyTimes = await fetchBusyTimes(startDate, endDate);

  const suggestions: SuggestedSlot[] = [];
  let currentDay = new Date(startDate);

  // Generate slots for each day
  while (currentDay < endDate && suggestions.length < maxSuggestions) {
    // Skip weekends
    const dayOfWeek = currentDay.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      currentDay.setDate(currentDay.getDate() + 1);
      continue;
    }

    // Skip past times on the current day
    let effectiveStartHour = workingHoursStart;
    if (currentDay.toDateString() === now.toDateString()) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      if (currentHour >= workingHoursStart) {
        effectiveStartHour = currentHour + (currentMinute > 0 ? 1 : 0);
      }
    }

    // Generate slots for this day
    const daySlots = generateDaySlots(currentDay, effectiveStartHour, workingHoursEnd, durationMinutes);

    // Check availability for each slot
    for (const slot of daySlots) {
      if (suggestions.length >= maxSuggestions) break;

      if (isSlotAvailable(slot.start, slot.end, busyTimes)) {
        suggestions.push({
          start: slot.start.toISOString(),
          end: slot.end.toISOString(),
          duration: durationMinutes,
        });
      }
    }

    currentDay.setDate(currentDay.getDate() + 1);
  }

  return suggestions;
}

/**
 * Check if a specific time slot is available
 */
export async function checkSlotAvailability(
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  const busyTimes = await fetchBusyTimes(
    new Date(startTime.getTime() - 24 * 60 * 60 * 1000), // 1 day before
    new Date(endTime.getTime() + 24 * 60 * 60 * 1000) // 1 day after
  );

  return isSlotAvailable(startTime, endTime, busyTimes);
}
