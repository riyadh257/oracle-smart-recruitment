import { getDb } from "./db";
import { bulkMatchJobs, bulkMatchResults, candidates, jobs } from "../drizzle/schema";
import { eq, inArray } from "drizzle-orm";
import { notifyBulkOperationComplete } from "./realtimeNotifications";
import { invokeLLM } from "./_core/llm";

/**
 * Bulk Matching Service
 * Handles batch processing of AI matching operations for enterprise-scale matching
 */

export interface BulkMatchJobConfig {
  userId: number;
  jobName: string;
  matchType: 'candidates_to_job' | 'jobs_to_candidate' | 'all_to_all';
  sourceType: 'file_upload' | 'database_selection' | 'api';
  sourceData: {
    candidateIds?: number[];
    jobIds?: number[];
    filters?: any;
  };
}

export interface MatchResult {
  candidateId: number;
  jobId: number;
  matchScore: number;
  skillMatchScore: number;
  cultureFitScore: number;
  wellbeingMatchScore: number;
  matchBreakdown: any;
  matchExplanation: string;
}

/**
 * Create a new bulk matching job
 */
export async function createBulkMatchJob(config: BulkMatchJobConfig): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const totalItems = calculateTotalItems(config);

  const [result] = await db.insert(bulkMatchJobs).values({
    userId: config.userId,
    jobName: config.jobName,
    matchType: config.matchType,
    sourceType: config.sourceType,
    sourceData: config.sourceData,
    totalItems,
    processedItems: 0,
    successfulMatches: 0,
    failedItems: 0,
    status: 'pending',
    progress: 0,
  });

  const jobId = result.insertId as number;
  
  // Start processing asynchronously
  processBulkMatchJob(jobId).catch(error => {
    console.error(`[BulkMatching] Error processing job ${jobId}:`, error);
  });

  return jobId;
}

/**
 * Calculate total items to process
 */
function calculateTotalItems(config: BulkMatchJobConfig): number {
  const { matchType, sourceData } = config;
  
  if (matchType === 'candidates_to_job') {
    return (sourceData.candidateIds?.length || 0) * (sourceData.jobIds?.length || 1);
  } else if (matchType === 'jobs_to_candidate') {
    return (sourceData.jobIds?.length || 0) * (sourceData.candidateIds?.length || 1);
  } else if (matchType === 'all_to_all') {
    const candidateCount = sourceData.candidateIds?.length || 0;
    const jobCount = sourceData.jobIds?.length || 0;
    return candidateCount * jobCount;
  }
  
  return 0;
}

/**
 * Process a bulk matching job
 */
async function processBulkMatchJob(jobId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const startTime = Date.now();

  try {
    // Update job status to processing
    await db.update(bulkMatchJobs)
      .set({ status: 'processing', startedAt: new Date() })
      .where(eq(bulkMatchJobs.id, jobId));

    // Get job details
    const [job] = await db.select()
      .from(bulkMatchJobs)
      .where(eq(bulkMatchJobs.id, jobId));

    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    const sourceData = job.sourceData as any;
    const candidateIds = sourceData.candidateIds || [];
    const jobIds = sourceData.jobIds || [];

    // Fetch candidates and jobs data
    const candidatesData = await db.select()
      .from(candidates)
      .where(inArray(candidates.id, candidateIds));

    const jobsData = await db.select()
      .from(jobs)
      .where(inArray(jobs.id, jobIds));

    let processedItems = 0;
    let successfulMatches = 0;
    let failedItems = 0;

    // Process matches based on match type
    for (const candidate of candidatesData) {
      for (const jobPosting of jobsData) {
        try {
          // Perform AI matching
          const matchResult = await performAIMatching(candidate, jobPosting);

          // Store result
          await db.insert(bulkMatchResults).values({
            jobId,
            candidateId: candidate.id,
            jobPostingId: jobPosting.id,
            matchScore: matchResult.matchScore,
            skillMatchScore: matchResult.skillMatchScore,
            cultureFitScore: matchResult.cultureFitScore,
            wellbeingMatchScore: matchResult.wellbeingMatchScore,
            matchBreakdown: matchResult.matchBreakdown,
            matchExplanation: matchResult.matchExplanation,
            status: 'completed',
            processedAt: new Date(),
          });

          successfulMatches++;
        } catch (error) {
          console.error(`[BulkMatching] Error matching candidate ${candidate.id} to job ${jobPosting.id}:`, error);
          
          await db.insert(bulkMatchResults).values({
            jobId,
            candidateId: candidate.id,
            jobPostingId: jobPosting.id,
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            processedAt: new Date(),
          });

          failedItems++;
        }

        processedItems++;

        // Update progress
        const progress = Math.round((processedItems / job.totalItems) * 100);
        await db.update(bulkMatchJobs)
          .set({
            processedItems,
            successfulMatches,
            failedItems,
            progress,
          })
          .where(eq(bulkMatchJobs.id, jobId));
      }
    }

    // Calculate duration
    const duration = Math.round((Date.now() - startTime) / 1000);

    // Generate results summary
    const resultsSummary = {
      totalProcessed: processedItems,
      successfulMatches,
      failedItems,
      duration,
      averageMatchScore: await calculateAverageMatchScore(jobId),
      highQualityMatches: await countHighQualityMatches(jobId),
    };

    // Update job as completed
    await db.update(bulkMatchJobs)
      .set({
        status: 'completed',
        completedAt: new Date(),
        resultsSummary,
      })
      .where(eq(bulkMatchJobs.id, jobId));

    // Send completion notification
    notifyBulkOperationComplete(job.userId, {
      operationType: `Bulk Matching: ${job.jobName}`,
      totalProcessed: processedItems,
      successCount: successfulMatches,
      failureCount: failedItems,
      duration,
    });

    console.log(`[BulkMatching] Job ${jobId} completed: ${successfulMatches} successful, ${failedItems} failed`);
  } catch (error) {
    console.error(`[BulkMatching] Job ${jobId} failed:`, error);

    await db.update(bulkMatchJobs)
      .set({
        status: 'failed',
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      })
      .where(eq(bulkMatchJobs.id, jobId));
  }
}

