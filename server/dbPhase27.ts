import { eq, and, desc, inArray, gte, lte, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  matchNotificationPreferences,
  matchTimelineEvents,
  bulkComparisonActions,
  type MatchNotificationPreference,
  type InsertMatchNotificationPreference,
  type MatchTimelineEvent,
  type InsertMatchTimelineEvent,
  type BulkComparisonAction,
  type InsertBulkComparisonAction,
  candidates,
  jobs,
  interviews,
} from "../drizzle/schema";

// ============================================================================
// MATCH NOTIFICATION PREFERENCES
// ============================================================================

export async function getMatchNotificationPreferences(userId: number, jobId?: number) {
  const db = await getDb();
  if (!db) return undefined;

  const conditions = jobId 
    ? and(eq(matchNotificationPreferences.userId, userId), eq(matchNotificationPreferences.jobId, jobId))
    : and(eq(matchNotificationPreferences.userId, userId), sql`${matchNotificationPreferences.jobId} IS NULL`);

  const result = await db
    .select()
    .from(matchNotificationPreferences)
    .where(conditions)
    .limit(1);

  return result[0];
}

export async function getAllMatchNotificationPreferences(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(matchNotificationPreferences)
    .where(eq(matchNotificationPreferences.userId, userId))
    .orderBy(desc(matchNotificationPreferences.createdAt));
}

export async function upsertMatchNotificationPreferences(
  data: InsertMatchNotificationPreference
): Promise<MatchNotificationPreference | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  // Check if preference already exists
  const existing = await getMatchNotificationPreferences(data.userId, data.jobId || undefined);

  if (existing) {
    // Update existing preference
    await db
      .update(matchNotificationPreferences)
      .set(data)
      .where(eq(matchNotificationPreferences.id, existing.id));

    return { ...existing, ...data };
  } else {
    // Insert new preference
    const result = await db.insert(matchNotificationPreferences).values(data);
    return {
      id: Number(result[0].insertId),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as MatchNotificationPreference;
  }
}

export async function deleteMatchNotificationPreferences(id: number) {
  const db = await getDb();
  if (!db) return false;

  await db.delete(matchNotificationPreferences).where(eq(matchNotificationPreferences.id, id));
  return true;
}

// ============================================================================
// MATCH TIMELINE EVENTS
// ============================================================================

export async function getMatchTimeline(candidateId: number, jobId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(matchTimelineEvents)
    .where(
      and(
        eq(matchTimelineEvents.candidateId, candidateId),
        eq(matchTimelineEvents.jobId, jobId)
      )
    )
    .orderBy(desc(matchTimelineEvents.createdAt));
}

export async function getCandidateTimeline(candidateId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(matchTimelineEvents)
    .where(eq(matchTimelineEvents.candidateId, candidateId))
    .orderBy(desc(matchTimelineEvents.createdAt));
}

export async function getJobTimeline(jobId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(matchTimelineEvents)
    .where(eq(matchTimelineEvents.jobId, jobId))
    .orderBy(desc(matchTimelineEvents.createdAt));
}

export async function createMatchTimelineEvent(
  data: InsertMatchTimelineEvent
): Promise<MatchTimelineEvent> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(matchTimelineEvents).values(data);
  
  return {
    id: Number(result[0].insertId),
    ...data,
    createdAt: new Date().toISOString(),
  } as MatchTimelineEvent;
}

export async function getTimelineEventsByDateRange(
  candidateId: number,
  jobId: number,
  startDate: string,
  endDate: string
) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(matchTimelineEvents)
    .where(
      and(
        eq(matchTimelineEvents.candidateId, candidateId),
        eq(matchTimelineEvents.jobId, jobId),
        gte(matchTimelineEvents.createdAt, startDate),
        lte(matchTimelineEvents.createdAt, endDate)
      )
    )
    .orderBy(desc(matchTimelineEvents.createdAt));
}

