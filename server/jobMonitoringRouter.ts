import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  getJobMetrics,
  getSystemHealthIndicators,
  getJobExecutionTimeline,
  getJobExecutionStatsByHour,
  getAllJobNames,
} from "./jobMonitoringService";

export const jobMonitoringRouter = router({
  /**
   * Get metrics for a specific job
   */
  getJobMetrics: protectedProcedure
    .input(
      z.object({
        jobName: z.string(),
        periodStart: z.string().optional(),
        periodEnd: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const periodStart = input.periodStart
        ? new Date(input.periodStart)
        : undefined;
      const periodEnd = input.periodEnd ? new Date(input.periodEnd) : undefined;

      const metrics = await getJobMetrics(
        input.jobName,
        periodStart,
        periodEnd
      );
      return metrics;
    }),

  /**
   * Get system health indicators
   */
  getSystemHealth: protectedProcedure.query(async () => {
    const health = await getSystemHealthIndicators();
    return health;
  }),

  /**
   * Get job execution timeline
   */
  getExecutionTimeline: protectedProcedure
    .input(
      z.object({
        periodStart: z.string(),
        periodEnd: z.string(),
        jobName: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const periodStart = new Date(input.periodStart);
      const periodEnd = new Date(input.periodEnd);

      const timeline = await getJobExecutionTimeline(
        periodStart,
        periodEnd,
        input.jobName
      );
      return timeline;
    }),

  /**
   * Get job execution statistics by hour
   */
  getStatsByHour: protectedProcedure
    .input(
      z.object({
        periodStart: z.string(),
        periodEnd: z.string(),
      })
    )
    .query(async ({ input }) => {
      const periodStart = new Date(input.periodStart);
      const periodEnd = new Date(input.periodEnd);

      const stats = await getJobExecutionStatsByHour(periodStart, periodEnd);
      return stats;
    }),

  /**
   * Get all job names
   */
  getAllJobNames: protectedProcedure.query(async () => {
    const jobNames = await getAllJobNames();
    return jobNames;
  }),
});
