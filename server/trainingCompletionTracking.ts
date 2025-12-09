/**
 * Training Completion Tracking Service
 * Handles marking training as completed and automatically recalculating match scores
 */

import { getDb } from "./db";
import { programEnrollments, candidates, jobs, applications, trainingPrograms } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { calculateMatchScore } from "./aiMatching";

interface CompletionResult {
  success: boolean;
  enrollmentId: number;
  certificateUrl?: string;
  matchScoreImprovements: Array<{
    jobId: number;
    jobTitle: string;
    previousScore: number;
    newScore: number;
    improvement: number;
  }>;
}

/**
 * Mark a training program as completed for a candidate
 * Automatically recalculates match scores for all jobs
 */
export async function completeTrainingProgram(
  userId: number,
  programId: number
): Promise<CompletionResult> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get the enrollment
  const [enrollment] = await db.select()
    .from(programEnrollments)
    .where(and(
      eq(programEnrollments.userId, userId),
      eq(programEnrollments.programId, programId)
    ))
    .limit(1);

  if (!enrollment) {
    throw new Error("Enrollment not found");
  }

  if (enrollment.status === 'completed') {
    throw new Error("Training already marked as completed");
  }

  // Get the training program to extract skills gained
  const [program] = await db.select()
    .from(trainingPrograms)
    .where(eq(trainingPrograms.id, programId))
    .limit(1);

  if (!program) {
    throw new Error("Training program not found");
  }

  // Mark as completed
  const completedAt = new Date();
  await db.update(programEnrollments)
    .set({
      status: 'completed',
      completedAt: completedAt.toISOString(),
      progress: 10000 // 100%
    })
    .where(eq(programEnrollments.id, enrollment.id));

  // Update candidate's skills with newly gained skills
  const [candidate] = await db.select()
    .from(candidates)
    .where(eq(candidates.userId, userId))
    .limit(1);

  if (candidate) {
    const skillsGained = (program.skillsGained as string[]) || [];
    const currentSkills = Array.isArray(candidate.technicalSkills)
      ? candidate.technicalSkills
      : (candidate.technicalSkills ? JSON.parse(candidate.technicalSkills as any) : []);
    
    // Add new skills (avoid duplicates)
    const updatedSkills = Array.from(new Set([...currentSkills, ...skillsGained]));
    
    await db.update(candidates)
      .set({
        technicalSkills: updatedSkills as any,
        updatedAt: new Date().toISOString()
      })
      .where(eq(candidates.id, candidate.id));

    // Recalculate match scores for all active jobs
    const matchScoreImprovements = await recalculateMatchScores(candidate.id);

    // TODO: Generate and store certificate
    const certificateUrl = undefined; // Placeholder for certificate generation

    return {
      success: true,
      enrollmentId: enrollment.id,
      certificateUrl,
      matchScoreImprovements
    };
  }

  return {
    success: true,
    enrollmentId: enrollment.id,
    matchScoreImprovements: []
  };
}

/**
 * Recalculate match scores for a candidate across all active jobs
 * Returns improvements for display
 */
