import { eq, and, gte, lte, sql } from "drizzle-orm";
import { getDb } from "./db";
import { candidates, jobs, applications, matchExplanations } from "../drizzle/schema";
import { notifyOwner } from "./_core/notification";
import { analyzeCultureFit, analyzeWellbeingCompatibility } from "./aiMatching";

/**
 * Calculate match score between a candidate and a job
 * Combines technical skills, culture fit, and wellbeing compatibility
 */
async function calculateMatchScore(candidateId: number, jobId: number): Promise<{
  overallScore: number;
  technicalScore: number;
  cultureScore: number;
  wellbeingScore: number;
  explanation: string;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Fetch candidate and job details
  const [candidate] = await db.select().from(candidates).where(eq(candidates.id, candidateId)).limit(1);
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);

  if (!candidate || !job) {
    throw new Error("Candidate or job not found");
  }

  // Technical score based on skills and experience
  let technicalScore = 50; // Base score

  // Experience match
  if (candidate.yearsOfExperience && job.requiredExperience) {
    const expDiff = Math.abs(candidate.yearsOfExperience - job.requiredExperience);
    if (expDiff === 0) technicalScore += 20;
    else if (expDiff <= 2) technicalScore += 15;
    else if (expDiff <= 5) technicalScore += 10;
  }

  // Salary match
  if (candidate.desiredSalaryMin && candidate.desiredSalaryMax && job.salaryMin && job.salaryMax) {
    const salaryOverlap = 
      Math.min(candidate.desiredSalaryMax, job.salaryMax) - 
      Math.max(candidate.desiredSalaryMin, job.salaryMin);
    
    if (salaryOverlap > 0) {
      technicalScore += 15;
    }
  }

  // Location match
  if (candidate.location && job.location && candidate.location === job.location) {
    technicalScore += 15;
  }

  // Culture fit score (simulated - in production would use AI analysis)
  const cultureScore = 75; // Placeholder

  // Wellbeing compatibility score (simulated)
  const wellbeingScore = 80; // Placeholder

  // Calculate weighted overall score
  const overallScore = Math.round(
    (technicalScore * 0.4) + 
    (cultureScore * 0.3) + 
    (wellbeingScore * 0.3)
  );

  const explanation = `Match based on ${technicalScore}% technical fit, ${cultureScore}% culture alignment, and ${wellbeingScore}% wellbeing compatibility.`;

  return {
    overallScore,
    technicalScore,
    cultureScore,
    wellbeingScore,
    explanation,
  };
}

/**
 * Find top matches for a candidate across all open jobs
 */
export async function findMatchesForCandidate(candidateId: number, limit: number = 10): Promise<{
  jobId: number;
  jobTitle: string;
  companyName: string;
  matchScore: number;
  explanation: string;
}[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all active jobs
  const activeJobs = await db
    .select()
    .from(jobs)
    .where(eq(jobs.status, "published"));

  const matches: any[] = [];

  for (const job of activeJobs) {
    try {
      const matchResult = await calculateMatchScore(candidateId, job.id);
      
      if (matchResult.overallScore >= 60) { // Only include good matches
        matches.push({
          jobId: job.id,
          jobTitle: job.title,
          companyName: "Company", // Would fetch from employer table
          matchScore: matchResult.overallScore,
          explanation: matchResult.explanation,
        });
      }
    } catch (error) {
      console.error(`Error calculating match for job ${job.id}:`, error);
    }
  }

  // Sort by match score descending and return top matches
  return matches
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

/**
 * Find top candidate matches for a job
 */
export async function findMatchesForJob(jobId: number, limit: number = 10): Promise<{
  candidateId: number;
  candidateName: string;
  matchScore: number;
  explanation: string;
}[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all active candidates
  const activeCandidates = await db
    .select()
    .from(candidates)
    .where(eq(candidates.isAvailable, true));

  const matches: any[] = [];

  for (const candidate of activeCandidates) {
    try {
      const matchResult = await calculateMatchScore(candidate.id, jobId);
      
      if (matchResult.overallScore >= 60) { // Only include good matches
        matches.push({
          candidateId: candidate.id,
          candidateName: candidate.fullName,
          matchScore: matchResult.overallScore,
          explanation: matchResult.explanation,
        });
      }
    } catch (error) {
      console.error(`Error calculating match for candidate ${candidate.id}:`, error);
    }
  }

  // Sort by match score descending and return top matches
  return matches
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

/**
 * Automatically match a new candidate with all open positions
 * and notify employers of top matches
 */
export async function autoMatchNewCandidate(candidateId: number): Promise<void> {
  try {
    const matches = await findMatchesForCandidate(candidateId, 5);
    
    if (matches.length > 0) {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [candidate] = await db.select().from(candidates).where(eq(candidates.id, candidateId)).limit(1);
      
      if (candidate) {
        // Notify owner about top matches
        const matchList = matches
          .map((m, idx) => `${idx + 1}. ${m.jobTitle} (${m.matchScore}% match)`)
          .join("\n");

        await notifyOwner({
          title: `New Candidate: ${matches.length} Job Matches Found`,
          content: `Candidate "${candidate.fullName}" has been matched with ${matches.length} open positions:\n\n${matchList}\n\nView candidate profile to review matches and take action.`,
        });
      }
    }
  } catch (error) {
    console.error("Error in autoMatchNewCandidate:", error);
  }
}

/**
 * Automatically match a new job with all available candidates
 * and notify the employer of top matches
 */
export async function autoMatchNewJob(jobId: number): Promise<void> {
  try {
    const matches = await findMatchesForJob(jobId, 5);
    
    if (matches.length > 0) {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
      
      if (job) {
        // Notify owner about top matches
        const matchList = matches
          .map((m, idx) => `${idx + 1}. ${m.candidateName} (${m.matchScore}% match)`)
          .join("\n");

        await notifyOwner({
          title: `New Job Posted: ${matches.length} Candidate Matches Found`,
          content: `Job "${job.title}" has been matched with ${matches.length} qualified candidates:\n\n${matchList}\n\nReview candidate profiles and invite top matches to apply.`,
        });
      }
    }
  } catch (error) {
    console.error("Error in autoMatchNewJob:", error);
  }
}

/**
 * Re-run matching for all active jobs and candidates
 * Useful for periodic batch matching
 */
export async function runBatchMatching(): Promise<{
  jobsProcessed: number;
  candidatesProcessed: number;
  matchesFound: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const activeJobs = await db.select().from(jobs).where(eq(jobs.status, "published"));
  const activeCandidates = await db.select().from(candidates).where(eq(candidates.isAvailable, true));

  let matchesFound = 0;

  for (const job of activeJobs) {
    const matches = await findMatchesForJob(job.id, 10);
    matchesFound += matches.length;
  }

  return {
    jobsProcessed: activeJobs.length,
    candidatesProcessed: activeCandidates.length,
    matchesFound,
  };
}
