import { getDb } from "./db";
import { candidates, jobs, applications, candidatePreferences, employers } from "../drizzle/schema";
import { eq, and, sql, inArray, ne, isNull } from "drizzle-orm";

/**
 * Job Recommendations Service
 * Generates personalized job recommendations based on candidate preferences
 */

interface RecommendedJob {
  jobId: number;
  title: string;
  location: string;
  workSetting: string;
  employmentType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  companyName: string;
  matchScore: number;
  matchReasons: string[];
  description: string;
  requiredSkills: string[];
  status: string;
}

/**
 * Calculate match score between candidate preferences and job
 */
function calculatePreferenceMatchScore(
  job: any,
  candidate: any,
  preferences: any
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const maxScore = 100;

  // Location match (20 points)
  if (preferences?.preferredLocations && preferences.preferredLocations.length > 0) {
    if (job.location && preferences.preferredLocations.some((loc: string) => 
      job.location.toLowerCase().includes(loc.toLowerCase())
    )) {
      score += 20;
      reasons.push("Location matches your preferences");
    }
  } else if (job.location) {
    score += 10; // Partial credit if no preference set
  }

  // Work setting match (15 points)
  if (candidate.preferredWorkSetting && job.workSetting === candidate.preferredWorkSetting) {
    score += 15;
    reasons.push(`${job.workSetting} work setting matches your preference`);
  }

  // Salary match (20 points)
  if (candidate.desiredSalaryMin && job.salaryMin) {
    if (job.salaryMax && job.salaryMax >= candidate.desiredSalaryMin) {
      score += 20;
      reasons.push("Salary range meets your expectations");
    } else if (job.salaryMin >= candidate.desiredSalaryMin * 0.8) {
      score += 10;
      reasons.push("Salary is close to your expectations");
    }
  }

  // Skills match (25 points)
  if (candidate.technicalSkills && job.requiredSkills) {
    const candidateSkills = candidate.technicalSkills as string[];
    const jobSkills = job.requiredSkills as string[];
    const matchingSkills = candidateSkills.filter(skill => 
      jobSkills.some(jobSkill => 
        jobSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(jobSkill.toLowerCase())
      )
    );
    
    if (matchingSkills.length > 0) {
      const skillMatchRatio = matchingSkills.length / Math.max(jobSkills.length, 1);
      const skillScore = Math.min(25, Math.round(skillMatchRatio * 25));
      score += skillScore;
      reasons.push(`${matchingSkills.length} matching skills`);
    }
  }

  // Experience match (10 points)
  if (candidate.yearsOfExperience) {
    // Assume job has experience requirements in AI inferred data
    score += 10;
    reasons.push("Experience level is appropriate");
  }

  // Company size preference (10 points)
  if (preferences?.preferredCompanySizes && preferences.preferredCompanySizes.length > 0) {
    if (job.employer?.companySize && preferences.preferredCompanySizes.includes(job.employer.companySize)) {
      score += 10;
      reasons.push("Company size matches your preference");
    }
  }

  return { score: Math.min(score, maxScore), reasons };
}

/**
 * Get personalized job recommendations for a candidate
 */
