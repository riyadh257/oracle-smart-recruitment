/**
 * Dynamic List Segmentation
 * Create targeted candidate lists based on attributes, engagement, and behavior
 */

import { getDb } from "./db";

export interface SegmentationRule {
  type: "attribute" | "engagement" | "behavior";
  field: string;
  operator: "equals" | "not_equals" | "greater_than" | "less_than" | "contains" | "in" | "between";
  value: any;
  logic?: "AND" | "OR";
}

export interface CandidateList {
  id: number;
  employerId: number;
  name: string;
  description: string;
  segmentationRules: SegmentationRule[];
  candidateCount: number;
  lastUpdated: Date;
  isActive: boolean;
}

/**
 * Build SQL WHERE clause from segmentation rules
 */
function buildWhereClause(rules: SegmentationRule[]): { where: string; params: any[] } {
  if (rules.length === 0) {
    return { where: "1=1", params: [] };
  }

  const conditions: string[] = [];
  const params: any[] = [];

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    const logic = i > 0 ? (rule.logic || "AND") : "";

    let condition = "";

    switch (rule.type) {
      case "attribute":
        // Candidate attributes (skills, experience, location, etc.)
        switch (rule.operator) {
          case "equals":
            condition = `c.${rule.field} = ?`;
            params.push(rule.value);
            break;
          case "not_equals":
            condition = `c.${rule.field} != ?`;
            params.push(rule.value);
            break;
          case "greater_than":
            condition = `c.${rule.field} > ?`;
            params.push(rule.value);
            break;
          case "less_than":
            condition = `c.${rule.field} < ?`;
            params.push(rule.value);
            break;
          case "contains":
            condition = `c.${rule.field} LIKE ?`;
            params.push(`%${rule.value}%`);
            break;
          case "in":
            condition = `c.${rule.field} IN (?)`;
            params.push(rule.value);
            break;
          case "between":
            condition = `c.${rule.field} BETWEEN ? AND ?`;
            params.push(rule.value[0], rule.value[1]);
            break;
        }
        break;

      case "engagement":
        // Engagement metrics from candidateEngagement table
        switch (rule.field) {
          case "engagementScore":
            condition = `ce.engagementScore ${rule.operator === "greater_than" ? ">" : rule.operator === "less_than" ? "<" : "="} ?`;
            params.push(rule.value);
            break;
          case "emailOpens":
            condition = `ce.emailOpens ${rule.operator === "greater_than" ? ">" : rule.operator === "less_than" ? "<" : "="} ?`;
            params.push(rule.value);
            break;
          case "emailClicks":
            condition = `ce.emailClicks ${rule.operator === "greater_than" ? ">" : rule.operator === "less_than" ? "<" : "="} ?`;
            params.push(rule.value);
            break;
          case "lastEngagement":
            condition = `ce.lastEngagement ${rule.operator === "greater_than" ? ">" : "<"} DATE_SUB(NOW(), INTERVAL ? DAY)`;
            params.push(rule.value);
            break;
        }
        break;

      case "behavior":
        // Behavioral patterns (application status, interview stage, etc.)
        switch (rule.field) {
          case "applicationStatus":
            condition = `a.status ${rule.operator === "equals" ? "=" : "!="} ?`;
            params.push(rule.value);
            break;
          case "hasApplied":
            condition = rule.value ? `a.id IS NOT NULL` : `a.id IS NULL`;
            break;
          case "appliedInDays":
            condition = `a.appliedAt > DATE_SUB(NOW(), INTERVAL ? DAY)`;
            params.push(rule.value);
            break;
          case "interviewStage":
            condition = `a.interviewStage ${rule.operator === "equals" ? "=" : "!="} ?`;
            params.push(rule.value);
            break;
        }
        break;
    }

    if (condition) {
      if (i > 0) {
        conditions.push(`${logic} ${condition}`);
      } else {
        conditions.push(condition);
      }
    }
  }

  return {
    where: conditions.length > 0 ? conditions.join(" ") : "1=1",
    params,
  };
}

/**
 * Create a new candidate list
 */
export async function createCandidateList(
  employerId: number,
  name: string,
  description: string,
  rules: SegmentationRule[]
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Calculate initial count
  const count = await getCandidateCount(employerId, rules);

  const [result] = (await db.execute(
    `INSERT INTO candidateLists (employerId, name, description, segmentationRules, candidateCount)
     VALUES (?, ?, ?, ?, ?)`,
    [employerId, name, description, JSON.stringify(rules), count]
  )) as any;

  return result.insertId;
}

/**
 * Get candidate count for segmentation rules
 */
