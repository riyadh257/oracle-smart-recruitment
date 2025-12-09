/**
 * Engagement Cohort Analysis Service
 * Compare engagement patterns across candidate segments
 */

import { getDb } from "./db";

export interface CohortMetrics {
  cohortName: string;
  cohortValue: string;
  candidateCount: number;
  avgEngagementScore: number;
  avgOpenRate: number;
  avgClickRate: number;
  avgResponseRate: number;
  topPerformers: number;
  lowPerformers: number;
}

export interface CohortComparison {
  dimension: "industry" | "experience" | "location";
  cohorts: CohortMetrics[];
  insights: string[];
}

/**
 * Get engagement metrics by industry
 */
export async function getCohortByIndustry(employerId: number): Promise<CohortMetrics[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [rows] = await db.execute(
    `SELECT 
       c.industry as cohortValue,
       COUNT(DISTINCT ce.candidateId) as candidateCount,
       AVG(ce.engagementScore) as avgEngagementScore,
       AVG(ce.openRate) as avgOpenRate,
       AVG(ce.clickRate) as avgClickRate,
       AVG(ce.responseRate) as avgResponseRate,
       SUM(CASE WHEN ce.engagementLevel IN ('high', 'very_high') THEN 1 ELSE 0 END) as topPerformers,
       SUM(CASE WHEN ce.engagementLevel IN ('low', 'very_low') THEN 1 ELSE 0 END) as lowPerformers
     FROM candidateEngagement ce
     JOIN candidates c ON ce.candidateId = c.id
     WHERE ce.employerId = ? AND c.industry IS NOT NULL
     GROUP BY c.industry
     ORDER BY avgEngagementScore DESC`,
    [employerId]
  ) as any;

  return rows.map((row: any) => ({
    cohortName: "Industry",
    cohortValue: row.cohortValue || "Unknown",
    candidateCount: parseInt(row.candidateCount),
    avgEngagementScore: parseFloat(row.avgEngagementScore || 0),
    avgOpenRate: parseFloat(row.avgOpenRate || 0),
    avgClickRate: parseFloat(row.avgClickRate || 0),
    avgResponseRate: parseFloat(row.avgResponseRate || 0),
    topPerformers: parseInt(row.topPerformers || 0),
    lowPerformers: parseInt(row.lowPerformers || 0),
  }));
}

/**
 * Get engagement metrics by experience level
 */
export async function getCohortByExperience(employerId: number): Promise<CohortMetrics[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [rows] = await db.execute(
    `SELECT 
       c.experienceLevel as cohortValue,
       COUNT(DISTINCT ce.candidateId) as candidateCount,
       AVG(ce.engagementScore) as avgEngagementScore,
       AVG(ce.openRate) as avgOpenRate,
       AVG(ce.clickRate) as avgClickRate,
       AVG(ce.responseRate) as avgResponseRate,
       SUM(CASE WHEN ce.engagementLevel IN ('high', 'very_high') THEN 1 ELSE 0 END) as topPerformers,
       SUM(CASE WHEN ce.engagementLevel IN ('low', 'very_low') THEN 1 ELSE 0 END) as lowPerformers
     FROM candidateEngagement ce
     JOIN candidates c ON ce.candidateId = c.id
     WHERE ce.employerId = ? AND c.experienceLevel IS NOT NULL
     GROUP BY c.experienceLevel
     ORDER BY 
       CASE c.experienceLevel
         WHEN 'entry' THEN 1
         WHEN 'mid' THEN 2
         WHEN 'senior' THEN 3
         WHEN 'lead' THEN 4
         WHEN 'executive' THEN 5
         ELSE 6
       END`,
    [employerId]
  ) as any;

  return rows.map((row: any) => ({
    cohortName: "Experience Level",
    cohortValue: row.cohortValue || "Unknown",
    candidateCount: parseInt(row.candidateCount),
    avgEngagementScore: parseFloat(row.avgEngagementScore || 0),
    avgOpenRate: parseFloat(row.avgOpenRate || 0),
    avgClickRate: parseFloat(row.avgClickRate || 0),
    avgResponseRate: parseFloat(row.avgResponseRate || 0),
    topPerformers: parseInt(row.topPerformers || 0),
    lowPerformers: parseInt(row.lowPerformers || 0),
  }));
}

/**
 * Get engagement metrics by location
 */
