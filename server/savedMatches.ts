import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./db";
import { savedMatches } from "../drizzle/schema";

export async function saveMatch(data: {
  userId: number;
  candidateId: number;
  jobId: number;
  overallScore: number;
  technicalScore: number;
  cultureFitScore: number;
  wellbeingScore: number;
  matchExplanation?: string;
  matchMetadata?: any;
  notes?: string;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(savedMatches).values({
    userId: data.userId,
    candidateId: data.candidateId,
    jobId: data.jobId,
    overallScore: data.overallScore,
    technicalScore: data.technicalScore,
    cultureFitScore: data.cultureFitScore,
    wellbeingScore: data.wellbeingScore,
    matchExplanation: data.matchExplanation,
    matchMetadata: data.matchMetadata ? JSON.stringify(data.matchMetadata) : undefined,
    notes: data.notes,
    tags: data.tags ? JSON.stringify(data.tags) : undefined,
    priority: data.priority || 'medium',
    status: 'saved',
  });

  return result;
}

export async function getSavedMatches(userId: number, filters?: {
  status?: string;
  priority?: string;
  jobId?: number;
  candidateId?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(savedMatches).where(eq(savedMatches.userId, userId));

  if (filters?.status) {
    query = query.where(and(
      eq(savedMatches.userId, userId),
      eq(savedMatches.status, filters.status as any)
    ));
  }

  if (filters?.priority) {
    query = query.where(and(
      eq(savedMatches.userId, userId),
      eq(savedMatches.priority, filters.priority as any)
    ));
  }

  if (filters?.jobId) {
    query = query.where(and(
      eq(savedMatches.userId, userId),
      eq(savedMatches.jobId, filters.jobId)
    ));
  }

  if (filters?.candidateId) {
    query = query.where(and(
      eq(savedMatches.userId, userId),
      eq(savedMatches.candidateId, filters.candidateId)
    ));
  }

  const results = await query.orderBy(desc(savedMatches.savedAt));
  
  return results.map(match => ({
    ...match,
    matchMetadata: match.matchMetadata ? JSON.parse(match.matchMetadata as string) : null,
    tags: match.tags ? JSON.parse(match.tags as string) : [],
  }));
}

export async function getSavedMatchById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;

  const [match] = await db.select().from(savedMatches).where(
    and(
      eq(savedMatches.id, id),
      eq(savedMatches.userId, userId)
    )
  ).limit(1);

  if (!match) return null;

  return {
    ...match,
    matchMetadata: match.matchMetadata ? JSON.parse(match.matchMetadata as string) : null,
    tags: match.tags ? JSON.parse(match.tags as string) : [],
  };
}

export async function updateSavedMatch(id: number, userId: number, updates: {
  notes?: string;
  tags?: string[];
  status?: 'saved' | 'contacted' | 'interviewing' | 'hired' | 'rejected' | 'archived';
  priority?: 'low' | 'medium' | 'high';
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {};
  
  if (updates.notes !== undefined) updateData.notes = updates.notes;
  if (updates.status) updateData.status = updates.status;
  if (updates.priority) updateData.priority = updates.priority;
  if (updates.tags) updateData.tags = JSON.stringify(updates.tags);

  await db.update(savedMatches)
    .set(updateData)
    .where(and(
      eq(savedMatches.id, id),
      eq(savedMatches.userId, userId)
    ));

  return true;
}

export async function unsaveMatch(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(savedMatches).where(
    and(
      eq(savedMatches.id, id),
      eq(savedMatches.userId, userId)
    )
  );

  return true;
}

export async function checkIfMatchSaved(userId: number, candidateId: number, jobId: number) {
  const db = await getDb();
  if (!db) return null;

  const [match] = await db.select().from(savedMatches).where(
    and(
      eq(savedMatches.userId, userId),
      eq(savedMatches.candidateId, candidateId),
      eq(savedMatches.jobId, jobId)
    )
  ).limit(1);

  return match || null;
}
