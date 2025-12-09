/**
 * Bulk Interview Scheduling Module
 * Handles bulk scheduling operations with conflict detection and resolution
 */

import { getDb } from "./db";
import {
  bulkSchedulingOperations,
  candidateAvailability,
  interviews,
  interviewConflicts,
  schedulingConflictResolutions,
  applications,
  candidates,
  jobs,
  type BulkSchedulingOperation,
  type InsertBulkSchedulingOperation,
  type CandidateAvailability,
  type InsertCandidateAvailability,
  type Interview,
  type InsertInterview,
  type InterviewConflict,
  type InsertInterviewConflict,
  type SchedulingConflictResolution,
  type InsertSchedulingConflictResolution,
} from "../drizzle/schema";
import { eq, and, gte, lte, between, inArray, or } from "drizzle-orm";

/**
 * Create a new bulk scheduling operation
 */
export async function createBulkSchedulingOperation(
  data: InsertBulkSchedulingOperation
): Promise<BulkSchedulingOperation> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(bulkSchedulingOperations).values(data);
  const [operation] = await db
    .select()
    .from(bulkSchedulingOperations)
    .where(eq(bulkSchedulingOperations.id, Number(result[0].insertId)));

  return operation;
}

/**
 * Get bulk scheduling operation by ID
 */
export async function getBulkSchedulingOperation(
  operationId: number
): Promise<BulkSchedulingOperation | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [operation] = await db
    .select()
    .from(bulkSchedulingOperations)
    .where(eq(bulkSchedulingOperations.id, operationId));

  return operation;
}

/**
 * Update bulk scheduling operation status
 */
export async function updateBulkSchedulingOperation(
  operationId: number,
  data: Partial<BulkSchedulingOperation>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(bulkSchedulingOperations)
    .set(data)
    .where(eq(bulkSchedulingOperations.id, operationId));
}

/**
 * Get candidate availability by candidate ID
 */
export async function getCandidateAvailability(
  candidateId: number
): Promise<CandidateAvailability[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(candidateAvailability)
    .where(
      and(
        eq(candidateAvailability.candidateId, candidateId),
        eq(candidateAvailability.isActive, 1)
      )
    );
}

/**
 * Set candidate availability
 */
export async function setCandidateAvailability(
  data: InsertCandidateAvailability
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(candidateAvailability).values(data);
}

/**
 * Update candidate availability
 */
export async function updateCandidateAvailability(
  availabilityId: number,
  data: Partial<CandidateAvailability>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(candidateAvailability)
    .set(data)
    .where(eq(candidateAvailability.id, availabilityId));
}

/**
 * Delete candidate availability
 */
export async function deleteCandidateAvailability(
  availabilityId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(candidateAvailability)
    .where(eq(candidateAvailability.id, availabilityId));
}

/**
 * Check for interview conflicts for a specific time slot
 */
export async function checkInterviewConflicts(
  employerId: number,
  scheduledAt: Date,
  duration: number
): Promise<Interview[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const endTime = new Date(scheduledAt.getTime() + duration * 60000);

  // Find overlapping interviews
  const conflictingInterviews = await db
    .select()
    .from(interviews)
    .where(
      and(
        eq(interviews.employerId, employerId),
        eq(interviews.status, "scheduled"),
        or(
          // New interview starts during existing interview
          and(
            gte(interviews.scheduledAt, scheduledAt),
            lte(interviews.scheduledAt, endTime)
          ),
          // New interview ends during existing interview
          and(
            gte(
              interviews.scheduledAt,
              new Date(scheduledAt.getTime() - 60 * 60000)
            ), // Check 1 hour before
            lte(interviews.scheduledAt, scheduledAt)
          )
        )
      )
    );

  return conflictingInterviews;
}

/**
 * Create interview conflict record
 */
export async function createInterviewConflict(
  data: InsertInterviewConflict
): Promise<InterviewConflict> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(interviewConflicts).values(data);
  const [conflict] = await db
    .select()
    .from(interviewConflicts)
    .where(eq(interviewConflicts.id, Number(result[0].insertId)));

  return conflict;
}

/**
 * Get unresolved conflicts for an employer
 */
export async function getUnresolvedConflicts(
  employerId: number
): Promise<InterviewConflict[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(interviewConflicts)
    .where(
      and(
        eq(interviewConflicts.employerId, employerId),
        eq(interviewConflicts.resolved, 0)
      )
    );
}

/**
 * Resolve interview conflict
 */
export async function resolveInterviewConflict(
  conflictId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(interviewConflicts)
    .set({ resolved: true, resolvedAt: new Date() })
    .where(eq(interviewConflicts.id, conflictId));
}

/**
 * Create conflict resolution suggestion
 */
export async function createConflictResolution(
  data: InsertSchedulingConflictResolution
): Promise<SchedulingConflictResolution> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(schedulingConflictResolutions).values(data);
  const [resolution] = await db
    .select()
    .from(schedulingConflictResolutions)
    .where(eq(schedulingConflictResolutions.id, Number(result[0].insertId)));

  return resolution;
}

/**
 * Get conflict resolutions for a conflict
 */
export async function getConflictResolutions(
  conflictId: number
): Promise<SchedulingConflictResolution[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(schedulingConflictResolutions)
    .where(eq(schedulingConflictResolutions.conflictId, conflictId))
    .orderBy(schedulingConflictResolutions.priority);
}

