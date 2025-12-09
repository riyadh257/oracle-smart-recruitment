import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import {
  getUserVariant,
  trackAbTestEvent,
  getAbTestResults,
  calculateStatisticalSignificance,
  MATCH_EXPLANATION_VARIANTS,
} from "./matchExplanationAbTest";

/**
 * Match Explanation A/B Test Router
 * Provides endpoints for variant assignment, event tracking, and results analysis
 */
export const matchExplanationAbTestRouter = router({
  /**
   * Get assigned variant for current user
   */
  getMyVariant: protectedProcedure.query(async ({ ctx }) => {
    const variant = getUserVariant(ctx.user.id);
    return variant;
  }),

  /**
   * Track A/B test event (view, click, apply)
   */
  trackEvent: protectedProcedure
    .input(
      z.object({
        jobId: z.number(),
        eventType: z.enum(["view", "click", "apply"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const variant = getUserVariant(ctx.user.id);

      await trackAbTestEvent({
        userId: ctx.user.id,
        variantId: variant.id,
        jobId: input.jobId,
        eventType: input.eventType,
        timestamp: new Date(),
      });

      return { success: true };
    }),

  /**
   * Get A/B test results (admin only)
   */
  getResults: adminProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const startDate = input.startDate ? new Date(input.startDate) : undefined;
      const endDate = input.endDate ? new Date(input.endDate) : undefined;

      const results = await getAbTestResults(startDate, endDate);
      return results;
    }),

  /**
   * Get statistical significance analysis (admin only)
   */
  getSignificanceAnalysis: adminProcedure
    .input(
      z.object({
        variant1Id: z.string(),
        variant2Id: z.string(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const startDate = input.startDate ? new Date(input.startDate) : undefined;
      const endDate = input.endDate ? new Date(input.endDate) : undefined;

      const results = await getAbTestResults(startDate, endDate);

      const variant1 = results.find((r) => r.variantId === input.variant1Id);
      const variant2 = results.find((r) => r.variantId === input.variant2Id);

      if (!variant1 || !variant2) {
        return {
          error: "Variant not found",
          isSignificant: false,
          pValue: 1,
          confidenceLevel: 0,
        };
      }

      const significance = calculateStatisticalSignificance(variant1, variant2);

      return {
        variant1: variant1,
        variant2: variant2,
        ...significance,
      };
    }),

  /**
   * Get all available variants
   */
  getVariants: protectedProcedure.query(async () => {
    return MATCH_EXPLANATION_VARIANTS;
  }),

  /**
   * Get summary statistics for A/B test dashboard
   */
  getSummaryStats: adminProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const startDate = input.startDate ? new Date(input.startDate) : undefined;
      const endDate = input.endDate ? new Date(input.endDate) : undefined;

      const results = await getAbTestResults(startDate, endDate);

      const totalImpressions = results.reduce((sum, r) => sum + r.impressions, 0);
      const totalClicks = results.reduce((sum, r) => sum + r.clicks, 0);
      const totalApplications = results.reduce((sum, r) => sum + r.applications, 0);

      const avgClickThroughRate =
        results.length > 0
          ? results.reduce((sum, r) => sum + r.clickThroughRate, 0) / results.length
          : 0;

      const avgApplicationConversionRate =
        results.length > 0
          ? results.reduce((sum, r) => sum + r.applicationConversionRate, 0) / results.length
          : 0;

      // Find best performing variant
      const bestVariant = results.reduce((best, current) => {
        const bestScore = best.clickThroughRate + best.applicationConversionRate;
        const currentScore = current.clickThroughRate + current.applicationConversionRate;
        return currentScore > bestScore ? current : best;
      }, results[0] || { variantName: "N/A", clickThroughRate: 0, applicationConversionRate: 0 });

      return {
        totalImpressions,
        totalClicks,
        totalApplications,
        avgClickThroughRate: Math.round(avgClickThroughRate * 100) / 100,
        avgApplicationConversionRate: Math.round(avgApplicationConversionRate * 100) / 100,
        bestVariantName: bestVariant?.variantName || "N/A",
        variantCount: results.length,
      };
    }),
});
