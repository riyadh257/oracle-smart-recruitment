import { eq, and, desc, gte, lte, or, like, inArray } from "drizzle-orm";
import { getDb } from "./db";
import {
  communicationEvents,
  communicationSummaries,
  type CommunicationEvent,
  type InsertCommunicationEvent,
  type CommunicationSummary,
  type InsertCommunicationSummary,
} from "../drizzle/schema";

/**
 * Candidate Communication History Module
 * Provides unified timeline tracking of all candidate interactions
 */

/**
 * Log a communication event
 */
export async function logCommunicationEvent(
  data: InsertCommunicationEvent
): Promise<CommunicationEvent | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(communicationEvents).values(data);
  const eventId = result[0].insertId;

  // Update communication summary
  await updateCommunicationSummary(data.candidateId);

  const event = await db
    .select()
    .from(communicationEvents)
    .where(eq(communicationEvents.id, eventId))
    .limit(1);

  return event[0] || null;
}

/**
 * Get communication events for a candidate
 */
export async function getCandidateCommunications(
  candidateId: number,
  filters?: {
    employerId?: number;
    applicationId?: number;
    eventTypes?: Array<
      | "email_sent"
      | "email_opened"
      | "email_clicked"
      | "application_submitted"
      | "application_viewed"
      | "interview_scheduled"
      | "interview_completed"
      | "interview_cancelled"
      | "status_changed"
      | "note_added"
      | "document_uploaded"
      | "message_sent"
      | "message_received"
    >;
    startDate?: Date;
    endDate?: Date;
    searchQuery?: string;
    isRead?: boolean;
  }
): Promise<CommunicationEvent[]> {
  const db = await getDb();
  if (!db) return [];

  let conditions = [eq(communicationEvents.candidateId, candidateId)];

  if (filters?.employerId) {
    conditions.push(eq(communicationEvents.employerId, filters.employerId));
  }

  if (filters?.applicationId) {
    conditions.push(
      eq(communicationEvents.applicationId, filters.applicationId)
    );
  }

  if (filters?.eventTypes && filters.eventTypes.length > 0) {
    conditions.push(inArray(communicationEvents.eventType, filters.eventTypes));
  }

  if (filters?.startDate) {
    conditions.push(gte(communicationEvents.eventTimestamp, filters.startDate));
  }

  if (filters?.endDate) {
    conditions.push(lte(communicationEvents.eventTimestamp, filters.endDate));
  }

  if (filters?.isRead !== undefined) {
    conditions.push(eq(communicationEvents.isRead, filters.isRead));
  }

  let events = await db
    .select()
    .from(communicationEvents)
    .where(and(...conditions))
    .orderBy(desc(communicationEvents.eventTimestamp));

  // Apply search filter if provided
  if (filters?.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    events = events.filter(
      (event) =>
        event.eventTitle.toLowerCase().includes(query) ||
        event.eventDescription?.toLowerCase().includes(query)
    );
  }

  return events;
}

/**
 * Get communication events for an employer (across all candidates)
 */
export async function getEmployerCommunications(
  employerId: number,
  filters?: {
    candidateId?: number;
    applicationId?: number;
    eventTypes?: Array<string>;
    startDate?: Date;
    endDate?: Date;
    isRead?: boolean;
  }
): Promise<CommunicationEvent[]> {
  const db = await getDb();
  if (!db) return [];

  let conditions = [eq(communicationEvents.employerId, employerId)];

  if (filters?.candidateId) {
    conditions.push(eq(communicationEvents.candidateId, filters.candidateId));
  }

  if (filters?.applicationId) {
    conditions.push(
      eq(communicationEvents.applicationId, filters.applicationId)
    );
  }

  if (filters?.eventTypes && filters.eventTypes.length > 0) {
    conditions.push(
      inArray(communicationEvents.eventType, filters.eventTypes as any)
    );
  }

  if (filters?.startDate) {
    conditions.push(gte(communicationEvents.eventTimestamp, filters.startDate));
  }

  if (filters?.endDate) {
    conditions.push(lte(communicationEvents.eventTimestamp, filters.endDate));
  }

  if (filters?.isRead !== undefined) {
    conditions.push(eq(communicationEvents.isRead, filters.isRead));
  }

  return await db
    .select()
    .from(communicationEvents)
    .where(and(...conditions))
    .orderBy(desc(communicationEvents.eventTimestamp));
}

/**
 * Get a single communication event
 */
export async function getCommunicationEvent(
  eventId: number
): Promise<CommunicationEvent | null> {
  const db = await getDb();
  if (!db) return null;

  const event = await db
    .select()
    .from(communicationEvents)
    .where(eq(communicationEvents.id, eventId))
    .limit(1);

  return event[0] || null;
}

/**
 * Mark communication events as read
 */
export async function markEventsAsRead(eventIds: number[]): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .update(communicationEvents)
    .set({ isRead: true })
    .where(inArray(communicationEvents.id, eventIds));

  return true;
}

/**
 * Update communication summary for a candidate
 */
