import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "./db";
import { jobs, candidates, matchHistory } from "../drizzle/schema";
import { calculateMatchScore } from "./aiMatching";

/**
 * Perform bulk matching for multiple jobs
 * Returns top N candidates for each job
 */
export async function bulkMatchJobs(params: {
  userId: number;
  jobIds: number[];
  topN?: number;
  minScore?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { userId, jobIds, topN = 10, minScore = 60 } = params;

  // Get all jobs
  const jobsData = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.userId, userId), inArray(jobs.id, jobIds)));

  if (jobsData.length === 0) {
    throw new Error("No jobs found");
  }

  // Get all active candidates
  const candidatesData = await db
    .select()
    .from(candidates)
    .where(eq(candidates.userId, userId));

  const results = [];

  // For each job, calculate matches with all candidates
  for (const job of jobsData) {
    const jobMatches = [];

    for (const candidate of candidatesData) {
      try {
        // Calculate AI match using calculateMatchScore
        const matchResult = await calculateMatchScore(candidate, job);

        if (matchResult.overallMatchScore >= minScore) {
          jobMatches.push({
            candidate,
            match: {
              overallScore: matchResult.overallMatchScore,
              technicalScore: matchResult.skillMatchScore,
              cultureFitScore: matchResult.cultureFitScore,
              wellbeingScore: matchResult.wellbeingMatchScore,
              explanation: JSON.stringify(matchResult.matchBreakdown),
            },
          });
        }
      } catch (error) {
        console.error(`Error matching candidate ${candidate.id} to job ${job.id}:`, error);
        // Continue with next candidate
      }
    }

    // Sort by overall score and take top N
    jobMatches.sort((a, b) => b.match.overallScore - a.match.overallScore);
    const topMatches = jobMatches.slice(0, topN);

    results.push({
      job,
      matches: topMatches,
      totalMatches: jobMatches.length,
    });
  }

  return results;
}

/**
 * Export bulk match results to CSV format
 */
export function exportBulkMatchesToCSV(bulkResults: any[]): string {
  const headers = [
    'Job Title',
    'Job Department',
    'Candidate Name',
    'Candidate Email',
    'Overall Score',
    'Technical Score',
    'Culture Fit Score',
    'Wellbeing Score',
    'Match Explanation',
  ];

  const rows = [headers.join(',')];

  for (const result of bulkResults) {
    const { job, matches } = result;

    for (const match of matches) {
      const row = [
        `"${job.title || ''}"`,
        `"${job.department || ''}"`,
        `"${match.candidate.name || ''}"`,
        `"${match.candidate.email || ''}"`,
        match.match.overallScore,
        match.match.technicalScore,
        match.match.cultureFitScore,
        match.match.wellbeingScore,
        `"${(match.match.explanation || '').replace(/"/g, '""')}"`,
      ];
      rows.push(row.join(','));
    }
  }

  return rows.join('\n');
}

/**
 * Export bulk match results to formatted text for PDF generation
 */
export function exportBulkMatchesToPDFData(bulkResults: any[]): {
  title: string;
  generatedAt: string;
  jobs: Array<{
    jobTitle: string;
    jobDepartment: string;
    totalMatches: number;
    topCandidates: Array<{
      name: string;
      email: string;
      overallScore: number;
      technicalScore: number;
      cultureFitScore: number;
      wellbeingScore: number;
      explanation: string;
    }>;
  }>;
} {
  return {
    title: 'Bulk Match Report',
    generatedAt: new Date().toISOString(),
    jobs: bulkResults.map(result => ({
      jobTitle: result.job.title || 'Untitled Job',
      jobDepartment: result.job.department || 'N/A',
      totalMatches: result.totalMatches,
      topCandidates: result.matches.map((match: any) => ({
        name: match.candidate.name || 'Unknown',
        email: match.candidate.email || 'N/A',
        overallScore: match.match.overallScore,
        technicalScore: match.match.technicalScore,
        cultureFitScore: match.match.cultureFitScore,
        wellbeingScore: match.match.wellbeingScore,
        explanation: match.match.explanation || 'No explanation available',
      })),
    })),
  };
}

/**
 * Get jobs available for bulk matching
 */
export async function getJobsForBulkMatching(params: {
  userId: number;
  status?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { userId, status } = params;

  const whereConditions = [eq(jobs.userId, userId)];

  if (status) {
    whereConditions.push(eq(jobs.status, status));
  }

  const jobsList = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      department: jobs.department,
      location: jobs.location,
      status: jobs.status,
      createdAt: jobs.createdAt,
    })
    .from(jobs)
    .where(and(...whereConditions))
    .orderBy(jobs.createdAt);

  return jobsList;
}

/**
 * Get match statistics for bulk operations
 */
export async function getBulkMatchStatistics(params: {
  userId: number;
  jobIds: number[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { userId, jobIds } = params;

  const stats = await db
    .select({
      jobId: matchHistory.jobId,
      totalMatches: sql<number>`COUNT(*)`,
      avgScore: sql<number>`AVG(${matchHistory.overallScore})`,
      maxScore: sql<number>`MAX(${matchHistory.overallScore})`,
      minScore: sql<number>`MIN(${matchHistory.overallScore})`,
    })
    .from(matchHistory)
    .where(
      and(
        eq(matchHistory.userId, userId),
        inArray(matchHistory.jobId, jobIds)
      )
    )
    .groupBy(matchHistory.jobId);

  return stats;
}
