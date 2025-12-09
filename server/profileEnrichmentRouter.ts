import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { 
  profileEnrichmentJobs, 
  enrichmentResults, 
  enrichmentMetrics,
  candidates 
} from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";

/**
 * Profile Enrichment Router
 * 
 * Provides procedures for AI-powered candidate profile enrichment:
 * - Extract skills, experience, education, certifications from resumes
 * - Track enrichment status and history
 * - Store enrichment results in database
 * - Calculate enrichment metrics
 */

export const profileEnrichmentRouter = router({
  /**
   * Get enrichment status for a candidate
   */
  getEnrichmentStatus: protectedProcedure
    .input(z.object({
      candidateId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const jobs = await db
        .select()
        .from(profileEnrichmentJobs)
        .where(eq(profileEnrichmentJobs.candidateId, input.candidateId))
        .orderBy(desc(profileEnrichmentJobs.createdAt))
        .limit(1);

      if (jobs.length === 0) {
        return {
          status: 'not_started' as const,
          lastEnrichment: null,
        };
      }

      const job = jobs[0];
      return {
        status: job?.status || 'not_started',
        lastEnrichment: job ? {
          id: job.id,
          status: job.status,
          enrichmentType: job.enrichmentType,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
          processingTime: job.processingTime,
          errorMessage: job.errorMessage,
        } : null,
      };
    }),

  /**
   * Start profile enrichment for a candidate
   */
  enrichProfile: protectedProcedure
    .input(z.object({
      candidateId: z.number(),
      enrichmentType: z.enum(['full', 'skills', 'experience', 'education', 'certifications']).default('full'),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const startTime = Date.now();

      // Create enrichment job
      const [job] = await db.insert(profileEnrichmentJobs).values({
        candidateId: input.candidateId,
        userId: ctx.user.id,
        status: 'processing',
        enrichmentType: input.enrichmentType,
        dataSource: 'resume',
        startedAt: new Date().toISOString(),
      }).$returningId();

      try {
        // Get candidate data
        const [candidate] = await db
          .select()
          .from(candidates)
          .where(eq(candidates.id, input.candidateId))
          .limit(1);

        if (!candidate) {
          throw new Error("Candidate not found");
        }

        // Extract data using LLM
        const enrichmentData = await extractCandidateData(
          candidate,
          input.enrichmentType
        );

        // Store enrichment results
        await db.insert(enrichmentResults).values({
          jobId: job.id,
          candidateId: input.candidateId,
          extractedSkills: enrichmentData.skills,
          skillsConfidence: enrichmentData.skillsConfidence,
          extractedExperience: enrichmentData.experience,
          experienceConfidence: enrichmentData.experienceConfidence,
          totalYearsExperience: enrichmentData.totalYearsExperience,
          extractedEducation: enrichmentData.education,
          educationConfidence: enrichmentData.educationConfidence,
          extractedCertifications: enrichmentData.certifications,
          certificationsConfidence: enrichmentData.certificationsConfidence,
          careerProgression: enrichmentData.careerProgression,
          industryExpertise: enrichmentData.industryExpertise,
          leadershipIndicators: enrichmentData.leadershipIndicators,
          technicalDepth: enrichmentData.technicalDepth,
          overallConfidence: enrichmentData.overallConfidence,
        });

        // Update candidate profile with enriched data
        await db.update(candidates)
          .set({
            technicalSkills: enrichmentData.skills,
            aiInferredAttributes: {
              experience: enrichmentData.experience,
              education: enrichmentData.education,
              certifications: enrichmentData.certifications,
              careerProgression: enrichmentData.careerProgression,
              industryExpertise: enrichmentData.industryExpertise,
              leadershipIndicators: enrichmentData.leadershipIndicators,
            },
            aiProfileScore: enrichmentData.overallConfidence,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(candidates.id, input.candidateId));

        // Update job status
        const processingTime = Date.now() - startTime;
        await db.update(profileEnrichmentJobs)
          .set({
            status: 'completed',
            completedAt: new Date().toISOString(),
            processingTime,
          })
          .where(eq(profileEnrichmentJobs.id, job.id));

        return {
          success: true,
          jobId: job.id,
          processingTime,
          confidence: enrichmentData.overallConfidence,
        };

      } catch (error) {
        // Update job with error
        await db.update(profileEnrichmentJobs)
          .set({
            status: 'failed',
            completedAt: new Date().toISOString(),
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            errorDetails: { error: String(error) },
          })
          .where(eq(profileEnrichmentJobs.id, job.id));

        throw error;
      }
    }),

  /**
   * Get enrichment history for a candidate
   */
  getEnrichmentHistory: protectedProcedure
    .input(z.object({
      candidateId: z.number(),
      limit: z.number().default(10),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const jobs = await db
        .select({
          id: profileEnrichmentJobs.id,
          status: profileEnrichmentJobs.status,
          enrichmentType: profileEnrichmentJobs.enrichmentType,
          dataSource: profileEnrichmentJobs.dataSource,
          startedAt: profileEnrichmentJobs.startedAt,
          completedAt: profileEnrichmentJobs.completedAt,
          processingTime: profileEnrichmentJobs.processingTime,
          errorMessage: profileEnrichmentJobs.errorMessage,
        })
        .from(profileEnrichmentJobs)
        .where(eq(profileEnrichmentJobs.candidateId, input.candidateId))
        .orderBy(desc(profileEnrichmentJobs.createdAt))
        .limit(input.limit);

      return jobs;
    }),

  /**
   * Get enrichment results for a candidate
   */
  getEnrichmentResults: protectedProcedure
    .input(z.object({
      candidateId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const results = await db
        .select()
        .from(enrichmentResults)
        .where(eq(enrichmentResults.candidateId, input.candidateId))
        .orderBy(desc(enrichmentResults.createdAt))
        .limit(1);

      return results.length > 0 ? results[0] : null;
    }),

  /**
   * Get enrichment metrics for a user
   */
  getEnrichmentMetrics: protectedProcedure
    .input(z.object({
      periodStart: z.string(),
      periodEnd: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const metrics = await db
        .select()
        .from(enrichmentMetrics)
        .where(
          and(
            eq(enrichmentMetrics.userId, ctx.user.id),
            eq(enrichmentMetrics.periodStart, input.periodStart),
            eq(enrichmentMetrics.periodEnd, input.periodEnd)
          )
        )
        .limit(1);

      if (metrics.length > 0) {
        return metrics[0];
      }

      // Calculate metrics if not cached
      const jobs = await db
        .select()
        .from(profileEnrichmentJobs)
        .where(
          and(
            eq(profileEnrichmentJobs.userId, ctx.user.id),
            // Add date range filter here
          )
        );

      const totalEnrichments = jobs.length;
      const successfulEnrichments = jobs.filter(j => j.status === 'completed').length;
      const failedEnrichments = jobs.filter(j => j.status === 'failed').length;
      const partialEnrichments = jobs.filter(j => j.status === 'partial').length;

      const processingTimes = jobs
        .filter(j => j.processingTime)
        .map(j => j.processingTime!);
      const averageProcessingTime = processingTimes.length > 0
        ? Math.round(processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length)
        : 0;

      return {
        totalEnrichments,
        successfulEnrichments,
        failedEnrichments,
        partialEnrichments,
        averageProcessingTime,
        successRate: totalEnrichments > 0 
          ? Math.round((successfulEnrichments / totalEnrichments) * 100) 
          : 0,
      };
    }),
});

/**
 * Extract candidate data using LLM
 */
async function extractCandidateData(
  candidate: any,
  enrichmentType: string
) {
  const prompt = `Analyze this candidate profile and extract structured information.

Candidate Information:
- Name: ${candidate.fullName}
- Email: ${candidate.email}
- Headline: ${candidate.headline || 'Not provided'}
- Summary: ${candidate.summary || 'Not provided'}
- Years of Experience: ${candidate.yearsOfExperience || 'Not specified'}
- Location: ${candidate.location || 'Not specified'}

Extract the following information:
1. Technical Skills (with proficiency levels and years of experience)
2. Work Experience (companies, roles, duration, key achievements)
3. Education (institutions, degrees, fields of study, graduation years)
4. Certifications (names, issuers, dates)
5. Career Progression Analysis
6. Industry Expertise
7. Leadership Indicators
8. Technical Depth Assessment (0-100)

Provide confidence scores (0-100) for each category.`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are an expert HR analyst specializing in candidate profile analysis. Extract structured information from candidate profiles with high accuracy.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "candidate_enrichment",
        strict: true,
        schema: {
          type: "object",
          properties: {
            skills: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  level: { type: "string" },
                  yearsOfExperience: { type: "number" },
                  category: { type: "string" },
                },
                required: ["name", "level", "category"],
                additionalProperties: false,
              },
            },
            skillsConfidence: { type: "number" },
            experience: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  company: { type: "string" },
                  title: { type: "string" },
                  duration: { type: "string" },
                  responsibilities: { type: "string" },
                  achievements: { type: "string" },
                },
                required: ["company", "title", "duration"],
                additionalProperties: false,
              },
            },
            experienceConfidence: { type: "number" },
            totalYearsExperience: { type: "number" },
            education: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  institution: { type: "string" },
                  degree: { type: "string" },
                  field: { type: "string" },
                  graduationYear: { type: "number" },
                },
                required: ["institution", "degree", "field"],
                additionalProperties: false,
              },
            },
            educationConfidence: { type: "number" },
            certifications: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  issuer: { type: "string" },
                  issueDate: { type: "string" },
                },
                required: ["name", "issuer"],
                additionalProperties: false,
              },
            },
            certificationsConfidence: { type: "number" },
            careerProgression: { type: "string" },
            industryExpertise: {
              type: "array",
              items: { type: "string" },
            },
            leadershipIndicators: {
              type: "array",
              items: { type: "string" },
            },
            technicalDepth: { type: "number" },
            overallConfidence: { type: "number" },
          },
          required: [
            "skills",
            "skillsConfidence",
            "experience",
            "experienceConfidence",
            "totalYearsExperience",
            "education",
            "educationConfidence",
            "certifications",
            "certificationsConfidence",
            "careerProgression",
            "industryExpertise",
            "leadershipIndicators",
            "technicalDepth",
            "overallConfidence",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from LLM");
  }

  return JSON.parse(content);
}
