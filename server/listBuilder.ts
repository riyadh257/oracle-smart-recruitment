import { getDb } from "./db";
import { candidateLists, listMembers, candidates, candidateAttributes } from "../drizzle/schema";
import { eq, and, gte, lte, inArray, sql } from "drizzle-orm";

/**
 * List Builder Service
 * Handles dynamic candidate list creation and segmentation
 */

export interface SegmentationRules {
  skills?: string[];
  minExperience?: number;
  maxExperience?: number;
  locations?: string[];
  minMatchScore?: number;
  engagementLevel?: string;
  industries?: string[];
  workSetting?: string[];
  salaryRange?: { min?: number; max?: number };
  customAttributes?: Record<string, any>;
}

export interface ListPreviewStats {
  estimatedCount: number;
  topSkills: Array<{ skill: string; count: number }>;
  averageExperience: number;
  locationDistribution: Array<{ location: string; count: number }>;
  matchScoreDistribution: {
    high: number; // 80-100
    medium: number; // 50-79
    low: number; // 0-49
  };
}

/**
 * Preview list statistics based on segmentation rules
 */
export async function previewListStatistics(
  employerId: number,
  rules: SegmentationRules
): Promise<ListPreviewStats> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Build WHERE conditions based on rules
  const conditions: any[] = [];

  // Experience filter
  if (rules.minExperience !== undefined) {
    conditions.push(gte(candidates.yearsOfExperience, rules.minExperience));
  }
  if (rules.maxExperience !== undefined) {
    conditions.push(lte(candidates.yearsOfExperience, rules.maxExperience));
  }

  // Location filter
  if (rules.locations && rules.locations.length > 0) {
    conditions.push(inArray(candidates.location, rules.locations));
  }

  // Work setting filter
  if (rules.workSetting && rules.workSetting.length > 0) {
    conditions.push(inArray(candidates.preferredWorkSetting, rules.workSetting as any));
  }

  // Salary range filter
  if (rules.salaryRange?.min !== undefined) {
    conditions.push(gte(candidates.desiredSalaryMin, rules.salaryRange.min));
  }
  if (rules.salaryRange?.max !== undefined) {
    conditions.push(lte(candidates.desiredSalaryMax, rules.salaryRange.max));
  }

  // Get matching candidates
  const matchingCandidates = await db
    .select()
    .from(candidates)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // Apply additional filtering for skills and other JSON fields
  let filteredCandidates = matchingCandidates;

  if (rules.skills && rules.skills.length > 0) {
    filteredCandidates = filteredCandidates.filter((candidate: any) => {
      const candidateSkills = candidate.technicalSkills || [];
      return rules.skills!.some((skill: any) => 
        candidateSkills.some((cs: any) => cs.toLowerCase().includes(skill.toLowerCase()))
      );
    });
  }

  // Calculate statistics
  const estimatedCount = filteredCandidates.length;

  // Top skills
  const skillsMap = new Map<string, number>();
  filteredCandidates.forEach((candidate: any) => {
    (candidate.technicalSkills || []).forEach((skill: any) => {
      skillsMap.set(skill, (skillsMap.get(skill) || 0) + 1);
    });
  });
  const topSkills = Array.from(skillsMap.entries())
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Average experience
  const totalExperience = filteredCandidates.reduce(
    (sum, c) => sum + (c.yearsOfExperience || 0),
    0
  );
  const averageExperience = estimatedCount > 0 ? Math.round(totalExperience / estimatedCount) : 0;

  // Location distribution
  const locationMap = new Map<string, number>();
  filteredCandidates.forEach((candidate: any) => {
    if (candidate.location) {
      locationMap.set(candidate.location, (locationMap.get(candidate.location) || 0) + 1);
    }
  });
  const locationDistribution = Array.from(locationMap.entries())
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Match score distribution (placeholder - would need actual match scores)
  const matchScoreDistribution = {
    high: Math.floor(estimatedCount * 0.3),
    medium: Math.floor(estimatedCount * 0.5),
    low: Math.floor(estimatedCount * 0.2),
  };

  return {
    estimatedCount,
    topSkills,
    averageExperience,
    locationDistribution,
    matchScoreDistribution,
  };
}

/**
 * Create a new candidate list with segmentation rules
 */