export async function getCandidateCount(employerId: number, rules: SegmentationRule[]): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { where, params } = buildWhereClause(rules);

  const query = `
    SELECT COUNT(DISTINCT c.id) as count
    FROM candidates c
    LEFT JOIN candidateEngagement ce ON c.id = ce.candidateId AND ce.employerId = ?
    LEFT JOIN applications a ON c.id = a.candidateId AND a.employerId = ?
    WHERE ${where}
  `;

  const [results] = (await db.execute(query, [employerId, employerId, ...params])) as any;
  return results[0]?.count || 0;
}

/**
 * Get candidates matching segmentation rules
 */
export async function getCandidatesByRules(
  employerId: number,
  rules: SegmentationRule[],
  limit: number = 100,
  offset: number = 0
): Promise<any[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { where, params } = buildWhereClause(rules);

  const query = `
    SELECT DISTINCT
      c.id,
      c.name,
      c.email,
      c.skills,
      c.experience,
      c.location,
      ce.engagementScore,
      ce.emailOpens,
      ce.emailClicks,
      ce.lastEngagement,
      a.status as applicationStatus,
      a.interviewStage
    FROM candidates c
    LEFT JOIN candidateEngagement ce ON c.id = ce.candidateId AND ce.employerId = ?
    LEFT JOIN applications a ON c.id = a.candidateId AND a.employerId = ?
    WHERE ${where}
    ORDER BY ce.engagementScore DESC, c.name ASC
    LIMIT ? OFFSET ?
  `;

  const [results] = (await db.execute(query, [employerId, employerId, ...params, limit, offset])) as any;
  return results;
}

/**
 * Get all lists for an employer
 */
export async function getEmployerLists(employerId: number): Promise<CandidateList[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [results] = (await db.execute(
    `SELECT * FROM candidateLists WHERE employerId = ? AND isActive = TRUE ORDER BY lastUpdated DESC`,
    [employerId]
  )) as any;

  return results.map((row: any) => ({
    ...row,
    segmentationRules: JSON.parse(row.segmentationRules),
  }));
}

/**
 * Get list by ID
 */
export async function getListById(listId: number, employerId: number): Promise<CandidateList | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [results] = (await db.execute(`SELECT * FROM candidateLists WHERE id = ? AND employerId = ?`, [
    listId,
    employerId,
  ])) as any;

  if (results.length === 0) return null;

  return {
    ...results[0],
    segmentationRules: JSON.parse(results[0].segmentationRules),
  };
}

/**
 * Update list
 */
export async function updateCandidateList(
  listId: number,
  employerId: number,
  updates: {
    name?: string;
    description?: string;
    rules?: SegmentationRule[];
  }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const setClauses: string[] = [];
  const params: any[] = [];

  if (updates.name) {
    setClauses.push("name = ?");
    params.push(updates.name);
  }

  if (updates.description !== undefined) {
    setClauses.push("description = ?");
    params.push(updates.description);
  }

  if (updates.rules) {
    setClauses.push("segmentationRules = ?");
    params.push(JSON.stringify(updates.rules));

    // Recalculate count
    const count = await getCandidateCount(employerId, updates.rules);
    setClauses.push("candidateCount = ?");
    params.push(count);
  }

  if (setClauses.length === 0) return;

  params.push(listId, employerId);

  await db.execute(
    `UPDATE candidateLists SET ${setClauses.join(", ")}, lastUpdated = NOW() WHERE id = ? AND employerId = ?`,
    params
  );
}

/**
 * Delete list
 */
export async function deleteCandidateList(listId: number, employerId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.execute(`UPDATE candidateLists SET isActive = FALSE WHERE id = ? AND employerId = ?`, [
    listId,
    employerId,
  ]);
}

/**
 * Refresh list candidate count
 */
export async function refreshListCount(listId: number, employerId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const list = await getListById(listId, employerId);
  if (!list) throw new Error("List not found");

  const count = await getCandidateCount(employerId, list.segmentationRules);

  await db.execute(`UPDATE candidateLists SET candidateCount = ?, lastUpdated = NOW() WHERE id = ?`, [count, listId]);

  return count;
}

/**
 * Get list statistics
 */
export async function getListStats(employerId: number): Promise<{
  totalLists: number;
  totalCandidates: number;
  avgListSize: number;
  largestList: { name: string; count: number } | null;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [stats] = (await db.execute(
    `SELECT 
       COUNT(*) as totalLists,
       SUM(candidateCount) as totalCandidates,
       AVG(candidateCount) as avgListSize
     FROM candidateLists
     WHERE employerId = ? AND isActive = TRUE`,
    [employerId]
  )) as any;

  const [largest] = (await db.execute(
    `SELECT name, candidateCount as count
     FROM candidateLists
     WHERE employerId = ? AND isActive = TRUE
     ORDER BY candidateCount DESC
     LIMIT 1`,
    [employerId]
  )) as any;

  return {
    totalLists: stats[0]?.totalLists || 0,
    totalCandidates: stats[0]?.totalCandidates || 0,
    avgListSize: stats[0]?.avgListSize || 0,
    largestList: largest[0] || null,
  };
}