/**
 * Apply conflict resolution
 */
export async function applyConflictResolution(
  resolutionId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(schedulingConflictResolutions)
    .set({ applied: true })
    .where(eq(schedulingConflictResolutions.id, resolutionId));
}

/**
 * Find available time slots for a candidate
 */
export async function findAvailableTimeSlots(
  candidateId: number,
  employerId: number,
  duration: number,
  startDate: Date,
  endDate: Date
): Promise<Date[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get candidate availability
  const availability = await getCandidateAvailability(candidateId);

  if (availability.length === 0) {
    // No availability set, return empty array
    return [];
  }

  // Get existing interviews for the candidate
  const existingInterviews = await db
    .select()
    .from(interviews)
    .where(
      and(
        eq(interviews.candidateId, candidateId),
        eq(interviews.status, "scheduled"),
        gte(interviews.scheduledAt, startDate),
        lte(interviews.scheduledAt, endDate)
      )
    );

  // Generate potential time slots based on availability
  const timeSlots: Date[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();

    // Check if candidate is available on this day
    const dayAvailability = availability.filter(
      (a) => a.dayOfWeek === dayOfWeek
    );

    for (const avail of dayAvailability) {
      const [startHour, startMinute] = avail.startTime.split(":").map(Number);
      const [endHour, endMinute] = avail.endTime.split(":").map(Number);

      // Generate hourly slots within availability window
      for (let hour = startHour; hour < endHour; hour++) {
        const slotTime = new Date(currentDate);
        slotTime.setHours(hour, 0, 0, 0);

        // Check if slot conflicts with existing interviews
        const hasConflict = existingInterviews.some((interview) => {
          const interviewEnd = new Date(
            interview.scheduledAt.getTime() + interview.duration * 60000
          );
          const slotEnd = new Date(slotTime.getTime() + duration * 60000);

          return (
            (slotTime >= interview.scheduledAt && slotTime < interviewEnd) ||
            (slotEnd > interview.scheduledAt && slotEnd <= interviewEnd) ||
            (slotTime <= interview.scheduledAt && slotEnd >= interviewEnd)
          );
        });

        if (!hasConflict) {
          timeSlots.push(new Date(slotTime));
        }
      }
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return timeSlots;
}

/**
 * Bulk schedule interviews for multiple candidates
 */
export async function bulkScheduleInterviews(
  operationId: number,
  employerId: number,
  candidateIds: number[],
  jobId: number,
  schedulingRules: {
    preferredDays?: string[];
    preferredTimeSlots?: { start: string; end: string }[];
    duration?: number;
    bufferMinutes?: number;
    maxPerDay?: number;
  }
): Promise<{
  scheduled: Interview[];
  conflicts: InterviewConflict[];
  failed: { candidateId: number; reason: string }[];
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const scheduled: Interview[] = [];
  const conflicts: InterviewConflict[] = [];
  const failed: { candidateId: number; reason: string }[] = [];

  const duration = schedulingRules.duration || 60;
  const bufferMinutes = schedulingRules.bufferMinutes || 15;
  const maxPerDay = schedulingRules.maxPerDay || 10;

  // Get applications for these candidates
  const apps = await db
    .select()
    .from(applications)
    .where(
      and(
        inArray(applications.candidateId, candidateIds),
        eq(applications.jobId, jobId)
      )
    );

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30); // Look 30 days ahead

  for (const app of apps) {
    try {
      // Find available time slots for this candidate
      const availableSlots = await findAvailableTimeSlots(
        app.candidateId,
        employerId,
        duration,
        startDate,
        endDate
      );

      if (availableSlots.length === 0) {
        failed.push({
          candidateId: app.candidateId,
          reason: "No available time slots found",
        });
        continue;
      }

      // Try to schedule in the first available slot
      let scheduled_slot = false;
      for (const slot of availableSlots) {
        // Check for conflicts with employer's existing interviews
        const employerConflicts = await checkInterviewConflicts(
          employerId,
          slot,
          duration
        );

        if (employerConflicts.length === 0) {
          // No conflicts, schedule the interview
          const interviewData: InsertInterview = {
            applicationId: app.id,
            employerId: employerId,
            candidateId: app.candidateId,
            jobId: jobId,
            scheduledAt: slot,
            duration: duration,
            interviewType: "video",
            status: "scheduled",
            reminderSent: false,
          };

          const result = await db.insert(interviews).values(interviewData);
          const [interview] = await db
            .select()
            .from(interviews)
            .where(eq(interviews.id, Number(result[0].insertId)));

          scheduled.push(interview);
          scheduled_slot = true;
          break;
        }
      }

      if (!scheduled_slot) {
        failed.push({
          candidateId: app.candidateId,
          reason: "All available slots have conflicts",
        });
      }
    } catch (error) {
      failed.push({
        candidateId: app.candidateId,
        reason: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Update operation status
  await updateBulkSchedulingOperation(operationId, {
    scheduledCount: scheduled.length,
    conflictCount: conflicts.length,
    failedCount: failed.length,
    status: "completed",
    completedAt: new Date(),
  });

  return { scheduled, conflicts, failed };
}
