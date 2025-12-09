/**
 * Enhanced A/B Testing tRPC Router
 * Handles A/B testing for email campaigns with statistical analysis
 */

import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import {
  createAbTest,
  getAbTestWithVariants,
  getEmployerAbTests,
  selectVariantForSending,
  recordVariantSent,
  updateVariantMetrics,
  determineWinner,
  createPerformanceSnapshot,
  getPerformanceSnapshots,
  autoPromoteWinner,
  getTestComparison,
} from "./enhancedAbTesting";
import { TRPCError } from "@trpc/server";

export const enhancedAbTestingRouter = router({
  /**
   * Create a new A/B test with multiple variants
   */
  createTest: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        emailType: z.enum([
          "interview_invite",
          "interview_reminder",
          "application_received",
          "application_update",
          "job_match",
          "rejection",
          "offer",
          "custom",
        ]),
        variants: z.array(
          z.object({
            variantName: z.string(),
            subjectLine: z.string(),
            emailContent: z.string(),
            trafficAllocation: z.number().min(0).max(100),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { getEmployerByUserId } = await import("./db");
      const employer = await getEmployerByUserId(ctx.user.id);

      if (!employer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Employer profile not found",
        });
      }

      const result = await createAbTest(
        {
          employerId: employer.id,
          name: input.name,
          emailType: input.emailType,
          status: "running",
          trafficSplit: 50, // Default for backwards compatibility
        },
        input.variants
      );

      return result;
    }),

  /**
   * Get A/B test with all variants
   */
  getTest: protectedProcedure
    .input(z.object({ testId: z.number() }))
    .query(async ({ input }) => {
      const result = await getAbTestWithVariants(input.testId);

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Test not found",
        });
      }

      return result;
    }),

  /**
   * Get all A/B tests for the current employer
   */
  getEmployerTests: protectedProcedure.query(async ({ ctx }) => {
    const { getEmployerByUserId } = await import("./db");
    const employer = await getEmployerByUserId(ctx.user.id);

    if (!employer) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Employer profile not found",
      });
    }

    return await getEmployerAbTests(employer.id);
  }),

  /**
   * Select variant for sending
   */
  selectVariant: protectedProcedure
    .input(z.object({ testId: z.number() }))
    .query(async ({ input }) => {
      const variant = await selectVariantForSending(input.testId);

      if (!variant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No variants found for test",
        });
      }

      return variant;
    }),

  /**
   * Record email sent for a variant
   */
  recordSent: protectedProcedure
    .input(z.object({ variantId: z.number() }))
    .mutation(async ({ input }) => {
      await recordVariantSent(input.variantId);
      return { success: true };
    }),

  /**
   * Update variant metrics
   */
  updateMetrics: protectedProcedure
    .input(z.object({ variantId: z.number() }))
    .mutation(async ({ input }) => {
      await updateVariantMetrics(input.variantId);
      return { success: true };
    }),

  /**
   * Determine winner of A/B test
   */
  determineWinner: protectedProcedure
    .input(z.object({ testId: z.number() }))
    .mutation(async ({ input }) => {
      const winner = await determineWinner(input.testId);

      if (!winner) {
        return {
          hasWinner: false,
          message: "Not enough data or no statistically significant winner",
        };
      }

      return {
        hasWinner: true,
        winner,
      };
    }),

  /**
   * Create performance snapshot
   */
  createSnapshot: protectedProcedure
    .input(z.object({ testId: z.number() }))
    .mutation(async ({ input }) => {
      await createPerformanceSnapshot(input.testId);
      return { success: true };
    }),

  /**
   * Get performance snapshots
   */
  getSnapshots: protectedProcedure
    .input(z.object({ testId: z.number() }))
    .query(async ({ input }) => {
      return await getPerformanceSnapshots(input.testId);
    }),

  /**
   * Auto-promote winning variant
   */
  autoPromoteWinner: protectedProcedure
    .input(z.object({ testId: z.number() }))
    .mutation(async ({ input }) => {
      const promoted = await autoPromoteWinner(input.testId);

      return {
        promoted,
        message: promoted
          ? "Winner promoted successfully"
          : "No clear winner to promote",
      };
    }),

  /**
   * Get test comparison data
   */
  getComparison: protectedProcedure
    .input(z.object({ testId: z.number() }))
    .query(async ({ input }) => {
      return await getTestComparison(input.testId);
    }),
});
