import { eq, and, gte, lte, or, desc, asc } from "drizzle-orm";
import { getDb } from "./db";
import {
  interviews,
  interviewConflicts,
  applications,
  candidates,
  jobs,
  employers,
  type Interview,
  type InsertInterview,
  type InterviewConflict,
  type InsertInterviewConflict,
} from "../drizzle/schema";

/**
 * Interview Scheduling & Conflict Detection Module
 * Provides real-time conflict detection and alternative slot suggestions
 */

/**
 * Check for scheduling conflicts for a given time slot
 */
export async function checkInterviewConflicts(
  employerId: number,
  scheduledAt: Date,
  duration: number = 60,
  excludeInterviewId?: number
): Promise<{
  hasConflict: boolean;
  conflicts: Interview[];
  conflictType?: "overlapping" | "back_to_back";
}> {
  const db = await getDb();
  if (!db) {
    return { hasConflict: false, conflicts: [] };
  }

  const endTime = new Date(scheduledAt.getTime() + duration * 60000);
  const bufferMinutes = 15; // Buffer time between interviews
  const bufferStart = new Date(scheduledAt.getTime() - bufferMinutes * 60000);
  const bufferEnd = new Date(endTime.getTime() + bufferMinutes * 60000);

  // Find overlapping interviews for this employer
  let query = db
    .select()
    .from(interviews)
    .where(
      and(
        eq(interviews.employerId, employerId),
        eq(interviews.status, "scheduled"),
        or(
          // Interview starts during this slot
          and(
            gte(interviews.scheduledAt, bufferStart),
            lte(interviews.scheduledAt, bufferEnd)
          ),
          // Interview ends during this slot
          and(
            gte(interviews.scheduledAt, bufferStart),
            lte(interviews.scheduledAt, bufferEnd)
          )
        )
      )
    );

  const conflictingInterviews = await query;

  // Filter out the current interview if we're rescheduling
  const conflicts = excludeInterviewId
    ? conflictingInterviews.filter((i) => i.id !== excludeInterviewId)
    : conflictingInterviews;

  if (conflicts.length === 0) {
    return { hasConflict: false, conflicts: [] };
  }

  // Determine conflict type
  const hasOverlap = conflicts.some((conflict) => {
    const conflictEnd = new Date(
      conflict.scheduledAt.getTime() + conflict.duration * 60000
    );
    return (
      (scheduledAt >= conflict.scheduledAt && scheduledAt < conflictEnd) ||
      (endTime > conflict.scheduledAt && endTime <= conflictEnd) ||
      (scheduledAt <= conflict.scheduledAt && endTime >= conflictEnd)
    );
  });

  return {
    hasConflict: true,
    conflicts,
    conflictType: hasOverlap ? "overlapping" : "back_to_back",
  };
}

/**
 * Generate alternative time slots when conflicts are detected
 */
export async function suggestAlternativeSlots(
  employerId: number,
  preferredDate: Date,
  duration: number = 60,
  numberOfSuggestions: number = 5
): Promise<Date[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  const suggestions: Date[] = [];
  const startOfDay = new Date(preferredDate);
  startOfDay.setHours(9, 0, 0, 0); // Start at 9 AM

  const endOfDay = new Date(preferredDate);
  endOfDay.setHours(17, 0, 0, 0); // End at 5 PM

  // Get all scheduled interviews for this employer on this day
  const dayStart = new Date(preferredDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(preferredDate);
  dayEnd.setHours(23, 59, 59, 999);

  const scheduledInterviews = await db
    .select()
    .from(interviews)
    .where(
      and(
        eq(interviews.employerId, employerId),
        eq(interviews.status, "scheduled"),
        gte(interviews.scheduledAt, dayStart),
        lte(interviews.scheduledAt, dayEnd)
      )
    )
    .orderBy(asc(interviews.scheduledAt));

  // Generate time slots every 30 minutes
  let currentSlot = new Date(startOfDay);
  while (currentSlot < endOfDay && suggestions.length < numberOfSuggestions) {
    const slotEnd = new Date(currentSlot.getTime() + duration * 60000);

    // Check if this slot conflicts with any scheduled interview
    const hasConflict = scheduledInterviews.some((interview) => {
      const interviewEnd = new Date(
        interview.scheduledAt.getTime() + interview.duration * 60000
      );
      const bufferTime = 15 * 60000; // 15 minutes buffer

      return (
        (currentSlot.getTime() >= interview.scheduledAt.getTime() - bufferTime &&
          currentSlot.getTime() < interviewEnd.getTime() + bufferTime) ||
        (slotEnd.getTime() > interview.scheduledAt.getTime() - bufferTime &&
          slotEnd.getTime() <= interviewEnd.getTime() + bufferTime)
      );
    });

    if (!hasConflict && slotEnd <= endOfDay) {
      suggestions.push(new Date(currentSlot));
    }

    // Move to next 30-minute slot
    currentSlot = new Date(currentSlot.getTime() + 30 * 60000);
  }

  // If we don't have enough suggestions for today, try the next day
  if (suggestions.length < numberOfSuggestions) {
    const nextDay = new Date(preferredDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDaySuggestions = await suggestAlternativeSlots(
      employerId,
      nextDay,
      duration,
      numberOfSuggestions - suggestions.length
    );
    suggestions.push(...nextDaySuggestions);
  }

  return suggestions.slice(0, numberOfSuggestions);
}

/**
 * Schedule a new interview with conflict detection
 */
export async function scheduleInterview(
  data: InsertInterview,
  forceSchedule: boolean = false
): Promise<{
  success: boolean;
  interview?: Interview;
  conflicts?: Interview[];
  message?: string;
}> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: "Database not available" };
  }

  // Check for conflicts first
  if (!forceSchedule) {
    const conflictCheck = await checkInterviewConflicts(
      data.employerId,
      data.scheduledAt,
      data.duration
    );

    if (conflictCheck.hasConflict) {
      return {
        success: false,
        conflicts: conflictCheck.conflicts,
        message: `Scheduling conflict detected: ${conflictCheck.conflictType}`,
      };
    }
  }

  // Schedule the interview
  const result = await db.insert(interviews).values(data);
  const interviewId = result[0].insertId;

  const newInterview = await db
    .select()
    .from(interviews)
    .where(eq(interviews.id, interviewId))
    .limit(1);

  return {
    success: true,
    interview: newInterview[0],
    message: "Interview scheduled successfully",
  };
}

