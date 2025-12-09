/**
 * Candidate Engagement Scoring Service
 * Calculate composite engagement scores based on email interactions
 */

import { getDb } from "./db";

export interface CandidateEngagement {
  id: number;
  candidateId: number;
  employerId: number;
  totalEmailsSent: number;
  totalEmailsOpened: number;
  totalLinksClicked: number;
  totalResponses: number;
  openRate: number;
  clickRate: number;
  responseRate: number;
  engagementScore: number;
  engagementLevel: "very_low" | "low" | "medium" | "high" | "very_high";
  lastEngagementAt?: Date;
  firstEngagementAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EngagementTrend {
  date: string;
  score: number;
  opens: number;
  clicks: number;
  responses: number;
}

/**
 * Calculate engagement score based on email interactions
 * Weights: Opens (30%), Clicks (40%), Responses (30%)
 */
function calculateEngagementScore(
  openRate: number,
  clickRate: number,
  responseRate: number
): number {
  const score = openRate * 0.3 + clickRate * 0.4 + responseRate * 0.3;
  return Math.min(Math.round(score), 100);
}

/**
 * Determine engagement level based on score
 */
function getEngagementLevel(score: number): CandidateEngagement["engagementLevel"] {
  if (score >= 80) return "very_high";
  if (score >= 60) return "high";
  if (score >= 40) return "medium";
  if (score >= 20) return "low";
  return "very_low";
}

/**
 * Update engagement metrics for a candidate
 */
export async function updateCandidateEngagement(
  candidateId: number,
  employerId: number,
  interaction: {
    emailSent?: boolean;
    emailOpened?: boolean;
    linkClicked?: boolean;
    responded?: boolean;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get or create engagement record
  const [existing] = await db.execute(
    "SELECT * FROM candidateEngagement WHERE candidateId = ? AND employerId = ? LIMIT 1",
    [candidateId, employerId]
  ) as any;

  const now = new Date();

  if (existing.length === 0) {
    // Create new record
    const totalEmailsSent = interaction.emailSent ? 1 : 0;
    const totalEmailsOpened = interaction.emailOpened ? 1 : 0;
    const totalLinksClicked = interaction.linkClicked ? 1 : 0;
    const totalResponses = interaction.responded ? 1 : 0;

    const openRate = totalEmailsSent > 0 ? (totalEmailsOpened / totalEmailsSent) * 100 : 0;
    const clickRate = totalEmailsSent > 0 ? (totalLinksClicked / totalEmailsSent) * 100 : 0;
    const responseRate = totalEmailsSent > 0 ? (totalResponses / totalEmailsSent) * 100 : 0;

    const engagementScore = calculateEngagementScore(openRate, clickRate, responseRate);
    const engagementLevel = getEngagementLevel(engagementScore);

    await db.execute(
      `INSERT INTO candidateEngagement 
      (candidateId, employerId, totalEmailsSent, totalEmailsOpened, totalLinksClicked, totalResponses,
       openRate, clickRate, responseRate, engagementScore, engagementLevel, firstEngagementAt, lastEngagementAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        candidateId,
        employerId,
        totalEmailsSent,
        totalEmailsOpened,
        totalLinksClicked,
        totalResponses,
        openRate,
        clickRate,
        responseRate,
        engagementScore,
        engagementLevel,
        now,
        now,
      ]
    );
  } else {
    // Update existing record
    const record = existing[0];
    const updates: string[] = [];
    const values: any[] = [];

    if (interaction.emailSent) {
      updates.push("totalEmailsSent = totalEmailsSent + 1");
    }
    if (interaction.emailOpened) {
      updates.push("totalEmailsOpened = totalEmailsOpened + 1");
      updates.push("lastEngagementAt = ?");
      values.push(now);
    }
    if (interaction.linkClicked) {
      updates.push("totalLinksClicked = totalLinksClicked + 1");
      updates.push("lastEngagementAt = ?");
      values.push(now);
    }
    if (interaction.responded) {
      updates.push("totalResponses = totalResponses + 1");
      updates.push("lastEngagementAt = ?");
      values.push(now);
    }

    if (updates.length > 0) {
      values.push(candidateId, employerId);
      await db.execute(
        `UPDATE candidateEngagement SET ${updates.join(", ")} WHERE candidateId = ? AND employerId = ?`,
        values
      );

      // Recalculate rates and score
      await recalculateEngagementScore(candidateId, employerId);
    }
  }
}

/**
 * Recalculate engagement score for a candidate
 */
async function recalculateEngagementScore(candidateId: number, employerId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [rows] = await db.execute(
    "SELECT * FROM candidateEngagement WHERE candidateId = ? AND employerId = ? LIMIT 1",
    [candidateId, employerId]
  ) as any;

  if (rows.length === 0) return;

  const record = rows[0];
  const totalEmailsSent = parseInt(record.totalEmailsSent);
  const totalEmailsOpened = parseInt(record.totalEmailsOpened);
  const totalLinksClicked = parseInt(record.totalLinksClicked);
  const totalResponses = parseInt(record.totalResponses);

  const openRate = totalEmailsSent > 0 ? (totalEmailsOpened / totalEmailsSent) * 100 : 0;
  const clickRate = totalEmailsSent > 0 ? (totalLinksClicked / totalEmailsSent) * 100 : 0;
  const responseRate = totalEmailsSent > 0 ? (totalResponses / totalEmailsSent) * 100 : 0;

  const engagementScore = calculateEngagementScore(openRate, clickRate, responseRate);
  const engagementLevel = getEngagementLevel(engagementScore);

  await db.execute(
    `UPDATE candidateEngagement 
     SET openRate = ?, clickRate = ?, responseRate = ?, engagementScore = ?, engagementLevel = ?
     WHERE candidateId = ? AND employerId = ?`,
    [openRate, clickRate, responseRate, engagementScore, engagementLevel, candidateId, employerId]
  );
}

/**
 * Get engagement data for a candidate
 */
export async function getCandidateEngagement(
  candidateId: number,
  employerId: number
): Promise<CandidateEngagement | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [rows] = await db.execute(
    "SELECT * FROM candidateEngagement WHERE candidateId = ? AND employerId = ? LIMIT 1",
    [candidateId, employerId]
  ) as any;

  if (rows.length === 0) return null;

  return rows[0];
}

/**
 * Get top engaged candidates for an employer
 */
export async function getTopEngagedCandidates(
  employerId: number,
  limit: number = 50
): Promise<Array<CandidateEngagement & { candidateName: string; candidateEmail: string }>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [rows] = await db.execute(
    `SELECT ce.*, c.name as candidateName, c.email as candidateEmail
     FROM candidateEngagement ce
     JOIN candidates c ON ce.candidateId = c.id
     WHERE ce.employerId = ?
     ORDER BY ce.engagementScore DESC, ce.lastEngagementAt DESC
     LIMIT ?`,
    [employerId, limit]
  ) as any;

  return rows;
}

/**
 * Get candidates by engagement level
 */
export async function getCandidatesByEngagementLevel(
  employerId: number,
  level: CandidateEngagement["engagementLevel"]
): Promise<Array<CandidateEngagement & { candidateName: string; candidateEmail: string }>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [rows] = await db.execute(
    `SELECT ce.*, c.name as candidateName, c.email as candidateEmail
     FROM candidateEngagement ce
     JOIN candidates c ON ce.candidateId = c.id
     WHERE ce.employerId = ? AND ce.engagementLevel = ?
     ORDER BY ce.engagementScore DESC`,
    [employerId, level]
  ) as any;

  return rows;
}

/**
 * Get engagement statistics for an employer
 */
export async function getEngagementStatistics(employerId: number): Promise<{
  totalCandidates: number;
  averageScore: number;
  distribution: Record<CandidateEngagement["engagementLevel"], number>;
  recentlyEngaged: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Total candidates and average score
  const [stats] = await db.execute(
    `SELECT COUNT(*) as total, AVG(engagementScore) as avgScore
     FROM candidateEngagement
     WHERE employerId = ?`,
    [employerId]
  ) as any;

  // Distribution by level
  const [distribution] = await db.execute(
    `SELECT engagementLevel, COUNT(*) as count
     FROM candidateEngagement
     WHERE employerId = ?
     GROUP BY engagementLevel`,
    [employerId]
  ) as any;

  // Recently engaged (last 7 days)
  const [recent] = await db.execute(
    `SELECT COUNT(*) as count
     FROM candidateEngagement
     WHERE employerId = ? AND lastEngagementAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
    [employerId]
  ) as any;

  const dist: Record<string, number> = {
    very_low: 0,
    low: 0,
    medium: 0,
    high: 0,
    very_high: 0,
  };

  distribution.forEach((row: any) => {
    dist[row.engagementLevel] = parseInt(row.count);
  });

  return {
    totalCandidates: parseInt(stats[0]?.total || 0),
    averageScore: parseFloat(stats[0]?.avgScore || 0),
    distribution: dist as any,
    recentlyEngaged: parseInt(recent[0]?.count || 0),
  };
}

/**
 * Get engagement trend over time for a candidate
 */
export async function getCandidateEngagementTrend(
  candidateId: number,
  employerId: number,
  days: number = 30
): Promise<EngagementTrend[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // This is a simplified version - in production, you'd track daily engagement metrics
  // For now, we'll return the current engagement as a single data point
  const engagement = await getCandidateEngagement(candidateId, employerId);
  
  if (!engagement) return [];

  return [
    {
      date: new Date().toISOString().split("T")[0],
      score: engagement.engagementScore,
      opens: engagement.totalEmailsOpened,
      clicks: engagement.totalLinksClicked,
      responses: engagement.totalResponses,
    },
  ];
}
