/**
 * Job Match Notification Service
 * Automatically notifies candidates when new high-scoring jobs are posted
 */

import { getDb } from "./db";
import { jobs, candidates, applications, notificationPreferences } from "../drizzle/schema";
import { eq, and, gte, isNull, or } from "drizzle-orm";
import { sendJobMatchNotification } from "./emailDelivery";
import { calculateMatchScore, generateMatchExplanation } from "./aiMatching";

interface NewJobMatch {
  candidateId: number;
  candidateEmail: string;
  candidateName: string;
  jobId: number;
  jobTitle: string;
  matchScore: number;
  matchExplanation: {
    summary: string;
    topMatchedSkills: string[];
    growthOpportunities: string[];
  };
}

/**
 * Process a newly posted job and notify all matching candidates
 */
export async function notifyMatchingCandidatesForNewJob(jobId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[JobMatchNotifications] Database not available");
    return;
  }

  try {
    // Get the new job
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    if (!job || job.status !== 'active') {
      console.log(`[JobMatchNotifications] Job ${jobId} not found or not active`);
      return;
    }

    // Get all active candidates
    const allCandidates = await db.select().from(candidates);
    
    console.log(`[JobMatchNotifications] Processing ${allCandidates.length} candidates for job ${job.title}`);

    const matches: NewJobMatch[] = [];

    // Calculate match scores for all candidates
    for (const candidate of allCandidates) {
      try {
        // Skip if candidate has already applied
        const [existingApp] = await db.select()
          .from(applications)
          .where(and(
            eq(applications.candidateId, candidate.id),
            eq(applications.jobId, jobId)
          ))
          .limit(1);

        if (existingApp) {
          continue; // Skip candidates who already applied
        }

        // Calculate match score
        const matchScores = await calculateMatchScore(candidate, job);
        
        // Only notify for high-scoring matches (70%+)
        if (matchScores.overallMatchScore >= 70) {
          // Generate match explanation
          const explanation = await generateMatchExplanation(candidate, job, matchScores);
          
          matches.push({
            candidateId: candidate.id,
            candidateEmail: candidate.email,
            candidateName: candidate.fullName,
            jobId: job.id,
            jobTitle: job.title,
            matchScore: matchScores.overallMatchScore,
            matchExplanation: {
              summary: explanation.summary,
              topMatchedSkills: explanation.matchedSkills.slice(0, 3),
              growthOpportunities: explanation.growthOpportunities.slice(0, 2)
            }
          });
        }
      } catch (error) {
        console.error(`[JobMatchNotifications] Error processing candidate ${candidate.id}:`, error);
        // Continue with next candidate
      }
    }

    console.log(`[JobMatchNotifications] Found ${matches.length} high-quality matches for job ${job.title}`);

    // Send notifications based on candidate preferences
    await sendMatchNotifications(matches);

  } catch (error) {
    console.error(`[JobMatchNotifications] Error processing job ${jobId}:`, error);
  }
}

/**
 * Send match notifications to candidates based on their preferences
 */
async function sendMatchNotifications(matches: NewJobMatch[]): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Group matches by candidate for batching
  const matchesByCandidate = new Map<number, NewJobMatch[]>();
  
  for (const match of matches) {
    const existing = matchesByCandidate.get(match.candidateId) || [];
    existing.push(match);
    matchesByCandidate.set(match.candidateId, existing);
  }

  // Process each candidate's matches
  for (const [candidateId, candidateMatches] of matchesByCandidate.entries()) {
    try {
      // Get candidate's notification preferences
      // For now, send immediately (realtime)
      // TODO: Implement daily/weekly digest based on preferences
      
      const candidate = candidateMatches[0]; // All matches have same candidate info
      
      // Send email notification for each high-quality match
      for (const match of candidateMatches) {
        await sendJobMatchNotification({
          to: match.candidateEmail,
          candidateName: match.candidateName,
          jobTitle: match.jobTitle,
          jobId: match.jobId,
          matchScore: match.matchScore,
          matchSummary: match.matchExplanation.summary,
          topSkills: match.matchExplanation.topMatchedSkills,
          growthOpportunities: match.matchExplanation.growthOpportunities
        });
        
        console.log(`[JobMatchNotifications] Sent notification to ${match.candidateEmail} for job ${match.jobTitle} (${match.matchScore}% match)`);
      }
    } catch (error) {
      console.error(`[JobMatchNotifications] Error sending notifications to candidate ${candidateId}:`, error);
    }
  }
}

/**
 * Monitor for new jobs and trigger matching
 * This should be called when a new job is created
 */
export async function onJobCreated(jobId: number): Promise<void> {
  console.log(`[JobMatchNotifications] New job created: ${jobId}, starting candidate matching...`);
  
  // Run matching asynchronously to avoid blocking job creation
  setImmediate(async () => {
    try {
      await notifyMatchingCandidatesForNewJob(jobId);
    } catch (error) {
      console.error(`[JobMatchNotifications] Error in background matching for job ${jobId}:`, error);
    }
  });
}
