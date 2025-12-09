import { and, between, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { getDb } from "./db";
import { matchHistory, savedMatches, candidates, jobs } from "../drizzle/schema";

/**
 * Get match history trends over time
 * Returns aggregated match counts and average scores by date period
 */
export async function getMatchTrends(params: {
  userId: number;
  startDate: Date;
  endDate: Date;
  groupBy?: 'day' | 'week' | 'month';
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { userId, startDate, endDate, groupBy = 'week' } = params;

  // SQL date format based on grouping
  const dateFormat = {
    day: '%Y-%m-%d',
    week: '%Y-%U',
    month: '%Y-%m'
  }[groupBy];

  const results = await db
    .select({
      period: sql<string>`DATE_FORMAT(${matchHistory.matchedAt}, ${dateFormat})`,
      totalMatches: count(matchHistory.id),
      avgOverallScore: sql<number>`AVG(${matchHistory.overallScore})`,
      avgSkillScore: sql<number>`AVG(${matchHistory.skillScore})`,
      avgCultureScore: sql<number>`AVG(${matchHistory.cultureScore})`,
      avgWellbeingScore: sql<number>`AVG(${matchHistory.wellbeingScore})`,
    })
    .from(matchHistory)
    .where(
      and(
        eq(matchHistory.userId, userId),
        gte(matchHistory.matchedAt, startDate.toISOString()),
        lte(matchHistory.matchedAt, endDate.toISOString())
      )
    )
    .groupBy(sql`DATE_FORMAT(${matchHistory.matchedAt}, ${dateFormat})`)
    .orderBy(sql`DATE_FORMAT(${matchHistory.matchedAt}, ${dateFormat})`);

  return results;
}

/**
 * Calculate attribute correlation analysis
 * Shows which attributes correlate with successful hires
 */
export async function getAttributeCorrelation(params: {
  userId: number;
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { userId, startDate, endDate } = params;

  const whereConditions = [eq(matchHistory.userId, userId)];
  
  if (startDate) {
    whereConditions.push(gte(matchHistory.matchedAt, startDate.toISOString()));
  }
  if (endDate) {
    whereConditions.push(lte(matchHistory.matchedAt, endDate.toISOString()));
  }

  // Get correlation between scores and hiring outcomes
  const results = await db
    .select({
      outcome: matchHistory.outcome,
      count: count(matchHistory.id),
      avgOverallScore: sql<number>`AVG(${matchHistory.overallScore})`,
      avgSkillScore: sql<number>`AVG(${matchHistory.skillScore})`,
      avgTechnicalScore: sql<number>`AVG(${matchHistory.technicalScore})`,
      avgCultureScore: sql<number>`AVG(${matchHistory.cultureScore})`,
      avgWellbeingScore: sql<number>`AVG(${matchHistory.wellbeingScore})`,
      // Standard deviation for each score
      stdOverallScore: sql<number>`STDDEV(${matchHistory.overallScore})`,
      stdSkillScore: sql<number>`STDDEV(${matchHistory.skillScore})`,
      stdTechnicalScore: sql<number>`STDDEV(${matchHistory.technicalScore})`,
      stdCultureScore: sql<number>`STDDEV(${matchHistory.cultureScore})`,
      stdWellbeingScore: sql<number>`STDDEV(${matchHistory.wellbeingScore})`,
    })
    .from(matchHistory)
    .where(and(...whereConditions))
    .groupBy(matchHistory.outcome);

  return results;
}

/**
 * Calculate hiring pipeline conversion rates
 * Tracks conversion from match → contacted → interviewed → hired
 */
export async function getPipelineConversionRates(params: {
  userId: number;
  startDate?: Date;
  endDate?: Date;
  jobId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { userId, startDate, endDate, jobId } = params;

  const whereConditions = [eq(matchHistory.userId, userId)];
  
  if (startDate) {
    whereConditions.push(gte(matchHistory.matchedAt, startDate.toISOString()));
  }
  if (endDate) {
    whereConditions.push(lte(matchHistory.matchedAt, endDate.toISOString()));
  }
  if (jobId) {
    whereConditions.push(eq(matchHistory.jobId, jobId));
  }

  // Count matches at each stage
  const stageCounts = await db
    .select({
      outcome: matchHistory.outcome,
      count: count(matchHistory.id),
    })
    .from(matchHistory)
    .where(and(...whereConditions))
    .groupBy(matchHistory.outcome);

  // Calculate conversion rates
  const total = stageCounts.reduce((sum, stage) => sum + stage.count, 0);
  
  const stageMap = new Map(stageCounts.map(s => [s.outcome, s.count]));
  
  const matched = total;
  const contacted = stageMap.get('contacted') || 0;
  const interviewed = stageMap.get('interviewed') || 0;
  const offered = stageMap.get('offered') || 0;
  const hired = stageMap.get('hired') || 0;

  return {
    stages: {
      matched,
      contacted,
      interviewed,
      offered,
      hired,
    },
    conversionRates: {
      matchToContact: matched > 0 ? (contacted / matched) * 100 : 0,
      contactToInterview: contacted > 0 ? (interviewed / contacted) * 100 : 0,
      interviewToOffer: interviewed > 0 ? (offered / interviewed) * 100 : 0,
      offerToHire: offered > 0 ? (hired / offered) * 100 : 0,
      overallConversion: matched > 0 ? (hired / matched) * 100 : 0,
    },
  };
}

/**
 * Get top performing attributes
 * Identifies which skills/attributes lead to best outcomes
 */
export async function getTopPerformingAttributes(params: {
  userId: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { userId, limit = 10, startDate, endDate } = params;

  const whereConditions = [
    eq(matchHistory.userId, userId),
    sql`${matchHistory.outcome} IN ('hired', 'offered')` // Only successful outcomes
  ];
  
  if (startDate) {
    whereConditions.push(gte(matchHistory.matchedAt, startDate.toISOString()));
  }
  if (endDate) {
    whereConditions.push(lte(matchHistory.matchedAt, endDate.toISOString()));
  }

  // Get matches with highest scores that led to hires
  const topMatches = await db
    .select({
      candidateId: matchHistory.candidateId,
      jobId: matchHistory.jobId,
      overallScore: matchHistory.overallScore,
      skillScore: matchHistory.skillScore,
      technicalScore: matchHistory.technicalScore,
      cultureScore: matchHistory.cultureScore,
      wellbeingScore: matchHistory.wellbeingScore,
      outcome: matchHistory.outcome,
      matchMetadata: matchHistory.matchMetadata,
    })
    .from(matchHistory)
    .where(and(...whereConditions))
    .orderBy(desc(matchHistory.overallScore))
    .limit(limit);

  return topMatches;
}

/**
 * Get match analytics summary for a time period
 */
export async function getMatchAnalyticsSummary(params: {
  userId: number;
  startDate: Date;
  endDate: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { userId, startDate, endDate } = params;

  const summary = await db
    .select({
      totalMatches: count(matchHistory.id),
      avgOverallScore: sql<number>`AVG(${matchHistory.overallScore})`,
      avgSkillScore: sql<number>`AVG(${matchHistory.skillScore})`,
      avgCultureScore: sql<number>`AVG(${matchHistory.cultureScore})`,
      avgWellbeingScore: sql<number>`AVG(${matchHistory.wellbeingScore})`,
      highScoreMatches: sql<number>`SUM(CASE WHEN ${matchHistory.overallScore} >= 80 THEN 1 ELSE 0 END)`,
      mediumScoreMatches: sql<number>`SUM(CASE WHEN ${matchHistory.overallScore} >= 60 AND ${matchHistory.overallScore} < 80 THEN 1 ELSE 0 END)`,
      lowScoreMatches: sql<number>`SUM(CASE WHEN ${matchHistory.overallScore} < 60 THEN 1 ELSE 0 END)`,
    })
    .from(matchHistory)
    .where(
      and(
        eq(matchHistory.userId, userId),
        gte(matchHistory.matchedAt, startDate.toISOString()),
        lte(matchHistory.matchedAt, endDate.toISOString())
      )
    );

  return summary[0] || null;
}

/**
 * Get job category performance comparison
 */
export async function getJobCategoryPerformance(params: {
  userId: number;
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { userId, startDate, endDate } = params;

  const whereConditions = [eq(matchHistory.userId, userId)];
  
  if (startDate) {
    whereConditions.push(gte(matchHistory.matchedAt, startDate.toISOString()));
  }
  if (endDate) {
    whereConditions.push(lte(matchHistory.matchedAt, endDate.toISOString()));
  }

  const results = await db
    .select({
      jobId: matchHistory.jobId,
      jobTitle: jobs.title,
      department: jobs.department,
      totalMatches: count(matchHistory.id),
      avgScore: sql<number>`AVG(${matchHistory.overallScore})`,
      hiredCount: sql<number>`SUM(CASE WHEN ${matchHistory.outcome} = 'hired' THEN 1 ELSE 0 END)`,
      successRate: sql<number>`(SUM(CASE WHEN ${matchHistory.outcome} = 'hired' THEN 1 ELSE 0 END) / COUNT(*)) * 100`,
    })
    .from(matchHistory)
    .innerJoin(jobs, eq(matchHistory.jobId, jobs.id))
    .where(and(...whereConditions))
    .groupBy(matchHistory.jobId, jobs.title, jobs.department)
    .orderBy(desc(sql`AVG(${matchHistory.overallScore})`));

  return results;
}