/**
 * Perform AI matching between candidate and job
 */
async function performAIMatching(candidate: any, job: any): Promise<MatchResult> {
  // Simplified matching logic - in production, use the full AI matching engine
  const prompt = `
You are an AI recruitment matching expert. Analyze the match between this candidate and job posting.

CANDIDATE:
Name: ${candidate.name}
Skills: ${candidate.skills || 'Not specified'}
Experience: ${candidate.yearsOfExperience || 0} years
Education: ${candidate.education || 'Not specified'}

JOB POSTING:
Title: ${job.title}
Description: ${job.description || 'Not specified'}
Required Skills: ${job.requiredSkills || 'Not specified'}
Experience Required: ${job.experienceRequired || 0} years

Provide a JSON response with:
{
  "matchScore": 0-100,
  "skillMatchScore": 0-100,
  "cultureFitScore": 0-100,
  "wellbeingMatchScore": 0-100,
  "matchBreakdown": {
    "strengths": ["..."],
    "gaps": ["..."],
    "recommendations": ["..."]
  },
  "matchExplanation": "Brief explanation of the match"
}
`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are an AI recruitment matching expert." },
      { role: "user", content: prompt }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "match_result",
        strict: true,
        schema: {
          type: "object",
          properties: {
            matchScore: { type: "integer" },
            skillMatchScore: { type: "integer" },
            cultureFitScore: { type: "integer" },
            wellbeingMatchScore: { type: "integer" },
            matchBreakdown: {
              type: "object",
              properties: {
                strengths: { type: "array", items: { type: "string" } },
                gaps: { type: "array", items: { type: "string" } },
                recommendations: { type: "array", items: { type: "string" } }
              },
              required: ["strengths", "gaps", "recommendations"],
              additionalProperties: false
            },
            matchExplanation: { type: "string" }
          },
          required: ["matchScore", "skillMatchScore", "cultureFitScore", "wellbeingMatchScore", "matchBreakdown", "matchExplanation"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI matching engine");
  }

  const result = JSON.parse(content);

  return {
    candidateId: candidate.id,
    jobId: job.id,
    matchScore: result.matchScore,
    skillMatchScore: result.skillMatchScore,
    cultureFitScore: result.cultureFitScore,
    wellbeingMatchScore: result.wellbeingMatchScore,
    matchBreakdown: result.matchBreakdown,
    matchExplanation: result.matchExplanation,
  };
}

/**
 * Calculate average match score for a bulk job
 */
async function calculateAverageMatchScore(jobId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const results = await db.select()
    .from(bulkMatchResults)
    .where(eq(bulkMatchResults.jobId, jobId));

  const scores = results
    .filter(r => r.matchScore !== null)
    .map(r => r.matchScore as number);

  if (scores.length === 0) return 0;

  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

/**
 * Count high-quality matches (score ≥ 90) for a bulk job
 */
async function countHighQualityMatches(jobId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const results = await db.select()
    .from(bulkMatchResults)
    .where(eq(bulkMatchResults.jobId, jobId));

  return results.filter(r => r.matchScore !== null && r.matchScore >= 90).length;
}

/**
 * Get bulk matching job status
 */
export async function getBulkMatchJobStatus(jobId: number): Promise<any> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const [job] = await db.select()
    .from(bulkMatchJobs)
    .where(eq(bulkMatchJobs.id, jobId));

  return job;
}

/**
 * Get bulk matching results
 */
export async function getBulkMatchResults(jobId: number, limit: number = 100): Promise<any[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const results = await db.select()
    .from(bulkMatchResults)
    .where(eq(bulkMatchResults.jobId, jobId))
    .limit(limit);

  return results;
}

/**
 * Cancel a bulk matching job
 */
export async function cancelBulkMatchJob(jobId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(bulkMatchJobs)
    .set({
      status: 'cancelled',
      completedAt: new Date(),
    })
    .where(eq(bulkMatchJobs.id, jobId));

  console.log(`[BulkMatching] Job ${jobId} cancelled`);
}
