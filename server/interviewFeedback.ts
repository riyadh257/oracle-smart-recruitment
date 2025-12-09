import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./db";
import {
  interviewFeedback,
  feedbackTemplates,
  type InsertInterviewFeedback,
  type InsertFeedbackTemplate,
  type InterviewFeedback,
  type FeedbackTemplate,
} from "../drizzle/schema";

/**
 * Create interview feedback
 */
export async function createInterviewFeedback(
  data: InsertInterviewFeedback
): Promise<InterviewFeedback | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(interviewFeedback).values(data);
    const feedbackId = result[0].insertId;

    const feedback = await db
      .select()
      .from(interviewFeedback)
      .where(eq(interviewFeedback.id, feedbackId))
      .limit(1);

    return feedback[0] || null;
  } catch (error) {
    console.error("[InterviewFeedback] Failed to create feedback:", error);
    return null;
  }
}

/**
 * Get feedback for an interview
 */
export async function getInterviewFeedback(
  interviewId: number
): Promise<InterviewFeedback[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(interviewFeedback)
      .where(eq(interviewFeedback.interviewId, interviewId))
      .orderBy(desc(interviewFeedback.submittedAt));
  } catch (error) {
    console.error("[InterviewFeedback] Failed to get feedback:", error);
    return [];
  }
}

/**
 * Get all feedback for a candidate
 */
export async function getCandidateFeedback(
  candidateId: number
): Promise<InterviewFeedback[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(interviewFeedback)
      .where(eq(interviewFeedback.candidateId, candidateId))
      .orderBy(desc(interviewFeedback.submittedAt));
  } catch (error) {
    console.error("[InterviewFeedback] Failed to get candidate feedback:", error);
    return [];
  }
}

/**
 * Get feedback by ID
 */
export async function getFeedbackById(
  feedbackId: number
): Promise<InterviewFeedback | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(interviewFeedback)
      .where(eq(interviewFeedback.id, feedbackId))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("[InterviewFeedback] Failed to get feedback by ID:", error);
    return null;
  }
}

/**
 * Update interview feedback
 */
export async function updateInterviewFeedback(
  feedbackId: number,
  data: Partial<InsertInterviewFeedback>
): Promise<InterviewFeedback | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    await db
      .update(interviewFeedback)
      .set(data)
      .where(eq(interviewFeedback.id, feedbackId));

    return await getFeedbackById(feedbackId);
  } catch (error) {
    console.error("[InterviewFeedback] Failed to update feedback:", error);
    return null;
  }
}

/**
 * Delete interview feedback
 */
export async function deleteInterviewFeedback(
  feedbackId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .delete(interviewFeedback)
      .where(eq(interviewFeedback.id, feedbackId));
    return true;
  } catch (error) {
    console.error("[InterviewFeedback] Failed to delete feedback:", error);
    return false;
  }
}

// ============================================================================
// Feedback Templates
// ============================================================================

/**
 * Create feedback template
 */
export async function createFeedbackTemplate(
  data: InsertFeedbackTemplate
): Promise<FeedbackTemplate | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(feedbackTemplates).values(data);
    const templateId = result[0].insertId;

    const template = await db
      .select()
      .from(feedbackTemplates)
      .where(eq(feedbackTemplates.id, templateId))
      .limit(1);

    return template[0] || null;
  } catch (error) {
    console.error("[FeedbackTemplate] Failed to create template:", error);
    return null;
  }
}

/**
 * Get all templates for an employer
 */
export async function getEmployerFeedbackTemplates(
  employerId: number
): Promise<FeedbackTemplate[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(feedbackTemplates)
      .where(
        and(
          eq(feedbackTemplates.employerId, employerId),
          eq(feedbackTemplates.isActive, 1)
        )
      )
      .orderBy(desc(feedbackTemplates.isDefault), desc(feedbackTemplates.createdAt));
  } catch (error) {
    console.error("[FeedbackTemplate] Failed to get templates:", error);
    return [];
  }
}

/**
 * Get template by ID
 */
export async function getFeedbackTemplateById(
  templateId: number
): Promise<FeedbackTemplate | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(feedbackTemplates)
      .where(eq(feedbackTemplates.id, templateId))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("[FeedbackTemplate] Failed to get template by ID:", error);
    return null;
  }
}

/**
 * Update feedback template
 */
export async function updateFeedbackTemplate(
  templateId: number,
  data: Partial<InsertFeedbackTemplate>
): Promise<FeedbackTemplate | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    await db
      .update(feedbackTemplates)
      .set(data)
      .where(eq(feedbackTemplates.id, templateId));

    return await getFeedbackTemplateById(templateId);
  } catch (error) {
    console.error("[FeedbackTemplate] Failed to update template:", error);
    return null;
  }
}

/**
 * Delete feedback template
 */
export async function deleteFeedbackTemplate(
  templateId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .delete(feedbackTemplates)
      .where(eq(feedbackTemplates.id, templateId));
    return true;
  } catch (error) {
    console.error("[FeedbackTemplate] Failed to delete template:", error);
    return false;
  }
}
