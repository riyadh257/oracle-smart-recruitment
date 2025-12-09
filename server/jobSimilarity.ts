import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import { notifyNewJobMatch } from "./emailNotifications";

/**
 * Job Similarity Detection Service
 * Uses AI to detect similar jobs and notify candidates
 */

interface JobSimilarityScore {
  jobId: number;
  similarityScore: number;
  reasons: string[];
}

/**
 * Calculate similarity between two jobs using AI
 */
export async function calculateJobSimilarity(
  savedJob: any,
  newJob: any
): Promise<{ score: number; reasons: string[] }> {
  try {
    const prompt = `Compare these two job postings and determine their similarity on a scale of 0-100.

Job 1 (Saved):
Title: ${savedJob.title}
Location: ${savedJob.location || "Not specified"}
Work Setting: ${savedJob.workSetting || "Not specified"}
Employment Type: ${savedJob.employmentType || "Not specified"}
Required Skills: ${savedJob.requiredSkills?.join(", ") || "Not specified"}
Description: ${savedJob.enrichedDescription || savedJob.originalDescription || "Not specified"}

Job 2 (New):
Title: ${newJob.title}
Location: ${newJob.location || "Not specified"}
Work Setting: ${newJob.workSetting || "Not specified"}
Employment Type: ${newJob.employmentType || "Not specified"}
Required Skills: ${newJob.requiredSkills?.join(", ") || "Not specified"}
Description: ${newJob.enrichedDescription || newJob.originalDescription || "Not specified"}

Analyze the similarity based on:
1. Job title and role type
2. Required skills and qualifications
3. Work setting and location
4. Employment type
5. Job responsibilities and description

Return your analysis in JSON format.`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an expert job matching analyst. Analyze job similarities objectively and provide detailed reasoning.",
        },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "job_similarity",
          strict: true,
          schema: {
            type: "object",
            properties: {
              similarity_score: {
                type: "integer",
                description: "Similarity score from 0-100",
              },
              reasons: {
                type: "array",
                items: { type: "string" },
                description: "List of reasons explaining the similarity",
              },
            },
            required: ["similarity_score", "reasons"],
            additionalProperties: false,
          },
        },
      },
    });

    const result = JSON.parse(response.choices[0].message.content);
    return {
      score: result.similarity_score,
      reasons: result.reasons,
    };
  } catch (error) {
    console.error("Error calculating job similarity:", error);
    // Fallback to basic similarity check
    return calculateBasicSimilarity(savedJob, newJob);
  }
}

/**
 * Fallback basic similarity calculation without AI
 */
function calculateBasicSimilarity(
  savedJob: any,
  newJob: any
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Title similarity (30 points)
  if (savedJob.title && newJob.title) {
    const titleWords1 = savedJob.title.toLowerCase().split(/\s+/);
    const titleWords2 = newJob.title.toLowerCase().split(/\s+/);
    const commonWords = titleWords1.filter((word: string) =>
      titleWords2.includes(word)
    );
    const titleScore = (commonWords.length / Math.max(titleWords1.length, titleWords2.length)) * 30;
    score += titleScore;
    if (titleScore > 15) {
      reasons.push("Similar job titles");
    }
  }

  // Skills similarity (40 points)
  if (savedJob.requiredSkills && newJob.requiredSkills) {
    const skills1 = savedJob.requiredSkills.map((s: string) => s.toLowerCase());
    const skills2 = newJob.requiredSkills.map((s: string) => s.toLowerCase());
    const commonSkills = skills1.filter((skill: string) => skills2.includes(skill));
    const skillScore = (commonSkills.length / Math.max(skills1.length, skills2.length)) * 40;
    score += skillScore;
    if (commonSkills.length > 0) {
      reasons.push(`${commonSkills.length} matching skills`);
    }
  }

  // Work setting match (15 points)
  if (savedJob.workSetting === newJob.workSetting) {
    score += 15;
    reasons.push("Same work setting");
  }

  // Employment type match (15 points)
  if (savedJob.employmentType === newJob.employmentType) {
    score += 15;
    reasons.push("Same employment type");
  }

  return { score: Math.round(score), reasons };
}

/**
 * Find similar jobs for a saved job
 */
export async function findSimilarJobs(
  savedJobId: number,
  threshold: number = 70
): Promise<JobSimilarityScore[]> {
  const savedJobData = await db.getJobById(savedJobId);
  if (!savedJobData) return [];

  // Get all active jobs except the saved one
  const allJobs = await db.getActiveJobs();
  const similarJobs: JobSimilarityScore[] = [];

  for (const job of allJobs) {
    if (job.id === savedJobId) continue;

    const similarity = await calculateJobSimilarity(savedJobData, job);
    if (similarity.score >= threshold) {
      similarJobs.push({
        jobId: job.id,
        similarityScore: similarity.score,
        reasons: similarity.reasons,
      });
    }
  }

  return similarJobs.sort((a, b) => b.similarityScore - a.similarityScore);
}

/**
 * Check for similar jobs and notify candidate
 */
export async function checkAndNotifySimilarJobs(
  newJobId: number
): Promise<void> {
  try {
    const newJob = await db.getJobById(newJobId);
    if (!newJob || newJob.status !== "active") return;

    // Get all saved jobs
    const allSavedJobs = await db.getAllSavedJobs();

    for (const saved of allSavedJobs) {
      // Skip if this job is already saved by this candidate
      if (saved.jobId === newJobId) continue;

      const savedJob = await db.getJobById(saved.jobId);
      if (!savedJob) continue;

      const similarity = await calculateJobSimilarity(savedJob, newJob);

      // Notify if similarity is high enough (70%+)
      if (similarity.score >= 70) {
        const candidate = await db.getCandidateById(saved.candidateId);
        const employer = await db.getEmployerById(newJob.employerId);

        if (candidate && employer) {
          await notifyNewJobMatch(
            candidate.fullName,
            candidate.email,
            newJob.title,
            employer.companyName,
            similarity.score,
            newJob.id
          );

          console.log(
            `Notified candidate ${candidate.id} about similar job ${newJob.id} (${similarity.score}% match)`
          );
        }
      }
    }
  } catch (error) {
    console.error("Error checking similar jobs:", error);
  }
}

/**
 * Batch process: Check all recent jobs for similarities
 * This can be run as a scheduled task
 */
export async function batchCheckSimilarJobs(
  hoursBack: number = 24
): Promise<void> {
  try {
    const recentJobs = await db.getRecentJobs(hoursBack);

    for (const job of recentJobs) {
      await checkAndNotifySimilarJobs(job.id);
    }

    console.log(`Batch processed ${recentJobs.length} recent jobs for similarity notifications`);
  } catch (error) {
    console.error("Error in batch similar jobs check:", error);
  }
}
