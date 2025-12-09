import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getSmartRecommendations,
  getRecommendationStatistics,
  recordRecommendationFeedback,
  calculateLearningWeights,
} from "../smartRecommendations";

export const smartRecommendationsRouter = router({
  /**
   * Get smart recommendations for a job
   */
  getRecommendations: protectedProcedure
    .input(
      z.object({
        jobId: z.number(),
        limit: z.number().optional(),
        minScore: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return getSmartRecommendations({
        userId: ctx.user.id,
        jobId: input.jobId,
        limit: input.limit,
        minScore: input.minScore,
      });
    }),

  /**
   * Get recommendation statistics for a job
   */
  getStatistics: protectedProcedure
    .input(
      z.object({
        jobId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      return getRecommendationStatistics({
        userId: ctx.user.id,
        jobId: input.jobId,
      });
    }),

  /**
   * Get learning weights (for debugging/transparency)
   */
  getLearningWeights: protectedProcedure
    .input(
      z.object({
        lookbackDays: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return calculateLearningWeights({
        userId: ctx.user.id,
        lookbackDays: input.lookbackDays,
      });
    }),

  /**
   * Record feedback on a recommendation
   */
  recordFeedback: protectedProcedure
    .input(
      z.object({
        candidateId: z.number(),
        jobId: z.number(),
        wasHelpful: z.boolean(),
        actualOutcome: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await recordRecommendationFeedback({
        userId: ctx.user.id,
        candidateId: input.candidateId,
        jobId: input.jobId,
        wasHelpful: input.wasHelpful,
        actualOutcome: input.actualOutcome,
      });

      return { success: true };
    }),
});