// ============================================================================
// BULK COMPARISON ACTIONS
// ============================================================================

export async function createBulkComparisonAction(
  data: InsertBulkComparisonAction
): Promise<BulkComparisonAction> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(bulkComparisonActions).values(data);
  
  return {
    id: Number(result[0].insertId),
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as BulkComparisonAction;
}

export async function updateBulkComparisonAction(
  id: number,
  data: Partial<InsertBulkComparisonAction>
) {
  const db = await getDb();
  if (!db) return undefined;

  await db
    .update(bulkComparisonActions)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(bulkComparisonActions.id, id));

  const result = await db
    .select()
    .from(bulkComparisonActions)
    .where(eq(bulkComparisonActions.id, id))
    .limit(1);

  return result[0];
}

export async function getBulkComparisonAction(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(bulkComparisonActions)
    .where(eq(bulkComparisonActions.id, id))
    .limit(1);

  return result[0];
}

export async function getUserBulkComparisonActions(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(bulkComparisonActions)
    .where(eq(bulkComparisonActions.userId, userId))
    .orderBy(desc(bulkComparisonActions.createdAt))
    .limit(limit);
}

export async function getJobBulkComparisonActions(jobId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(bulkComparisonActions)
    .where(eq(bulkComparisonActions.jobId, jobId))
    .orderBy(desc(bulkComparisonActions.createdAt))
    .limit(limit);
}

// ============================================================================
// BULK ACTION EXECUTION HELPERS
// ============================================================================

export async function executeBulkScheduleInterviews(
  candidateIds: number[],
  jobId: number,
  scheduledDateTime: string,
  templateId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const results = {
    successful: 0,
    failed: 0,
    errors: [] as Array<{ candidateId: number; error: string }>,
  };

  for (const candidateId of candidateIds) {
    try {
      // Create interview record
      await db.insert(interviews).values({
        candidateId,
        jobId,
        scheduledAt: scheduledDateTime,
        templateId: templateId || null,
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Create timeline event
      await createMatchTimelineEvent({
        candidateId,
        jobId,
        eventType: 'interview_scheduled',
        eventDescription: `Interview scheduled for ${scheduledDateTime}`,
        metadata: { scheduledDateTime, templateId },
        createdAt: new Date().toISOString(),
      });

      results.successful++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        candidateId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

export async function executeBulkSendMessages(
  candidateIds: number[],
  jobId: number,
  messageContent: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const results = {
    successful: 0,
    failed: 0,
    errors: [] as Array<{ candidateId: number; error: string }>,
  };

  for (const candidateId of candidateIds) {
    try {
      // Create timeline event for message sent
      await createMatchTimelineEvent({
        candidateId,
        jobId,
        eventType: 'message_sent',
        eventDescription: 'Message sent to candidate',
        metadata: { messageContent, sentAt: new Date().toISOString() },
        createdAt: new Date().toISOString(),
      });

      // TODO: Integrate with actual messaging system (email/SMS)
      // For now, we just log the event

      results.successful++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        candidateId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

export async function executeBulkChangeStatus(
  candidateIds: number[],
  jobId: number,
  newStatus: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const results = {
    successful: 0,
    failed: 0,
    errors: [] as Array<{ candidateId: number; error: string }>,
  };

  for (const candidateId of candidateIds) {
    try {
      // Update candidate status (assuming status is on candidates table)
      await db
        .update(candidates)
        .set({ 
          status: newStatus as any,
          updatedAt: new Date().toISOString() 
        })
        .where(eq(candidates.id, candidateId));

      // Create timeline event
      await createMatchTimelineEvent({
        candidateId,
        jobId,
        eventType: 'status_changed',
        eventDescription: `Status changed to ${newStatus}`,
        metadata: { newStatus, changedAt: new Date().toISOString() },
        createdAt: new Date().toISOString(),
      });

      results.successful++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        candidateId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}
