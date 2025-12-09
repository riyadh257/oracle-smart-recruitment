import { z } from "zod";
import { router, adminProcedure } from "./_core/trpc";
import {
  getTrainingEffectivenessMetrics,
  getTrainingCompletionTrends,
  getTopPerformingPrograms,
} from "./trainingAnalyticsDb";

/**
 * Training Analytics Router
 * Provides business intelligence endpoints for training program effectiveness
 */
export const trainingAnalyticsRouter = router({
  /**
   * Get training effectiveness metrics for all programs
   */
  getEffectivenessMetrics: adminProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const startDate = input.startDate ? new Date(input.startDate) : undefined;
      const endDate = input.endDate ? new Date(input.endDate) : undefined;

      const metrics = await getTrainingEffectivenessMetrics(startDate, endDate);
      return metrics;
    }),

  /**
   * Get training completion trends over time
   */
  getCompletionTrends: adminProcedure
    .input(
      z.object({
        months: z.number().min(1).max(24).default(12),
      })
    )
    .query(async ({ input }) => {
      const trends = await getTrainingCompletionTrends(input.months);
      return trends;
    }),

  /**
   * Get top performing programs by ROI
   */
  getTopPerformingPrograms: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      const programs = await getTopPerformingPrograms(input.limit);
      return programs;
    }),

  /**
   * Get summary statistics for training analytics dashboard
   */
  getSummaryStats: adminProcedure.query(async () => {
    const metrics = await getTrainingEffectivenessMetrics();

    const totalEnrollments = metrics.reduce((sum, m) => sum + m.totalEnrollments, 0);
    const totalCompletions = metrics.reduce((sum, m) => sum + m.completionCount, 0);
    const avgCompletionRate =
      metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.completionRate, 0) / metrics.length
        : 0;
    const avgMatchScoreImprovement =
      metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.avgMatchScoreImprovement, 0) / metrics.length
        : 0;
    const totalApplications = metrics.reduce((sum, m) => sum + m.applicationCount, 0);

    return {
      totalEnrollments,
      totalCompletions,
      avgCompletionRate: Math.round(avgCompletionRate * 100) / 100,
      avgMatchScoreImprovement: Math.round(avgMatchScoreImprovement * 100) / 100,
      totalApplications,
      programCount: metrics.length,
    };
  }),
});