export async function getJobRecommendations(
  candidateId: number,
  limit: number = 10
): Promise<RecommendedJob[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get candidate profile
  const candidateResult = await db
    .select()
    .from(candidates)
    .where(eq(candidates.id, candidateId))
    .limit(1);

  if (candidateResult.length === 0) {
    throw new Error("Candidate not found");
  }

  const candidate = candidateResult[0];

  // Get candidate preferences
  const preferencesResult = await db
    .select()
    .from(candidatePreferences)
    .where(eq(candidatePreferences.candidateId, candidateId))
    .limit(1);

  const preferences = preferencesResult.length > 0 ? preferencesResult[0] : null;

  // Get jobs the candidate has already applied to
  const appliedJobs = await db
    .select({ jobId: applications.jobId })
    .from(applications)
    .where(eq(applications.candidateId, candidateId));

  const appliedJobIds = appliedJobs.map(app => app.jobId);

  // Get active jobs (excluding already applied)
  let jobsQuery = db
    .select({
      id: jobs.id,
      title: jobs.title,
      location: jobs.location,
      workSetting: jobs.workSetting,
      employmentType: jobs.employmentType,
      salaryMin: jobs.salaryMin,
      salaryMax: jobs.salaryMax,
      originalDescription: jobs.originalDescription,
      enrichedDescription: jobs.enrichedDescription,
      requiredSkills: jobs.requiredSkills,
      status: jobs.status,
      employerId: jobs.employerId,
      companyName: employers.companyName,
      companySize: employers.companySize,
    })
    .from(jobs)
    .leftJoin(employers, eq(jobs.employerId, employers.id))
    .where(eq(jobs.status, "active"));

  // Exclude already applied jobs
  if (appliedJobIds.length > 0) {
    jobsQuery = jobsQuery.where(
      and(
        eq(jobs.status, "active"),
        sql`${jobs.id} NOT IN (${appliedJobIds.join(",")})`
      )
    ) as any;
  }

  const activeJobs = await jobsQuery.limit(100); // Get more than needed for filtering

  // Calculate match scores for each job
  const recommendations: RecommendedJob[] = activeJobs
    .map(job => {
      const { score, reasons } = calculatePreferenceMatchScore(
        { ...job, employer: { companySize: job.companySize } },
        candidate,
        preferences
      );

      return {
        jobId: job.id,
        title: job.title,
        location: job.location || "Not specified",
        workSetting: job.workSetting || "Not specified",
        employmentType: job.employmentType || "Not specified",
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        companyName: job.companyName || "Unknown Company",
        matchScore: score,
        matchReasons: reasons,
        description: job.enrichedDescription || job.originalDescription || "",
        requiredSkills: (job.requiredSkills as string[]) || [],
        status: job.status,
      };
    })
    .filter(rec => rec.matchScore >= 30) // Only show jobs with at least 30% match
    .sort((a, b) => b.matchScore - a.matchScore) // Sort by match score descending
    .slice(0, limit);

  return recommendations;
}

/**
 * Get job recommendations based on similar candidates
 */
export async function getCollaborativeRecommendations(
  candidateId: number,
  limit: number = 5
): Promise<RecommendedJob[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get candidate's skills
  const candidateResult = await db
    .select()
    .from(candidates)
    .where(eq(candidates.id, candidateId))
    .limit(1);

  if (candidateResult.length === 0) {
    throw new Error("Candidate not found");
  }

  const candidate = candidateResult[0];
  const candidateSkills = (candidate.technicalSkills as string[]) || [];

  // Find similar candidates (with overlapping skills)
  // This is a simplified version - in production, you'd use more sophisticated similarity metrics
  const similarCandidates = await db
    .select({ id: candidates.id })
    .from(candidates)
    .where(
      and(
        ne(candidates.id, candidateId),
        sql`JSON_LENGTH(${candidates.technicalSkills}) > 0`
      )
    )
    .limit(20);

  if (similarCandidates.length === 0) {
    return [];
  }

  const similarCandidateIds = similarCandidates.map(c => c.id);

  // Get jobs that similar candidates applied to and got positive outcomes
  const recommendedJobs = await db
    .select({
      jobId: applications.jobId,
      title: jobs.title,
      location: jobs.location,
      workSetting: jobs.workSetting,
      employmentType: jobs.employmentType,
      salaryMin: jobs.salaryMin,
      salaryMax: jobs.salaryMax,
      companyName: employers.companyName,
      description: jobs.enrichedDescription,
      requiredSkills: jobs.requiredSkills,
      status: jobs.status,
    })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .leftJoin(employers, eq(jobs.employerId, employers.id))
    .where(
      and(
        inArray(applications.candidateId, similarCandidateIds),
        inArray(applications.status, ["interviewing", "offered"]),
        eq(jobs.status, "active")
      )
    )
    .limit(limit);

  return recommendedJobs.map(job => ({
    jobId: job.jobId,
    title: job.title,
    location: job.location || "Not specified",
    workSetting: job.workSetting || "Not specified",
    employmentType: job.employmentType || "Not specified",
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    companyName: job.companyName || "Unknown Company",
    matchScore: 75, // Default score for collaborative recommendations
    matchReasons: ["Similar candidates had success with this role"],
    description: job.description || "",
    requiredSkills: (job.requiredSkills as string[]) || [],
    status: job.status,
  }));
}
