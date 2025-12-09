import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createResumeParseResult,
  getResumeParseResultByCandidateId,
  getLatestResumeParseResult,
  updateResumeParseResult,
  createJobDescriptionAnalysis,
  getJobDescriptionAnalysisByJobId,
  getLatestJobDescriptionAnalysis,
  updateJobDescriptionAnalysis,
  createNlpTrainingData,
  getNlpTrainingDataByType,
  getAllNlpTrainingData,
  updateNlpTrainingData,
  getCandidateByUserId,
  getJobById,
} from "../db";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";
import { storagePut } from "../../storage";

export const arabicNlpRouter = router({
  // ============================================================================
  // Resume Parsing
  // ============================================================================

  // Parse resume (Arabic/English/Mixed)
  parseResume: protectedProcedure
    .input(
      z.object({
        resumeUrl: z.string(),
        resumeFileKey: z.string().optional(),
        candidateId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Create initial parse result record
      const parseResult = await createResumeParseResult({
        candidateId: input.candidateId,
        resumeUrl: input.resumeUrl,
        resumeFileKey: input.resumeFileKey,
        parseStatus: "processing",
      });

      const parseId = parseResult.insertId as number;

      try {
        const startTime = Date.now();

        // Use LLM to parse resume with advanced Arabic NLP
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are an advanced Arabic NLP system specialized in parsing resumes with 95%+ accuracy. You excel at:
- Understanding Arabic text (Modern Standard Arabic and Gulf dialects)
- Handling mixed Arabic-English content
- Extracting structured data from poorly formatted documents
- Inferring missing information from context

Extract all relevant information from the resume and return it in a structured JSON format.`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Parse this resume and extract all relevant information. Handle Arabic, English, or mixed content. Return structured JSON with personal info, experience, education, skills, and certifications.",
                },
                {
                  type: "file_url",
                  file_url: {
                    url: input.resumeUrl,
                    mime_type: "application/pdf",
                  },
                },
              ],
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "resume_parse_result",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  personalInfo: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      email: { type: "string" },
                      phone: { type: "string" },
                      location: { type: "string" },
                      nationality: { type: "string" },
                    },
                    required: ["name"],
                    additionalProperties: false,
                  },
                  experience: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        company: { type: "string" },
                        duration: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["title", "company"],
                      additionalProperties: false,
                    },
                  },
                  education: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        degree: { type: "string" },
                        institution: { type: "string" },
                        year: { type: "string" },
                        gpa: { type: "string" },
                      },
                      required: ["degree", "institution"],
                      additionalProperties: false,
                    },
                  },
                  skills: {
                    type: "object",
                    properties: {
                      technical: {
                        type: "array",
                        items: { type: "string" },
                      },
                      soft: {
                        type: "array",
                        items: { type: "string" },
                      },
                      languages: {
                        type: "array",
                        items: { type: "string" },
                      },
                    },
                    required: [],
                    additionalProperties: false,
                  },
                  certifications: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        issuer: { type: "string" },
                        date: { type: "string" },
                      },
                      required: ["name"],
                      additionalProperties: false,
                    },
                  },
                  language: {
                    type: "string",
                    enum: ["arabic", "english", "mixed"],
                  },
                  rawText: { type: "string" },
                },
                required: ["personalInfo", "language", "rawText"],
                additionalProperties: false,
              },
            },
          },
        });

        const processingTime = Date.now() - startTime;
        const content = response.choices[0]?.message?.content;

        if (!content) {
          throw new Error("No response from LLM");
        }

        const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
        const parsedData = JSON.parse(contentStr);

        // Calculate confidence score based on completeness
        let confidenceScore = 0;
        if (parsedData.personalInfo?.name) confidenceScore += 20;
        if (parsedData.personalInfo?.email) confidenceScore += 15;
        if (parsedData.personalInfo?.phone) confidenceScore += 10;
        if (parsedData.experience && parsedData.experience.length > 0) confidenceScore += 25;
        if (parsedData.education && parsedData.education.length > 0) confidenceScore += 15;
        if (parsedData.skills && Object.keys(parsedData.skills).length > 0) confidenceScore += 15;

        // Update parse result with extracted data
        await updateResumeParseResult(parseId, {
          parseStatus: "completed",
          confidenceScore,
          language: parsedData.language,
          extractedData: {
            personalInfo: parsedData.personalInfo,
            experience: parsedData.experience,
            education: parsedData.education,
            skills: parsedData.skills,
            certifications: parsedData.certifications,
          },
          rawText: parsedData.rawText,
          processingTime,
        });

        return {
          success: true,
          parseId,
          confidenceScore,
          extractedData: parsedData,
        };
      } catch (error) {
        // Update parse result with error
        await updateResumeParseResult(parseId, {
          parseStatus: "failed",
          errorMessage: (error as Error).message,
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to parse resume: " + (error as Error).message,
        });
      }
    }),

  // Get parse results for candidate
  getParseResults: protectedProcedure
    .input(z.object({ candidateId: z.number() }))
    .query(async ({ input }) => {
      return await getResumeParseResultByCandidateId(input.candidateId);
    }),

  // Get latest parse result
  getLatestParseResult: protectedProcedure
    .input(z.object({ candidateId: z.number() }))
    .query(async ({ input }) => {
      return await getLatestResumeParseResult(input.candidateId);
    }),

  // ============================================================================
  // Job Description Analysis
  // ============================================================================

  // Analyze job description (Arabic/English/Mixed)
  analyzeJobDescription: protectedProcedure
    .input(
      z.object({
        jobId: z.number(),
        jobDescription: z.string().min(10),
      })
    )
    .mutation(async ({ input }) => {
      // Create initial analysis record
      const analysisResult = await createJobDescriptionAnalysis({
        jobId: input.jobId,
        jobDescription: input.jobDescription,
        analysisStatus: "processing",
      });

      const analysisId = analysisResult.insertId as number;

      try {
        const startTime = Date.now();

        // Use LLM to analyze job description with advanced Arabic NLP
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are an advanced Arabic NLP system specialized in analyzing job descriptions with 95%+ accuracy. You excel at:
- Understanding Arabic job descriptions (Modern Standard Arabic and Gulf dialects)
- Handling mixed Arabic-English content
- Extracting structured requirements from vague descriptions
- Inferring implicit requirements and culture fit indicators

Extract all relevant requirements and attributes from the job description.`,
            },
            {
              role: "user",
              content: `Analyze this job description and extract structured requirements:\n\n${input.jobDescription}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "job_analysis_result",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  requiredSkills: {
                    type: "array",
                    items: { type: "string" },
                  },
                  preferredSkills: {
                    type: "array",
                    items: { type: "string" },
                  },
                  requiredExperience: {
                    type: "object",
                    properties: {
                      years: { type: "number" },
                      level: { type: "string" },
                    },
                    required: [],
                    additionalProperties: false,
                  },
                  education: {
                    type: "object",
                    properties: {
                      required: { type: "string" },
                      preferred: { type: "string" },
                    },
                    required: [],
                    additionalProperties: false,
                  },
                  certifications: {
                    type: "array",
                    items: { type: "string" },
                  },
                  languages: {
                    type: "array",
                    items: { type: "string" },
                  },
                  softSkills: {
                    type: "array",
                    items: { type: "string" },
                  },
                  cultureFitIndicators: {
                    type: "object",
                    properties: {
                      workStyle: { type: "string" },
                      teamDynamics: { type: "string" },
                      companyValues: {
                        type: "array",
                        items: { type: "string" },
                      },
                    },
                    required: [],
                    additionalProperties: false,
                  },
                  salaryRange: {
                    type: "object",
                    properties: {
                      min: { type: "number" },
                      max: { type: "number" },
                      currency: { type: "string" },
                    },
                    required: [],
                    additionalProperties: false,
                  },
                  language: {
                    type: "string",
                    enum: ["arabic", "english", "mixed"],
                  },
                },
                required: ["requiredSkills", "language"],
                additionalProperties: false,
              },
            },
          },
        });

        const processingTime = Date.now() - startTime;
        const content = response.choices[0]?.message?.content;

        if (!content) {
          throw new Error("No response from LLM");
        }

        const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
        const analyzedData = JSON.parse(contentStr);

        // Calculate confidence score based on completeness
        let confidenceScore = 0;
        if (analyzedData.requiredSkills && analyzedData.requiredSkills.length > 0) confidenceScore += 25;
        if (analyzedData.preferredSkills && analyzedData.preferredSkills.length > 0) confidenceScore += 15;
        if (analyzedData.requiredExperience && analyzedData.requiredExperience.years) confidenceScore += 20;
        if (analyzedData.education && analyzedData.education.required) confidenceScore += 15;
        if (analyzedData.softSkills && analyzedData.softSkills.length > 0) confidenceScore += 15;
        if (analyzedData.cultureFitIndicators) confidenceScore += 10;

        // Update analysis result with extracted data
        await updateJobDescriptionAnalysis(analysisId, {
          analysisStatus: "completed",
          confidenceScore,
          language: analyzedData.language,
          extractedRequirements: {
            requiredSkills: analyzedData.requiredSkills,
            preferredSkills: analyzedData.preferredSkills,
            requiredExperience: analyzedData.requiredExperience,
            education: analyzedData.education,
            certifications: analyzedData.certifications,
            languages: analyzedData.languages,
            softSkills: analyzedData.softSkills,
          },
          cultureFitIndicators: analyzedData.cultureFitIndicators,
          salaryRange: analyzedData.salaryRange,
          processingTime,
        });

        return {
          success: true,
          analysisId,
          confidenceScore,
          extractedData: analyzedData,
        };
      } catch (error) {
        // Update analysis result with error
        await updateJobDescriptionAnalysis(analysisId, {
          analysisStatus: "failed",
          errorMessage: (error as Error).message,
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to analyze job description: " + (error as Error).message,
        });
      }
    }),

  // Get analysis results for job
  getAnalysisResults: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ input }) => {
      return await getJobDescriptionAnalysisByJobId(input.jobId);
    }),

  // Get latest analysis result
  getLatestAnalysisResult: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ input }) => {
      return await getLatestJobDescriptionAnalysis(input.jobId);
    }),

  // ============================================================================
  // NLP Training Data
  // ============================================================================

  // Submit training data for continuous improvement
  submitTrainingData: protectedProcedure
    .input(
      z.object({
        dataType: z.enum(["resume", "job_description", "feedback"]),
        originalText: z.string().min(1),
        correctedExtraction: z.record(z.string(), z.any()),
        feedbackType: z.enum(["correction", "validation", "enhancement"]),
        language: z.enum(["arabic", "english", "mixed"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const trainingData = await createNlpTrainingData({
        ...input,
        submittedBy: ctx.user.id,
      });

      return {
        success: true,
        trainingDataId: trainingData.insertId,
      };
    }),

  // Get training data by type
  getTrainingDataByType: protectedProcedure
    .input(z.object({ dataType: z.enum(["resume", "job_description", "feedback"]) }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return await getNlpTrainingDataByType(input.dataType);
    }),

  // Get all training data (admin only)
  getAllTrainingData: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    return await getAllNlpTrainingData();
  }),
});
