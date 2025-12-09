import { eq, desc } from "drizzle-orm";
import { getDb } from "./db";
import {
  candidateNotificationPreferences,
  applicationStatusHistory,
  applications,
  candidates,
  type CandidateNotificationPreferences,
  type InsertCandidateNotificationPreferences,
  type ApplicationStatusHistory,
  type InsertApplicationStatusHistory,
} from "../drizzle/schema";

/**
 * Candidate Notification Preferences Database Helpers
 */

export async function getCandidateNotificationPreferences(candidateId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(candidateNotificationPreferences)
    .where(eq(candidateNotificationPreferences.candidateId, candidateId))
    .limit(1);

  return result[0] || null;
}

export async function upsertCandidateNotificationPreferences(
  data: InsertCandidateNotificationPreferences
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .insert(candidateNotificationPreferences)
    .values(data)
    .onDuplicateKeyUpdate({
      set: {
        jobAlertFrequency: data.jobAlertFrequency,
        applicationStatusUpdates: data.applicationStatusUpdates,
        interviewReminders: data.interviewReminders,
        newJobMatches: data.newJobMatches,
        companyUpdates: data.companyUpdates,
        careerTips: data.careerTips,
        quietHoursEnabled: data.quietHoursEnabled,
        quietHoursStart: data.quietHoursStart,
        quietHoursEnd: data.quietHoursEnd,
        timezone: data.timezone,
        updatedAt: new Date().toISOString(),
      },
    });

  return getCandidateNotificationPreferences(data.candidateId);
}

/**
 * Application Status History Database Helpers
 */

export async function createApplicationStatusHistory(
  data: InsertApplicationStatusHistory
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .insert(applicationStatusHistory)
    .values(data);

  return result;
}

export async function getApplicationStatusHistory(applicationId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(applicationStatusHistory)
    .where(eq(applicationStatusHistory.applicationId, applicationId))
    .orderBy(desc(applicationStatusHistory.createdAt));

  return result;
}

export async function markStatusHistoryNotificationSent(historyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(applicationStatusHistory)
    .set({ notificationSent: 1 })
    .where(eq(applicationStatusHistory.id, historyId));
}

/**
 * Get application with candidate details for notifications
 */
export async function getApplicationWithCandidate(applicationId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({
      application: applications,
      candidate: candidates,
    })
    .from(applications)
    .innerJoin(candidates, eq(applications.candidateId, candidates.id))
    .where(eq(applications.id, applicationId))
    .limit(1);

  return result[0] || null;
}

/**
 * Get pending status history notifications (not yet sent)
 */
export async function getPendingStatusNotifications() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      history: applicationStatusHistory,
      application: applications,
      candidate: candidates,
    })
    .from(applicationStatusHistory)
    .innerJoin(applications, eq(applicationStatusHistory.applicationId, applications.id))
    .innerJoin(candidates, eq(applications.candidateId, candidates.id))
    .where(eq(applicationStatusHistory.notificationSent, 0))
    .orderBy(desc(applicationStatusHistory.createdAt));

  return result;
}