export async function createCandidateList(
  employerId: number,
  listName: string,
  description: string | undefined,
  rules: SegmentationRules,
  listType: "static" | "dynamic" = "dynamic"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get preview to calculate initial count
  const preview = await previewListStatistics(employerId, rules);

  // Create the list
  const [newList] = await db.insert(candidateLists).values({
    employerId,
    listName,
    description,
    segmentationRules: rules,
    candidateCount: preview.estimatedCount,
    listType,
    isAutoRefresh: listType === "dynamic",
  });

  // If static list, populate members immediately
  if (listType === "static") {
    await refreshListMembers(newList.insertId);
  }

  return newList.insertId;
}

/**
 * Refresh list members based on segmentation rules
 */
export async function refreshListMembers(listId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get list configuration
  const [list] = await db
    .select()
    .from(candidateLists)
    .where(eq(candidateLists.id, listId));

  if (!list) throw new Error("List not found");

  // Clear existing members
  await db.delete(listMembers).where(eq(listMembers.listId, listId));

  // Get matching candidates using the same logic as preview
  const rules = list.segmentationRules;
  const conditions: any[] = [];

  if (rules.minExperience !== undefined) {
    conditions.push(gte(candidates.yearsOfExperience, rules.minExperience));
  }
  if (rules.maxExperience !== undefined) {
    conditions.push(lte(candidates.yearsOfExperience, rules.maxExperience));
  }
  if (rules.locations && rules.locations.length > 0) {
    conditions.push(inArray(candidates.location, rules.locations));
  }
  if (rules.workSetting && rules.workSetting.length > 0) {
    conditions.push(inArray(candidates.preferredWorkSetting, rules.workSetting as any));
  }
  if (rules.salaryRange?.min !== undefined) {
    conditions.push(gte(candidates.desiredSalaryMin, rules.salaryRange.min));
  }
  if (rules.salaryRange?.max !== undefined) {
    conditions.push(lte(candidates.desiredSalaryMax, rules.salaryRange.max));
  }

  const matchingCandidates = await db
    .select()
    .from(candidates)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // Apply skill filtering
  let filteredCandidates = matchingCandidates;
  if (rules.skills && rules.skills.length > 0) {
    filteredCandidates = filteredCandidates.filter((candidate: any) => {
      const candidateSkills = candidate.technicalSkills || [];
      return rules.skills!.some((skill: any) =>
        candidateSkills.some((cs: any) => cs.toLowerCase().includes(skill.toLowerCase()))
      );
    });
  }

  // Insert members
  if (filteredCandidates.length > 0) {
    await db.insert(listMembers).values(
      filteredCandidates.map((candidate: any) => ({
        listId,
        candidateId: candidate.id,
        matchScore: candidate.aiProfileScore,
      }))
    );
  }

  // Update list count and refresh timestamp
  await db
    .update(candidateLists)
    .set({
      candidateCount: filteredCandidates.length,
      lastRefreshed: new Date(),
    })
    .where(eq(candidateLists.id, listId));

  return filteredCandidates.length;
}

/**
 * Get all lists for an employer
 */
export async function getEmployerLists(employerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(candidateLists)
    .where(eq(candidateLists.employerId, employerId))
    .orderBy(candidateLists.createdAt);
}

/**
 * Get list members with candidate details
 */
export async function getListMembers(listId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const members = await db
    .select({
      member: listMembers,
      candidate: candidates,
    })
    .from(listMembers)
    .innerJoin(candidates, eq(listMembers.candidateId, candidates.id))
    .where(eq(listMembers.listId, listId));

  return members;
}

/**
 * Update list configuration
 */
export async function updateListConfiguration(
  listId: number,
  updates: {
    listName?: string;
    description?: string;
    segmentationRules?: SegmentationRules;
    isAutoRefresh?: boolean;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(candidateLists)
    .set(updates)
    .where(eq(candidateLists.id, listId));

  // If rules changed and auto-refresh is enabled, refresh members
  if (updates.segmentationRules) {
    const [list] = await db
      .select()
      .from(candidateLists)
      .where(eq(candidateLists.id, listId));

    if (list?.isAutoRefresh) {
      await refreshListMembers(listId);
    }
  }

  return true;
}

/**
 * Delete a list
 */
export async function deleteList(listId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete members first
  await db.delete(listMembers).where(eq(listMembers.listId, listId));

  // Delete list
  await db.delete(candidateLists).where(eq(candidateLists.id, listId));

  return true;
}