/**
 * Reschedule an existing interview
 */
export async function rescheduleInterview(
  interviewId: number,
  newScheduledAt: Date,
  newDuration?: number
): Promise<{
  success: boolean;
  interview?: Interview;
  conflicts?: Interview[];
  message?: string;
}> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: "Database not available" };
  }

  // Get the existing interview
  const existing = await db
    .select()
    .from(interviews)
    .where(eq(interviews.id, interviewId))
    .limit(1);

  if (existing.length === 0) {
    return { success: false, message: "Interview not found" };
  }

  const interview = existing[0];
  const duration = newDuration || interview.duration;

  // Check for conflicts
  const conflictCheck = await checkInterviewConflicts(
    interview.employerId,
    newScheduledAt,
    duration,
    interviewId
  );

  if (conflictCheck.hasConflict) {
    return {
      success: false,
      conflicts: conflictCheck.conflicts,
      message: `Scheduling conflict detected: ${conflictCheck.conflictType}`,
    };
  }

  // Update the interview
  await db
    .update(interviews)
    .set({
      scheduledAt: newScheduledAt,
      duration,
      status: "rescheduled",
      updatedAt: new Date(),
    })
    .where(eq(interviews.id, interviewId));

  const updated = await db
    .select()
    .from(interviews)
    .where(eq(interviews.id, interviewId))
    .limit(1);

  return {
    success: true,
    interview: updated[0],
    message: "Interview rescheduled successfully",
  };
}

/**
 * Get all interviews for an employer with optional filtering
 */
export async function getEmployerInterviews(
  employerId: number,
  filters?: {
    status?: "scheduled" | "completed" | "cancelled" | "rescheduled";
    startDate?: Date;
    endDate?: Date;
    candidateId?: number;
  }
): Promise<Interview[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  let conditions = [eq(interviews.employerId, employerId)];

  if (filters?.status) {
    conditions.push(eq(interviews.status, filters.status));
  }

  if (filters?.startDate) {
    conditions.push(gte(interviews.scheduledAt, filters.startDate));
  }

  if (filters?.endDate) {
    conditions.push(lte(interviews.scheduledAt, filters.endDate));
  }

  if (filters?.candidateId) {
    conditions.push(eq(interviews.candidateId, filters.candidateId));
  }

  return await db
    .select()
    .from(interviews)
    .where(and(...conditions))
    .orderBy(desc(interviews.scheduledAt));
}

/**
 * Get interviews for a specific date range (for calendar view)
 */
export async function getInterviewsForDateRange(
  employerId: number,
  startDate: Date,
  endDate: Date
): Promise<Interview[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db
    .select()
    .from(interviews)
    .where(
      and(
        eq(interviews.employerId, employerId),
        gte(interviews.scheduledAt, startDate),
        lte(interviews.scheduledAt, endDate),
        eq(interviews.status, "scheduled")
      )
    )
    .orderBy(asc(interviews.scheduledAt));
}

/**
 * Cancel an interview
 */
export async function cancelInterview(
  interviewId: number,
  reason?: string
): Promise<{ success: boolean; message?: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: "Database not available" };
  }

  await db
    .update(interviews)
    .set({
      status: "cancelled",
      notes: reason || "Cancelled",
      updatedAt: new Date(),
    })
    .where(eq(interviews.id, interviewId));

  return { success: true, message: "Interview cancelled successfully" };
}

/**
 * Log a conflict in the database for tracking
 */
export async function logInterviewConflict(
  data: InsertInterviewConflict
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(interviewConflicts).values(data);
}

/**
 * Get candidate interviews
 */
export async function getCandidateInterviews(
  candidateId: number
): Promise<Interview[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db
    .select()
    .from(interviews)
    .where(eq(interviews.candidateId, candidateId))
    .orderBy(desc(interviews.scheduledAt));
}