export async function updateCommunicationSummary(
  candidateId: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Get all events for this candidate
  const events = await db
    .select()
    .from(communicationEvents)
    .where(eq(communicationEvents.candidateId, candidateId));

  // Calculate metrics
  const totalEmails = events.filter((e) => e.eventType === "email_sent").length;
  const emailsOpened = events.filter((e) => e.eventType === "email_opened")
    .length;
  const emailsClicked = events.filter((e) => e.eventType === "email_clicked")
    .length;
  const totalInterviews = events.filter(
    (e) => e.eventType === "interview_scheduled"
  ).length;
  const completedInterviews = events.filter(
    (e) => e.eventType === "interview_completed"
  ).length;
  const totalApplications = events.filter(
    (e) => e.eventType === "application_submitted"
  ).length;

  // Find last contact date
  const lastContactDate =
    events.length > 0
      ? new Date(
          Math.max(...events.map((e) => e.eventTimestamp.getTime()))
        )
      : null;

  // Calculate engagement score (0-100)
  let engagementScore = 0;
  if (totalEmails > 0) {
    const emailEngagement = (emailsOpened / totalEmails) * 40; // 40% weight
    const clickEngagement = (emailsClicked / totalEmails) * 30; // 30% weight
    const interviewEngagement =
      totalInterviews > 0 ? (completedInterviews / totalInterviews) * 30 : 0; // 30% weight

    engagementScore = Math.round(
      emailEngagement + clickEngagement + interviewEngagement
    );
  }

  // Calculate response rate
  const responseRate =
    totalEmails > 0 ? Math.round((emailsOpened / totalEmails) * 100) : 0;

  // Upsert summary
  const existing = await db
    .select()
    .from(communicationSummaries)
    .where(eq(communicationSummaries.candidateId, candidateId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(communicationSummaries)
      .set({
        totalEmails,
        emailsOpened,
        emailsClicked,
        totalInterviews,
        completedInterviews,
        totalApplications,
        lastContactDate,
        engagementScore,
        responseRate,
        updatedAt: new Date(),
      })
      .where(eq(communicationSummaries.candidateId, candidateId));
  } else {
    await db.insert(communicationSummaries).values({
      candidateId,
      totalEmails,
      emailsOpened,
      emailsClicked,
      totalInterviews,
      completedInterviews,
      totalApplications,
      lastContactDate,
      engagementScore,
      responseRate,
    });
  }
}

/**
 * Get communication summary for a candidate
 */
export async function getCommunicationSummary(
  candidateId: number
): Promise<CommunicationSummary | null> {
  const db = await getDb();
  if (!db) return null;

  const summary = await db
    .select()
    .from(communicationSummaries)
    .where(eq(communicationSummaries.candidateId, candidateId))
    .limit(1);

  return summary[0] || null;
}

/**
 * Get communication summaries for multiple candidates
 */
export async function getCommunicationSummaries(
  candidateIds: number[]
): Promise<CommunicationSummary[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(communicationSummaries)
    .where(inArray(communicationSummaries.candidateId, candidateIds));
}

/**
 * Search communication events across all content
 */
export async function searchCommunications(
  searchQuery: string,
  filters?: {
    candidateId?: number;
    employerId?: number;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<CommunicationEvent[]> {
  const db = await getDb();
  if (!db) return [];

  let conditions = [];

  if (filters?.candidateId) {
    conditions.push(eq(communicationEvents.candidateId, filters.candidateId));
  }

  if (filters?.employerId) {
    conditions.push(eq(communicationEvents.employerId, filters.employerId));
  }

  if (filters?.startDate) {
    conditions.push(gte(communicationEvents.eventTimestamp, filters.startDate));
  }

  if (filters?.endDate) {
    conditions.push(lte(communicationEvents.eventTimestamp, filters.endDate));
  }

  let events = await db
    .select()
    .from(communicationEvents)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(communicationEvents.eventTimestamp));

  // Filter by search query
  const query = searchQuery.toLowerCase();
  events = events.filter(
    (event) =>
      event.eventTitle.toLowerCase().includes(query) ||
      event.eventDescription?.toLowerCase().includes(query) ||
      JSON.stringify(event.eventMetadata).toLowerCase().includes(query)
  );

  return events;
}

/**
 * Get timeline statistics for a date range
 */
export async function getTimelineStatistics(
  candidateId: number,
  startDate: Date,
  endDate: Date
): Promise<{
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByDay: Record<string, number>;
}> {
  const db = await getDb();
  if (!db) {
    return {
      totalEvents: 0,
      eventsByType: {},
      eventsByDay: {},
    };
  }

  const events = await db
    .select()
    .from(communicationEvents)
    .where(
      and(
        eq(communicationEvents.candidateId, candidateId),
        gte(communicationEvents.eventTimestamp, startDate),
        lte(communicationEvents.eventTimestamp, endDate)
      )
    );

  // Count by type
  const eventsByType: Record<string, number> = {};
  events.forEach((event) => {
    eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
  });

  // Count by day
  const eventsByDay: Record<string, number> = {};
  events.forEach((event) => {
    const day = event.eventTimestamp.toISOString().split("T")[0];
    eventsByDay[day] = (eventsByDay[day] || 0) + 1;
  });

  return {
    totalEvents: events.length,
    eventsByType,
    eventsByDay,
  };
}

/**
 * Delete old communication events (for data retention)
 */
export async function deleteOldEvents(olderThanDays: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const result = await db
    .delete(communicationEvents)
    .where(lte(communicationEvents.eventTimestamp, cutoffDate));

  return result[0].affectedRows || 0;
}
