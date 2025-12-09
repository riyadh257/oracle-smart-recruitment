import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { 
  abTestsNew, 
  abTestVariants, 
  abTestResults,
  conversionEvents,
  campaignSends
} from "../../drizzle/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export const abTestConversionRouter = router({
  // Track conversion event for A/B test
  trackConversion: protectedProcedure
    .input(
      z.object({
        testId: z.number(),
        variantId: z.number(),
        candidateId: z.number(),
        eventType: z.enum([
          'email_sent', 
          'email_opened', 
          'email_clicked', 
          'application_submitted', 
          'interview_accepted', 
          'interview_completed', 
          'offer_accepted'
        ]),
        eventData: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Record conversion event
      await db.insert(conversionEvents).values({
        candidateId: input.candidateId,
        eventType: input.eventType,
        eventData: input.eventData || {},
        createdAt: new Date().toISOString(),
      });

      // Update variant conversion count
      await db
        .update(abTestVariants)
        .set({
          conversionCount: sql`${abTestVariants.conversionCount} + 1`,
        })
        .where(eq(abTestVariants.id, input.variantId));

      // Recalculate conversion rate
      const [variant] = await db
        .select()
        .from(abTestVariants)
        .where(eq(abTestVariants.id, input.variantId))
        .limit(1);

      if (variant && variant.sentCount > 0) {
        const conversionRate = Math.round((variant.conversionCount / variant.sentCount) * 10000);
        await db
          .update(abTestVariants)
          .set({ conversionRate })
          .where(eq(abTestVariants.id, input.variantId));
      }

      return { success: true };
    }),

  // Analyze A/B test and determine winner
  analyzeTest: protectedProcedure
    .input(z.object({ testId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get all variants for this test
      const variants = await db
        .select()
        .from(abTestVariants)
        .where(eq(abTestVariants.testId, input.testId));

      if (variants.length < 2) {
        throw new Error("Need at least 2 variants to analyze");
      }

      // Sort by conversion rate
      const sortedVariants = [...variants].sort(
        (a, b) => (b.conversionRate || 0) - (a.conversionRate || 0)
      );

      const winner = sortedVariants[0];
      const runnerUp = sortedVariants[1];

      // Calculate statistical significance using chi-square test
      const winnerConversions = winner?.conversionCount || 0;
      const winnerTotal = winner?.sentCount || 1;
      const runnerUpConversions = runnerUp?.conversionCount || 0;
      const runnerUpTotal = runnerUp?.sentCount || 1;

      const winnerRate = winnerConversions / winnerTotal;
      const runnerUpRate = runnerUpConversions / runnerUpTotal;

      // Simple statistical test (chi-square approximation)
      const pooledRate = (winnerConversions + runnerUpConversions) / (winnerTotal + runnerUpTotal);
      const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1 / winnerTotal + 1 / runnerUpTotal));
      const zScore = Math.abs(winnerRate - runnerUpRate) / se;
      const pValue = Math.round((1 - normalCDF(zScore)) * 10000); // Store as basis points

      const isSignificant = zScore > 1.96; // 95% confidence level

      const relativeImprovement = runnerUpRate > 0 
        ? Math.round(((winnerRate - runnerUpRate) / runnerUpRate) * 10000)
        : 0;
      const absoluteImprovement = Math.round((winnerRate - runnerUpRate) * 10000);

      let recommendation = "";
      if (isSignificant) {
        recommendation = `Variant ${winner?.variantName} is the clear winner with ${(relativeImprovement / 100).toFixed(2)}% improvement. Recommend deploying this variant to all users.`;
      } else {
        recommendation = `No statistically significant difference found. Consider running the test longer or with a larger sample size.`;
      }

      // Save results
      const [existingResult] = await db
        .select()
        .from(abTestResults)
        .where(eq(abTestResults.testId, input.testId))
        .limit(1);

      if (existingResult) {
        await db
          .update(abTestResults)
          .set({
            winnerVariantId: winner?.id,
            statisticalSignificance: isSignificant ? 1 : 0,
            pValue,
            relativeImprovement,
            absoluteImprovement,
            recommendation,
            analysisCompletedAt: new Date().toISOString(),
          })
          .where(eq(abTestResults.id, existingResult.id));
      } else {
        await db.insert(abTestResults).values({
          testId: input.testId,
          winnerVariantId: winner?.id,
          statisticalSignificance: isSignificant ? 1 : 0,
          pValue,
          confidenceLevel: 95,
          relativeImprovement,
          absoluteImprovement,
          recommendation,
          analysisCompletedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        });
      }

      // Update test status to completed
      await db
        .update(abTestsNew)
        .set({
          status: "completed",
          completedAt: new Date().toISOString(),
        })
        .where(eq(abTestsNew.id, input.testId));

      return {
        winner: winner?.variantName,
        winnerConversionRate: (winner?.conversionRate || 0) / 100,
        isSignificant,
        pValue: pValue / 10000,
        relativeImprovement: relativeImprovement / 100,
        recommendation,
      };
    }),

  // Get A/B test results with conversion data
  getTestResults: protectedProcedure
    .input(z.object({ testId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [test] = await db
        .select()
        .from(abTestsNew)
        .where(eq(abTestsNew.id, input.testId))
        .limit(1);

      if (!test) throw new Error("Test not found");

      const variants = await db
        .select()
        .from(abTestVariants)
        .where(eq(abTestVariants.testId, input.testId));

      const [result] = await db
        .select()
        .from(abTestResults)
        .where(eq(abTestResults.testId, input.testId))
        .limit(1);

      return {
        test,
        variants: variants.map(v => ({
          ...v,
          openRate: (v.openRate || 0) / 100,
          clickRate: (v.clickRate || 0) / 100,
          conversionRate: (v.conversionRate || 0) / 100,
        })),
        result: result ? {
          ...result,
          pValue: (result.pValue || 0) / 10000,
          relativeImprovement: (result.relativeImprovement || 0) / 100,
          absoluteImprovement: (result.absoluteImprovement || 0) / 100,
        } : null,
      };
    }),

  // Get conversion funnel for a test
  getConversionFunnel: protectedProcedure
    .input(z.object({ testId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const variants = await db
        .select()
        .from(abTestVariants)
        .where(eq(abTestVariants.testId, input.testId));

      return variants.map(variant => ({
        variantName: variant.variantName,
        funnel: [
          { stage: "Sent", count: variant.sentCount || 0 },
          { stage: "Delivered", count: variant.deliveredCount || 0 },
          { stage: "Opened", count: variant.openedCount || 0 },
          { stage: "Clicked", count: variant.clickedCount || 0 },
          { stage: "Converted", count: variant.conversionCount || 0 },
        ],
      }));
    }),

  // Auto-analyze running tests (scheduled job helper)
  autoAnalyzeTests: protectedProcedure
    .mutation(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Find running tests with sufficient data
      const runningTests = await db
        .select()
        .from(abTestsNew)
        .where(eq(abTestsNew.status, "running"));

      const analyzed = [];

      for (const test of runningTests) {
        const variants = await db
          .select()
          .from(abTestVariants)
          .where(eq(abTestVariants.testId, test.id));

        // Check if we have enough data (at least 100 sends per variant)
        const hasEnoughData = variants.every(v => (v.sentCount || 0) >= 100);

        if (hasEnoughData && variants.length >= 2) {
          // Auto-analyze
          const sortedVariants = [...variants].sort(
            (a, b) => (b.conversionRate || 0) - (a.conversionRate || 0)
          );

          const winner = sortedVariants[0];
          const runnerUp = sortedVariants[1];

          const winnerConversions = winner?.conversionCount || 0;
          const winnerTotal = winner?.sentCount || 1;
          const runnerUpConversions = runnerUp?.conversionCount || 0;
          const runnerUpTotal = runnerUp?.sentCount || 1;

          const winnerRate = winnerConversions / winnerTotal;
          const runnerUpRate = runnerUpConversions / runnerUpTotal;

          const pooledRate = (winnerConversions + runnerUpConversions) / (winnerTotal + runnerUpTotal);
          const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1 / winnerTotal + 1 / runnerUpTotal));
          const zScore = Math.abs(winnerRate - runnerUpRate) / se;
          const isSignificant = zScore > 1.96;

          if (isSignificant) {
            // Automatically declare winner
            const pValue = Math.round((1 - normalCDF(zScore)) * 10000);
            const relativeImprovement = runnerUpRate > 0 
              ? Math.round(((winnerRate - runnerUpRate) / runnerUpRate) * 10000)
              : 0;

            await db.insert(abTestResults).values({
              testId: test.id,
              winnerVariantId: winner?.id,
              statisticalSignificance: 1,
              pValue,
              confidenceLevel: 95,
              relativeImprovement,
              absoluteImprovement: Math.round((winnerRate - runnerUpRate) * 10000),
              recommendation: `Variant ${winner?.variantName} automatically determined as winner with ${(relativeImprovement / 100).toFixed(2)}% improvement.`,
              analysisCompletedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            });

            await db
              .update(abTestsNew)
              .set({
                status: "completed",
                completedAt: new Date().toISOString(),
              })
              .where(eq(abTestsNew.id, test.id));

            analyzed.push({ testId: test.id, winner: winner?.variantName });
          }
        }
      }

      return { analyzed };
    }),
});

// Helper function: Normal CDF approximation for z-score
function normalCDF(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - prob : prob;
}
