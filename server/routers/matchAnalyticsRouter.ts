import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getMatchTrends,
  getAttributeCorrelation,
  getPipelineConversionRates,
  getTopPerformingAttributes,
  getMatchAnalyticsSummary,
  getJobCategoryPerformance,
} from "../matchAnalytics";

export const matchAnalyticsRouter = router({
  /**
   * Get match history trends over time
   */
  getTrends: protectedProcedure
    .input(
      z.object({
        startDate: z.string().transform((val) => new Date(val)),
        endDate: z.string().transform((val) => new Date(val)),
        groupBy: z.enum(['day', 'week', 'month']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return getMatchTrends({
        userId: ctx.user.id,
        startDate: input.startDate,
        endDate: input.endDate,
        groupBy: input.groupBy,
      });
    }),

  /**
   * Get attribute correlation analysis
   */
  getCorrelation: protectedProcedure
    .input(
      z.object({
        startDate: z.string().transform((val) => new Date(val)).optional(),
        endDate: z.string().transform((val) => new Date(val)).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return getAttributeCorrelation({
        userId: ctx.user.id,
        startDate: input.startDate,
        endDate: input.endDate,
      });
    }),

  /**
   * Get hiring pipeline conversion rates
   */
  getConversionRates: protectedProcedure
    .input(
      z.object({
        startDate: z.string().transform((val) => new Date(val)).optional(),
        endDate: z.string().transform((val) => new Date(val)).optional(),
        jobId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return getPipelineConversionRates({
        userId: ctx.user.id,
        startDate: input.startDate,
        endDate: input.endDate,
        jobId: input.jobId,
      });
    }),

  /**
   * Get top performing attributes
   */
  getTopAttributes: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional(),
        startDate: z.string().transform((val) => new Date(val)).optional(),
        endDate: z.string().transform((val) => new Date(val)).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return getTopPerformingAttributes({
        userId: ctx.user.id,
        limit: input.limit,
        startDate: input.startDate,
        endDate: input.endDate,
      });
    }),

  /**
   * Get match analytics summary
   */
  getSummary: protectedProcedure
    .input(
      z.object({
        startDate: z.string().transform((val) => new Date(val)),
        endDate: z.string().transform((val) => new Date(val)),
      })
    )
    .query(async ({ ctx, input }) => {
      return getMatchAnalyticsSummary({
        userId: ctx.user.id,
        startDate: input.startDate,
        endDate: input.endDate,
      });
    }),

  /**
   * Get job category performance comparison
   */
  getCategoryPerformance: protectedProcedure
    .input(
      z.object({
        startDate: z.string().transform((val) => new Date(val)).optional(),
        endDate: z.string().transform((val) => new Date(val)).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return getJobCategoryPerformance({
        userId: ctx.user.id,
        startDate: input.startDate,
        endDate: input.endDate,
      });
    }),
});
