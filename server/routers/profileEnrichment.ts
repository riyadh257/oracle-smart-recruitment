/**
 * Profile Enrichment Router
 * Phase 16: Resume parsing, AI skill extraction, and profile completeness tracking
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { candidates } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { parseResumeText } from "../resumeParser";
import { storagePut } from "../../storage";
import { notifyProfileEnrichmentComplete } from "../realtimeNotifications";
import { invokeLLM } from "../_core/llm";

/**
 * Calculate profile completeness score (0-100)
 */
function calculateCompletenessScore(candidate: any): number {
  let score = 0;
  const weights = {
    fullName: 5,
    email: 5,
    phone: 5,
    location: 5,
    professionalSummary: 10,
    technicalSkills: 15,
    softSkills: 10,
    workExperience: 20,
    education: 15,
    certifications: 5,
    languages: 5,
  };

  if (candidate.fullName) score += weights.fullName;
  if (candidate.email) score += weights.email;
  if (candidate.phone) score += weights.phone;
  if (candidate.location) score += weights.location;
  if (candidate.professionalSummary) score += weights.professionalSummary;
  
  const skills = candidate.technicalSkills as string[] || [];
  if (skills.length > 0) score += weights.technicalSkills;
  
  const softSkills = candidate.softSkills as string[] || [];
  if (softSkills.length > 0) score += weights.softSkills;
  
  const experience = candidate.workExperience as any[] || [];
  if (experience.length > 0) score += weights.workExperience;
  
  const education = candidate.education as any[] || [];
  if (education.length > 0) score += weights.education;
  
  const certs = candidate.certifications as string[] || [];
  if (certs.length > 0) score += weights.certifications;
  
  const langs = candidate.languages as string[] || [];
  if (langs.length > 0) score += weights.languages;

  return Math.min(100, score);
}

/**
 * Extract advanced skills with AI including proficiency levels and categories
 */
async function extractAdvancedSkills(resumeText: string): Promise<{
  technicalSkills: Array<{ name: string; proficiency: string; category: string }>;
  softSkills: Array<{ name: string; level: string }>;
  totalSkillsExtracted: number;
}> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are an expert skill extraction AI. Analyze resumes and extract skills with proficiency levels and categories.
Return ONLY valid JSON with no additional text.`
      },
      {
        role: "user",
        content: `Extract all technical and soft skills from this resume with proficiency levels:

${resumeText}

