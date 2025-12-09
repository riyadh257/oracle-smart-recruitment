/**
 * AI Matching Engine Router
 * Phase 15: tRPC procedures for 10,000+ attribute matching, culture fit, and wellbeing compatibility
 */

import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { notifyHighQualityMatch } from "../realtimeNotifications";
import {
  extractJobAttributes,
  extractCandidateAttributes,
  calculateAttributeMatch,
  calculateOverallMatch,
  generateMatchExplanation,
  calculateCultureFitScore,
  calculateWellbeingCompatibilityScore
} from "../aiMatchingEngine";
import { calculateMatchScore, generateMatchExplanation as generateDetailedExplanation, getMatchedJobs } from "../aiMatching";
import {
  applications,
  jobs,
  candidates,
  matchDetails,
  // matchExplanations,
  // cultureFitScores,
  // wellbeingCompatibilityScores,
  candidateAttributeValues,
  jobRequirements,
  attributes,
  trainingPrograms
} from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const aiMatchingRouter = router({
  /**
   * Extract attributes from job description
   */
  extractJobAttributes: protectedProcedure
    .input(z.object({
      jobDescription: z.string().min(1)
    }))
    .mutation(async ({ input }) => {
      const extracted = await extractJobAttributes(input.jobDescription);
      return extracted;
    }),

  /**
   * Extract attributes from candidate resume
   */
  extractCandidateAttributes: protectedProcedure
    .input(z.object({
      resumeText: z.string().min(1)
    }))
    .mutation(async ({ input }) => {
      const extracted = await extractCandidateAttributes(input.resumeText);
      return extracted;
    }),

  /**
   * Calculate match score for a candidate-job pair
   */
  calculateMatch: protectedProcedure
    .input(z.object({
      candidateId: z.number(),
      jobId: z.number()
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get candidate and job data
      const [candidate] = await db.select().from(candidates).where(eq(candidates.id, input.candidateId)).limit(1);
      const [job] = await db.select().from(jobs).where(eq(jobs.id, input.jobId)).limit(1);

      if (!candidate || !job) {
        throw new Error("Candidate or job not found");
      }

      // For now, use simplified scoring based on existing fields
      // In production, this would use the full 10,000+ attribute system

      // Technical score (based on skills match)
      const candidateSkills = candidate.technicalSkills as string[] || [];
      const jobSkills = job.requiredSkills as string[] || [];
      const matchedSkills = candidateSkills.filter(skill => 
        jobSkills.some(reqSkill => 
          skill.toLowerCase().includes(reqSkill.toLowerCase()) ||
          reqSkill.toLowerCase().includes(skill.toLowerCase())
        )
      );
      const technicalScore = jobSkills.length > 0 
        ? Math.round((matchedSkills.length / jobSkills.length) * 100)
        : 50;

      // Culture fit score (placeholder - would use culture dimensions in production)
      const cultureScore = 75; // Default moderate fit

      // Wellbeing score (placeholder - would use wellbeing factors in production)
      const wellbeingScore = 80; // Default good compatibility

      // Calculate overall score
      const overallScore = calculateOverallMatch(technicalScore, cultureScore, wellbeingScore);

      // Create or update application
      const [existingApp] = await db.select().from(applications)
        .where(and(
          eq(applications.candidateId, input.candidateId),
          eq(applications.jobId, input.jobId)
        ))
        .limit(1);

      let applicationId: number;

      if (existingApp) {
        await db.update(applications)
          .set({
            overallMatchScore: overallScore,
            skillMatchScore: technicalScore,
            cultureFitScore: cultureScore,
            wellbeingMatchScore: wellbeingScore,
            updatedAt: new Date()
          })
          .where(eq(applications.id, existingApp.id));
        applicationId = existingApp.id;
      } else {
        const [newApp] = await db.insert(applications).values({
          candidateId: input.candidateId,
          jobId: input.jobId,
          overallMatchScore: overallScore,
          skillMatchScore: technicalScore,
          cultureFitScore: cultureScore,
          wellbeingMatchScore: wellbeingScore,
          status: "submitted"
        });
        applicationId = newApp.insertId;
      }

      // Generate AI explanation
      const explanation = await generateMatchExplanation(
        candidate.fullName,
        job.title,
        overallScore,
        technicalScore,
        cultureScore,
        wellbeingScore,
        matchedSkills.slice(0, 5),
        jobSkills.filter(skill => !matchedSkills.includes(skill)).slice(0, 3)
      );

      // Store explanation
      await db.insert(matchExplanations).values({
        applicationId,
        explanationType: "overall",
        score: overallScore,
        summary: explanation.summary,
        strengths: explanation.strengths,
        concerns: explanation.concerns,
        recommendations: explanation.recommendations
      });

      // Send real-time notification for high-quality matches (score ≥ 80)
      if (overallScore >= 80) {
        // Get job owner/employer ID
        const [jobWithEmployer] = await db.select({
          employerId: jobs.employerId
        })
          .from(jobs)
          .where(eq(jobs.id, input.jobId))
          .limit(1);

        if (jobWithEmployer?.employerId) {
          notifyHighQualityMatch(
            jobWithEmployer.employerId,
            {
              candidateName: candidate.fullName,
              jobTitle: job.title,
              matchScore: overallScore,
              matchId: applicationId,
              cultureFitScore: cultureScore,
              wellbeingScore: wellbeingScore
            }
          );
        }
      }

      return {
        applicationId,
        overallScore,
        technicalScore,
        cultureScore,
        wellbeingScore,
        explanation
      };
    }),

  /**
   * Get match details for an application
   */
  getMatchDetails: protectedProcedure
    .input(z.object({
      applicationId: z.number()
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [application] = await db.select().from(applications)
        .where(eq(applications.id, input.applicationId))
        .limit(1);

      if (!application) {
        throw new Error("Application not found");
      }

      // Get match explanations
      const explanations = await db.select().from(matchExplanations)
        .where(eq(matchExplanations.applicationId, input.applicationId));

      // Get culture fit scores
      const cultureScores = await db.select().from(cultureFitScores)
        .where(eq(cultureFitScores.applicationId, input.applicationId));

      // Get wellbeing scores
      const wellbeingScores = await db.select().from(wellbeingCompatibilityScores)
        .where(eq(wellbeingCompatibilityScores.applicationId, input.applicationId));

      return {
        application,
        explanations,
        cultureScores,
        wellbeingScores
      };
    }),

  /**
   * Get top matches for a job
   */
  getTopMatchesForJob: protectedProcedure
    .input(z.object({
      jobId: z.number(),
      limit: z.number().default(10),
      minScore: z.number().default(60)
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get all applications for this job with scores above threshold
      const matches = await db.select({
        application: applications,
        candidate: candidates
      })
        .from(applications)
        .innerJoin(candidates, eq(applications.candidateId, candidates.id))
        .where(and(
          eq(applications.jobId, input.jobId),
          // Note: This would need a proper comparison operator in production
        ))
        .limit(input.limit);

      // Filter by score and sort
      const filteredMatches = matches
        .filter(m => (m.application.overallMatchScore || 0) >= input.minScore)
        .sort((a, b) => (b.application.overallMatchScore || 0) - (a.application.overallMatchScore || 0));

      return filteredMatches;
    }),

  /**
   * Get recommended jobs for a candidate
   */
  getRecommendedJobsForCandidate: protectedProcedure
    .input(z.object({
      candidateId: z.number(),
      limit: z.number().default(10)
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get candidate
      const [candidate] = await db.select().from(candidates)
        .where(eq(candidates.id, input.candidateId))
        .limit(1);

      if (!candidate) {
        throw new Error("Candidate not found");
      }

      // Get active jobs
      const activeJobs = await db.select().from(jobs)
        .where(eq(jobs.status, "active"))
        .limit(50); // Get more than needed for scoring

      // Calculate match scores for each job
      const scoredJobs = activeJobs.map(job => {
        const candidateSkills = candidate.technicalSkills as string[] || [];
        const jobSkills = job.requiredSkills as string[] || [];
        
        const matchedSkills = candidateSkills.filter(skill => 
          jobSkills.some(reqSkill => 
            skill.toLowerCase().includes(reqSkill.toLowerCase()) ||
            reqSkill.toLowerCase().includes(skill.toLowerCase())
          )
        );
        
        const score = jobSkills.length > 0 
          ? Math.round((matchedSkills.length / jobSkills.length) * 100)
          : 50;

        return {
          job,
          matchScore: score,
          matchedSkills
        };
      });

      // Sort by score and return top matches
      const topMatches = scoredJobs
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, input.limit);

      return topMatches;
    }),

  /**
   * Generate detailed match explanation for a job
   * Provides actionable insights for candidates
   */
  getJobMatchExplanation: protectedProcedure
    .input(z.object({
      jobId: z.number()
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get current user's candidate profile
      const [candidate] = await db.select().from(candidates)
        .where(eq(candidates.userId, ctx.user.id))
        .limit(1);

      if (!candidate) {
        throw new Error("Candidate profile not found");
      }

      // Get job posting
      const [job] = await db.select().from(jobs)
        .where(eq(jobs.id, input.jobId))
        .limit(1);

      if (!job) {
        throw new Error("Job not found");
      }

      // Calculate match scores using comprehensive AI matching
      const matchScores = await calculateMatchScore(candidate, job);

      // Generate detailed explanation
      const explanation = await generateDetailedExplanation(
        candidate,
        job,
        matchScores
      );

      return {
        matchScores,
        explanation
      };
    }),

  /**
   * Get top 5 job matches for current candidate
   * Used for dashboard widget
   */
  getTopMatches: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get current user's candidate profile
      const [candidate] = await db.select().from(candidates)
        .where(eq(candidates.userId, ctx.user.id))
        .limit(1);

      if (!candidate) {
        return [];
      }

      // Get active jobs
      const activeJobs = await db.select().from(jobs)
        .where(eq(jobs.status, "active"))
        .limit(50);

      if (activeJobs.length === 0) {
        return [];
      }

      // Calculate match scores for each job
      const scoredJobs = await Promise.all(
        activeJobs.map(async (job) => {
          const matchScores = await calculateMatchScore(candidate, job);
          return {
            job,
            matchScore: matchScores.overallMatchScore,
            skillMatchScore: matchScores.skillMatchScore,
            cultureFitScore: matchScores.cultureFitScore,
            wellbeingMatchScore: matchScores.wellbeingMatchScore,
            matchedSkills: matchScores.matchBreakdown?.strengths || []
          };
        })
      );

      // Sort by overall match score and return top 5
      const topMatches = scoredJobs
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5);

      return topMatches;
    }),

  /**
   * Get training recommendations for a job
   * Analyzes skill gaps and recommends relevant training programs
   */
  getTrainingRecommendations: protectedProcedure
    .input(z.object({
      jobId: z.number()
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get current user's candidate profile
      const [candidate] = await db.select().from(candidates)
        .where(eq(candidates.userId, ctx.user.id))
        .limit(1);

      if (!candidate) {
        return { skillGaps: [], recommendedTraining: [], matchImpact: 0 };
      }

      // Get job posting
      const [job] = await db.select().from(jobs)
        .where(eq(jobs.id, input.jobId))
        .limit(1);

      if (!job) {
        throw new Error("Job not found");
      }

      // Calculate current match score
      const currentMatch = await calculateMatchScore(candidate, job);

      // Identify skill gaps
      const candidateSkills = (candidate.technicalSkills as string[]) || [];
      const requiredSkills = (job.requiredSkills as string[]) || [];
      const preferredSkills = (job.preferredSkills as string[]) || [];

      const missingRequired = requiredSkills.filter(skill => 
        !candidateSkills.some(cs => 
          cs.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(cs.toLowerCase())
        )
      );

      const missingPreferred = preferredSkills.filter(skill => 
        !candidateSkills.some(cs => 
          cs.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(cs.toLowerCase())
        )
      );

      // Get all training programs from database
      const { trainingPrograms } = await import("../../drizzle/schema");
      const allTraining = await db.select().from(trainingPrograms)
        .where(eq(trainingPrograms.status, "published"))
        .limit(100);

      // Match training programs to skill gaps
      const recommendedTraining = allTraining
        .map(program => {
          const programSkills = (program.skills as string[]) || [];
          const matchedGaps = [...missingRequired, ...missingPreferred].filter(gap =>
            programSkills.some(skill => 
              skill.toLowerCase().includes(gap.toLowerCase()) ||
              gap.toLowerCase().includes(skill.toLowerCase())
            )
          );

          if (matchedGaps.length === 0) return null;

          return {
            program,
            matchedGaps,
            relevanceScore: Math.round((matchedGaps.length / (missingRequired.length + missingPreferred.length)) * 100)
          };
        })
        .filter(Boolean)
        .sort((a, b) => (b?.relevanceScore || 0) - (a?.relevanceScore || 0))
        .slice(0, 5);

      // Estimate match score improvement
      const potentialSkillIncrease = recommendedTraining.reduce((acc, rec) => 
        acc + (rec?.matchedGaps.length || 0), 0
      );
      const estimatedImpact = Math.min(
        Math.round((potentialSkillIncrease / requiredSkills.length) * 30), // Max 30% improvement
        100 - currentMatch.overallMatchScore // Can't exceed 100%
      );

      return {
        currentMatchScore: currentMatch.overallMatchScore,
        skillGaps: [
          ...missingRequired.map(skill => ({ skill, priority: "required" as const })),
          ...missingPreferred.map(skill => ({ skill, priority: "preferred" as const }))
        ],
        recommendedTraining: recommendedTraining.filter(Boolean),
        estimatedMatchImpact: estimatedImpact,
        projectedMatchScore: Math.min(currentMatch.overallMatchScore + estimatedImpact, 100)
      };
    }),

  /**
   * Compare multiple matches side-by-side
   * Used by the match comparison tool
   */
  compareMatches: protectedProcedure
    .input(z.object({
      applicationIds: z.array(z.number()).min(1).max(10)
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Fetch all applications with candidate and job data
      const comparisonData = await Promise.all(
        input.applicationIds.map(async (appId) => {
          const [application] = await db.select().from(applications)
            .where(eq(applications.id, appId))
            .limit(1);

          if (!application) return null;

          const [candidate] = await db.select().from(candidates)
            .where(eq(candidates.id, application.candidateId))
            .limit(1);

          const [job] = await db.select().from(jobs)
            .where(eq(jobs.id, application.jobId))
            .limit(1);

          if (!candidate || !job) return null;

          return {
            applicationId: application.id,
            candidateId: candidate.id,
            candidateName: candidate.fullName,
            jobId: job.id,
            jobTitle: job.title,
            overallScore: application.overallMatchScore || 0,
            technicalScore: application.skillMatchScore || 0,
            cultureScore: application.cultureFitScore || 0,
            wellbeingScore: application.wellbeingMatchScore || 0,
            status: application.status
          };
        })
      );

      // Filter out null results
      const candidates = comparisonData.filter(Boolean);

      return { candidates };
    })
});