export async function getCohortByLocation(employerId: number): Promise<CohortMetrics[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [rows] = await db.execute(
    `SELECT 
       c.location as cohortValue,
       COUNT(DISTINCT ce.candidateId) as candidateCount,
       AVG(ce.engagementScore) as avgEngagementScore,
       AVG(ce.openRate) as avgOpenRate,
       AVG(ce.clickRate) as avgClickRate,
       AVG(ce.responseRate) as avgResponseRate,
       SUM(CASE WHEN ce.engagementLevel IN ('high', 'very_high') THEN 1 ELSE 0 END) as topPerformers,
       SUM(CASE WHEN ce.engagementLevel IN ('low', 'very_low') THEN 1 ELSE 0 END) as lowPerformers
     FROM candidateEngagement ce
     JOIN candidates c ON ce.candidateId = c.id
     WHERE ce.employerId = ? AND c.location IS NOT NULL
     GROUP BY c.location
     ORDER BY avgEngagementScore DESC
     LIMIT 20`,
    [employerId]
  ) as any;

  return rows.map((row: any) => ({
    cohortName: "Location",
    cohortValue: row.cohortValue || "Unknown",
    candidateCount: parseInt(row.candidateCount),
    avgEngagementScore: parseFloat(row.avgEngagementScore || 0),
    avgOpenRate: parseFloat(row.avgOpenRate || 0),
    avgClickRate: parseFloat(row.avgClickRate || 0),
    avgResponseRate: parseFloat(row.avgResponseRate || 0),
    topPerformers: parseInt(row.topPerformers || 0),
    lowPerformers: parseInt(row.lowPerformers || 0),
  }));
}

/**
 * Generate insights from cohort analysis
 */
function generateCohortInsights(cohorts: CohortMetrics[], dimension: string): string[] {
  if (cohorts.length === 0) return [];

  const insights: string[] = [];
  const sortedByScore = [...cohorts].sort((a, b) => b.avgEngagementScore - a.avgEngagementScore);
  const avgScore = cohorts.reduce((sum: any, c: any) => sum + c.avgEngagementScore, 0) / cohorts.length;

  // Top performer
  if (sortedByScore.length > 0) {
    const top = sortedByScore[0];
    insights.push(
      `${top.cohortValue} shows the highest engagement (${top.avgEngagementScore.toFixed(1)}) - consider prioritizing this ${dimension.toLowerCase()} in future campaigns.`
    );
  }

  // Below average performers
  const belowAverage = cohorts.filter((c) => c.avgEngagementScore < avgScore * 0.8);
  if (belowAverage.length > 0) {
    insights.push(
      `${belowAverage.length} ${dimension.toLowerCase()}(s) are significantly below average engagement - review messaging strategy for these segments.`
    );
  }

  // High open but low click
  const highOpenLowClick = cohorts.filter(
    (c) => c.avgOpenRate > avgScore * 0.9 && c.avgClickRate < avgScore * 0.7
  );
  if (highOpenLowClick.length > 0) {
    insights.push(
      `${highOpenLowClick.map((c) => c.cohortValue).join(", ")} have high open rates but low click rates - improve email content and CTAs for these segments.`
    );
  }

  // Response rate leaders
  const sortedByResponse = [...cohorts].sort((a, b) => b.avgResponseRate - a.avgResponseRate);
  if (sortedByResponse.length > 0 && sortedByResponse[0].avgResponseRate > 10) {
    insights.push(
      `${sortedByResponse[0].cohortValue} shows exceptional response rate (${sortedByResponse[0].avgResponseRate.toFixed(1)}%) - analyze what makes this segment particularly responsive.`
    );
  }

  return insights;
}

/**
 * Get cohort comparison analysis
 */
export async function getCohortComparison(
  employerId: number,
  dimension: "industry" | "experience" | "location"
): Promise<CohortComparison> {
  let cohorts: CohortMetrics[];

  switch (dimension) {
    case "industry":
      cohorts = await getCohortByIndustry(employerId);
      break;
    case "experience":
      cohorts = await getCohortByExperience(employerId);
      break;
    case "location":
      cohorts = await getCohortByLocation(employerId);
      break;
    default:
      cohorts = [];
  }

  const insights = generateCohortInsights(cohorts, dimension);

  return {
    dimension,
    cohorts,
    insights,
  };
}

/**
 * Get all cohort analyses
 */
export async function getAllCohortAnalyses(employerId: number): Promise<{
  industry: CohortComparison;
  experience: CohortComparison;
  location: CohortComparison;
}> {
  const [industry, experience, location] = await Promise.all([
    getCohortComparison(employerId, "industry"),
    getCohortComparison(employerId, "experience"),
    getCohortComparison(employerId, "location"),
  ]);

  return { industry, experience, location };
}

/**
 * Get top performing cohorts across all dimensions
 */
export async function getTopPerformingCohorts(employerId: number, limit: number = 10): Promise<CohortMetrics[]> {
  const allAnalyses = await getAllCohortAnalyses(employerId);
  
  const allCohorts = [
    ...allAnalyses.industry.cohorts,
    ...allAnalyses.experience.cohorts,
    ...allAnalyses.location.cohorts,
  ];

  return allCohorts
    .sort((a, b) => b.avgEngagementScore - a.avgEngagementScore)
    .slice(0, limit);
}