For technical skills, categorize them (e.g., "Programming Languages", "Frameworks", "Databases", "Cloud Platforms", "Tools").
For soft skills, assess the level (e.g., "Demonstrated", "Mentioned", "Implied").
Infer proficiency from context (e.g., "Expert", "Advanced", "Intermediate", "Beginner").`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "advanced_skills",
        strict: true,
        schema: {
          type: "object",
          properties: {
            technicalSkills: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  proficiency: { type: "string" },
                  category: { type: "string" }
                },
                required: ["name", "proficiency", "category"],
                additionalProperties: false
              }
            },
            softSkills: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  level: { type: "string" }
                },
                required: ["name", "level"],
                additionalProperties: false
              }
            }
          },
          required: ["technicalSkills", "softSkills"],
          additionalProperties: false
        }
      }
    }
  });

  const parsed = JSON.parse(response.choices[0].message.content);
  const totalSkillsExtracted = parsed.technicalSkills.length + parsed.softSkills.length;

  return {
    ...parsed,
    totalSkillsExtracted
  };
}

export const profileEnrichmentRouter = router({
  /**
   * Upload resume file and parse it
   */
  uploadAndParseResume: protectedProcedure
    .input(z.object({
      candidateId: z.number(),
      fileName: z.string(),
      fileContent: z.string(), // Base64 encoded file content
      mimeType: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get candidate
      const [candidate] = await db.select().from(candidates)
        .where(eq(candidates.id, input.candidateId))
        .limit(1);

      if (!candidate) {
        throw new Error("Candidate not found");
      }

      // Upload file to S3
      const fileBuffer = Buffer.from(input.fileContent, "base64");
      const fileKey = `resumes/${input.candidateId}/${Date.now()}-${input.fileName}`;
      
      const { url: resumeUrl } = await storagePut(
        fileKey,
        fileBuffer,
        input.mimeType
      );

      // For PDF/DOCX, we need to extract text first
      // For now, assume text extraction is done client-side or via separate service
      // In production, use pdf-parse or mammoth for server-side extraction
      
      let resumeText = "";
      if (input.mimeType === "text/plain") {
        resumeText = fileBuffer.toString("utf-8");
      } else {
        // For PDF/DOCX, return URL for now and require text extraction
        throw new Error("PDF/DOCX parsing requires text extraction. Please provide plain text.");
      }

      // Parse resume with AI
      const parsed = await parseResumeText(resumeText);

      // Extract advanced skills
      const advancedSkills = await extractAdvancedSkills(resumeText);

      // Update candidate profile
      await db.update(candidates)
        .set({
          fullName: parsed.fullName || candidate.fullName,
          email: parsed.email || candidate.email,
          phone: parsed.phone || candidate.phone,
          location: parsed.location || candidate.location,
          professionalSummary: parsed.summary || candidate.professionalSummary,
          yearsOfExperience: parsed.yearsOfExperience || candidate.yearsOfExperience,
          technicalSkills: parsed.technicalSkills || candidate.technicalSkills,
          softSkills: parsed.softSkills || candidate.softSkills,
          education: parsed.education || candidate.education,
          workExperience: parsed.workExperience || candidate.workExperience,
          certifications: parsed.certifications || candidate.certifications,
          languages: parsed.languages || candidate.languages,
          resumeUrl: resumeUrl,
          updatedAt: new Date()
        })
        .where(eq(candidates.id, input.candidateId));

      // Get updated candidate
      const [updatedCandidate] = await db.select().from(candidates)
        .where(eq(candidates.id, input.candidateId))
        .limit(1);

      const completenessScore = calculateCompletenessScore(updatedCandidate);

      // Send notification
      notifyProfileEnrichmentComplete(
        ctx.user.id,
        {
          candidateName: updatedCandidate.fullName,
          candidateId: input.candidateId,
          skillsExtracted: advancedSkills.totalSkillsExtracted,
          completenessScore
        }
      );

      return {
        success: true,
        parsed,
        advancedSkills,
        completenessScore,
        resumeUrl
      };
    }),

  /**
   * Manually enrich profile with AI skill extraction
   */
  enrichProfileWithAI: protectedProcedure
    .input(z.object({
      candidateId: z.number(),
      resumeText: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [candidate] = await db.select().from(candidates)
        .where(eq(candidates.id, input.candidateId))
        .limit(1);

      if (!candidate) {
        throw new Error("Candidate not found");
      }

      // Parse resume
      const parsed = await parseResumeText(input.resumeText);

      // Extract advanced skills
      const advancedSkills = await extractAdvancedSkills(input.resumeText);

      // Update candidate
      await db.update(candidates)
        .set({
          technicalSkills: parsed.technicalSkills || candidate.technicalSkills,
          softSkills: parsed.softSkills || candidate.softSkills,
          workExperience: parsed.workExperience || candidate.workExperience,
          education: parsed.education || candidate.education,
          certifications: parsed.certifications || candidate.certifications,
          yearsOfExperience: parsed.yearsOfExperience || candidate.yearsOfExperience,
          updatedAt: new Date()
        })
        .where(eq(candidates.id, input.candidateId));

      // Get updated candidate
      const [updatedCandidate] = await db.select().from(candidates)
        .where(eq(candidates.id, input.candidateId))
        .limit(1);

      const completenessScore = calculateCompletenessScore(updatedCandidate);

      // Send notification
      notifyProfileEnrichmentComplete(
        ctx.user.id,
        {
          candidateName: updatedCandidate.fullName,
          candidateId: input.candidateId,
          skillsExtracted: advancedSkills.totalSkillsExtracted,
          completenessScore
        }
      );

      return {
        success: true,
        parsed,
        advancedSkills,
        completenessScore
      };
    }),

  /**
   * Get profile completeness score
   */
  getProfileCompleteness: protectedProcedure
    .input(z.object({
      candidateId: z.number()
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [candidate] = await db.select().from(candidates)
        .where(eq(candidates.id, input.candidateId))
        .limit(1);

      if (!candidate) {
        throw new Error("Candidate not found");
      }

      const completenessScore = calculateCompletenessScore(candidate);

      const missingFields: string[] = [];
      if (!candidate.fullName) missingFields.push("Full Name");
      if (!candidate.email) missingFields.push("Email");
      if (!candidate.phone) missingFields.push("Phone");
      if (!candidate.location) missingFields.push("Location");
      if (!candidate.professionalSummary) missingFields.push("Professional Summary");
      if (!(candidate.technicalSkills as string[] || []).length) missingFields.push("Technical Skills");
      if (!(candidate.softSkills as string[] || []).length) missingFields.push("Soft Skills");
      if (!(candidate.workExperience as any[] || []).length) missingFields.push("Work Experience");
      if (!(candidate.education as any[] || []).length) missingFields.push("Education");

      return {
        completenessScore,
        missingFields,
        candidate: {
          id: candidate.id,
          fullName: candidate.fullName,
          email: candidate.email,
          resumeUrl: candidate.resumeUrl
        }
      };
    }),

  /**
   * Update candidate profile manually
   */
  updateProfile: protectedProcedure
    .input(z.object({
      candidateId: z.number(),
      updates: z.object({
        fullName: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        location: z.string().optional(),
        professionalSummary: z.string().optional(),
        technicalSkills: z.array(z.string()).optional(),
        softSkills: z.array(z.string()).optional(),
        yearsOfExperience: z.number().optional()
      })
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(candidates)
        .set({
          ...input.updates,
          updatedAt: new Date()
        })
        .where(eq(candidates.id, input.candidateId));

      const [updatedCandidate] = await db.select().from(candidates)
        .where(eq(candidates.id, input.candidateId))
        .limit(1);

      const completenessScore = calculateCompletenessScore(updatedCandidate);

      return {
        success: true,
        completenessScore
      };
    })
});
