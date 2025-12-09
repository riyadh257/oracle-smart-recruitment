import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import {
  createInterviewFeedback,
  getInterviewFeedback,
  getCandidateFeedback,
  getFeedbackById,
  updateInterviewFeedback,
  deleteInterviewFeedback,
  createFeedbackTemplate,
  getEmployerFeedbackTemplates,
  getFeedbackTemplateById,
  updateFeedbackTemplate,
  deleteFeedbackTemplate,
} from "../interviewFeedback";
import { TRPCError } from "@trpc/server";
import { notifyFeedbackRequest } from "../notificationService";

/**
 * Interview Feedback Router
 */
export const feedbackRouter = router({
  /**
   * Create interview feedback
   */
  create: protectedProcedure
    .input(
      z.object({
        interviewId: z.number(),
        candidateId: z.number(),
        interviewerId: z.number(),
        overallRating: z.number().min(1).max(5),
        technicalSkillsRating: z.number().min(1).max(5).optional(),
        communicationRating: z.number().min(1).max(5).optional(),
        problemSolvingRating: z.number().min(1).max(5).optional(),
        cultureFitRating: z.number().min(1).max(5).optional(),
        recommendation: z.enum([
          "strong_hire",
          "hire",
          "maybe",
          "no_hire",
          "strong_no_hire",
        ]),
        strengths: z.string().optional(),
        weaknesses: z.string().optional(),
        detailedNotes: z.string().optional(),
        questionsResponses: z
          .array(
            z.object({
              question: z.string(),
              answer: z.string(),
              rating: z.number().optional(),
            })
          )
          .optional(),
        interviewDuration: z.number().optional(),
        isConfidential: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const feedback = await createInterviewFeedback({
        ...input,
        submittedAt: new Date(),
      });

      if (!feedback) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create feedback",
        });
      }

      // Get candidate and interview details for notification
      try {
        const candidate = await db.getCandidateById(input.candidateId);
        const interview = await db.getInterviewById(input.interviewId);
        
        if (candidate && interview) {
          // Notify the employer/interviewer that feedback was submitted
          // This could be expanded to notify other stakeholders
          console.log(`Feedback submitted for interview ${input.interviewId}`);
        }
      } catch (error) {
        console.error("Error sending feedback notification:", error);
      }

      return feedback;
    }),

  /**
   * Get feedback for an interview
   */
  getByInterview: protectedProcedure
    .input(
      z.object({
        interviewId: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await getInterviewFeedback(input.interviewId);
    }),

  /**
   * Get all feedback for a candidate
   */
  getByCandidate: protectedProcedure
    .input(
      z.object({
        candidateId: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await getCandidateFeedback(input.candidateId);
    }),

  /**
   * Get feedback by ID
   */
  getById: protectedProcedure
    .input(
      z.object({
        feedbackId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const feedback = await getFeedbackById(input.feedbackId);

      if (!feedback) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feedback not found",
        });
      }

      return feedback;
    }),

  /**
   * Update interview feedback
   */
  update: protectedProcedure
    .input(
      z.object({
        feedbackId: z.number(),
        overallRating: z.number().min(1).max(5).optional(),
        technicalSkillsRating: z.number().min(1).max(5).optional(),
        communicationRating: z.number().min(1).max(5).optional(),
        problemSolvingRating: z.number().min(1).max(5).optional(),
        cultureFitRating: z.number().min(1).max(5).optional(),
        recommendation: z
          .enum(["strong_hire", "hire", "maybe", "no_hire", "strong_no_hire"])
          .optional(),
        strengths: z.string().optional(),
        weaknesses: z.string().optional(),
        detailedNotes: z.string().optional(),
        questionsResponses: z
          .array(
            z.object({
              question: z.string(),
              answer: z.string(),
              rating: z.number().optional(),
            })
          )
          .optional(),
        interviewDuration: z.number().optional(),
        isConfidential: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { feedbackId, ...data } = input;

      const feedback = await updateInterviewFeedback(feedbackId, data);

      if (!feedback) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feedback not found",
        });
      }

      return feedback;
    }),

  /**
   * Delete interview feedback
   */
  delete: protectedProcedure
    .input(
      z.object({
        feedbackId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const success = await deleteInterviewFeedback(input.feedbackId);

      if (!success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete feedback",
        });
      }

      return { success: true };
    }),

  // ============================================================================
  // Feedback Templates
  // ============================================================================

  /**
   * Create feedback template
   */
  createTemplate: protectedProcedure
    .input(
      z.object({
        employerId: z.number(),
        name: z.string(),
        description: z.string().optional(),
        interviewType: z.string().optional(),
        questions: z
          .array(
            z.object({
              id: z.string(),
              question: z.string(),
              type: z.enum(["text", "rating", "multiple_choice"]),
              required: z.boolean(),
              options: z.array(z.string()).optional(),
            })
          )
          .optional(),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const template = await createFeedbackTemplate(input);

      if (!template) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create template",
        });
      }

      return template;
    }),

  /**
   * Get all templates for an employer
   */
  getTemplates: protectedProcedure
    .input(
      z.object({
        employerId: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await getEmployerFeedbackTemplates(input.employerId);
    }),

  /**
   * Get template by ID
   */
  getTemplateById: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const template = await getFeedbackTemplateById(input.templateId);

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found",
        });
      }

      return template;
    }),

  /**
   * Update feedback template
   */
  updateTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        interviewType: z.string().optional(),
        questions: z
          .array(
            z.object({
              id: z.string(),
              question: z.string(),
              type: z.enum(["text", "rating", "multiple_choice"]),
              required: z.boolean(),
              options: z.array(z.string()).optional(),
            })
          )
          .optional(),
        isDefault: z.boolean().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { templateId, ...data } = input;

      const template = await updateFeedbackTemplate(templateId, data);

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found",
        });
      }

      return template;
    }),

  /**
   * Delete feedback template
   */
  deleteTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const success = await deleteFeedbackTemplate(input.templateId);

      if (!success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete template",
        });
      }

      return { success: true };
    }),

  // ============================================================================
  // Feedback Analytics
  // ============================================================================

  /**
   * Get interviewer performance metrics
   */
  getInterviewerMetrics: protectedProcedure
    .input(
      z.object({
        employerId: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await db.getInterviewerPerformanceMetrics(input.employerId);
    }),

  /**
   * Get recommendation distribution
   */
  getRecommendationDistribution: protectedProcedure
    .input(
      z.object({
        employerId: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await db.getRecommendationDistribution(input.employerId);
    }),

  /**
   * Get top candidates by feedback scores
   */
  getTopCandidates: protectedProcedure
    .input(
      z.object({
        employerId: z.number(),
        limit: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return await db.getTopCandidatesByFeedback(input.employerId, input.limit || 10);
    }),

  /**
   * Get feedback analytics summary
   */
  getAnalyticsSummary: protectedProcedure
    .input(
      z.object({
        employerId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const feedbackData = await db.getFeedbackAnalytics(input.employerId);
      
      if (!feedbackData || feedbackData.length === 0) {
        return {
          totalFeedbacks: 0,
          avgOverallRating: 0,
          totalInterviewers: 0,
          totalCandidates: 0,
        };
      }

      const totalFeedbacks = feedbackData.length;
      const avgOverallRating = feedbackData.reduce((sum, f) => sum + f.feedback.overallRating, 0) / totalFeedbacks;
      const uniqueInterviewers = new Set(feedbackData.map(f => f.feedback.interviewerId)).size;
      const uniqueCandidates = new Set(feedbackData.map(f => f.feedback.candidateId)).size;

      return {
        totalFeedbacks,
        avgOverallRating: Math.round(avgOverallRating * 10) / 10,
        totalInterviewers: uniqueInterviewers,
        totalCandidates: uniqueCandidates,
      };
    }),
});