async function recalculateMatchScores(candidateId: number): Promise<Array<{
  jobId: number;
  jobTitle: string;
  previousScore: number;
  newScore: number;
  improvement: number;
}>> {
  const db = await getDb();
  if (!db) return [];

  const [candidate] = await db.select()
    .from(candidates)
    .where(eq(candidates.id, candidateId))
    .limit(1);

  if (!candidate) return [];

  // Get all active jobs
  const activeJobs = await db.select()
    .from(jobs)
    .where(eq(jobs.status, 'active'));

  const improvements: Array<{
    jobId: number;
    jobTitle: string;
    previousScore: number;
    newScore: number;
    improvement: number;
  }> = [];

  for (const job of activeJobs) {
    try {
      // Get previous match score if exists
      const [existingApp] = await db.select()
        .from(applications)
        .where(and(
          eq(applications.candidateId, candidateId),
          eq(applications.jobId, job.id)
        ))
        .limit(1);

      const previousScore = existingApp?.overallMatchScore || 0;

      // Calculate new match score
      const newScores = await calculateMatchScore(candidate, job);
      const newScore = newScores.overallMatchScore;

      // Update or create application with new scores
      if (existingApp) {
        await db.update(applications)
          .set({
            overallMatchScore: newScore,
            skillMatchScore: newScores.skillMatchScore,
            cultureFitScore: newScores.cultureFitScore,
            wellbeingMatchScore: newScores.wellbeingMatchScore,
            matchBreakdown: newScores.matchBreakdown as any,
            updatedAt: new Date().toISOString()
          })
          .where(eq(applications.id, existingApp.id));
      }

      // Track significant improvements (5%+)
      const improvement = newScore - previousScore;
      if (improvement >= 5) {
        improvements.push({
          jobId: job.id,
          jobTitle: job.title,
          previousScore,
          newScore,
          improvement
        });
      }
    } catch (error) {
      console.error(`Error recalculating match for job ${job.id}:`, error);
      // Continue with other jobs
    }
  }

  // Sort by improvement descending
  improvements.sort((a, b) => b.improvement - a.improvement);

  return improvements;
}

/**
 * Get training recommendations for a candidate based on skill gaps
 */
export async function getTrainingRecommendations(
  candidateId: number,
  jobId?: number
): Promise<Array<{
  programId: number;
  title: string;
  description: string;
  skillsGained: string[];
  estimatedImpact: number;
  isEnrolled: boolean;
  isCompleted: boolean;
}>> {
  const db = await getDb();
  if (!db) return [];

  const [candidate] = await db.select()
    .from(candidates)
    .where(eq(candidates.id, candidateId))
    .limit(1);

  if (!candidate) return [];

  const candidateSkills = Array.isArray(candidate.technicalSkills)
    ? candidate.technicalSkills
    : (candidate.technicalSkills ? JSON.parse(candidate.technicalSkills as any) : []);

  // If specific job provided, get skill gaps for that job
  let targetSkills: string[] = [];
  if (jobId) {
    const [job] = await db.select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (job) {
      const jobSkills = Array.isArray(job.requiredSkills)
        ? job.requiredSkills
        : (job.requiredSkills ? JSON.parse(job.requiredSkills as any) : []);
      
      targetSkills = jobSkills.filter((skill: string) => 
        !candidateSkills.some((cSkill: string) => 
          cSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(cSkill.toLowerCase())
        )
      );
    }
  }

  // Get all published training programs
  const programs = await db.select()
    .from(trainingPrograms)
    .where(eq(trainingPrograms.isPublished, 1));

  // Get candidate's enrollments
  const enrollments = await db.select()
    .from(programEnrollments)
    .where(eq(programEnrollments.userId, candidate.userId));

  const recommendations: Array<{
    programId: number;
    title: string;
    description: string;
    skillsGained: string[];
    estimatedImpact: number;
    isEnrolled: boolean;
    isCompleted: boolean;
  }> = [];

  for (const program of programs) {
    const skillsGained = (program.skillsGained as string[]) || [];
    
    // Calculate how many target skills this program teaches
    const relevantSkills = targetSkills.length > 0
      ? skillsGained.filter(skill => targetSkills.includes(skill))
      : skillsGained;

    if (relevantSkills.length > 0) {
      const enrollment = enrollments.find(e => e.programId === program.id);
      
      // Estimate impact based on number of relevant skills
      const estimatedImpact = Math.min(relevantSkills.length * 5, 25); // Max 25% improvement

      recommendations.push({
        programId: program.id,
        title: program.title,
        description: program.description || '',
        skillsGained: relevantSkills,
        estimatedImpact,
        isEnrolled: !!enrollment,
        isCompleted: enrollment?.status === 'completed'
      });
    }
  }

  // Sort by estimated impact descending
  recommendations.sort((a, b) => b.estimatedImpact - a.estimatedImpact);

  return recommendations.slice(0, 5); // Return top 5 recommendations
}
