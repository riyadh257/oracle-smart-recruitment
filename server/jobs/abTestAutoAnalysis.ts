import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

/**
 * Daily scheduled job to automatically analyze running A/B tests
 * and determine winners when sufficient data is collected.
 * 
 * This job should be scheduled to run once per day (e.g., at 2 AM UTC)
 * to minimize impact on production traffic.
 */

export async function runAbTestAutoAnalysis() {
  console.log("[ABTestAutoAnalysis] Starting daily A/B test analysis job...");
  
  try {
    // Create a system context for the job (no user authentication required)
    const systemContext: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as any,
      res: {} as any,
    };

    // Create a caller with system context
    const caller = appRouter.createCaller(systemContext);

    // Run the auto-analysis
    const result = await caller.abTestConversion.autoAnalyzeTests();

    console.log(
      `[ABTestAutoAnalysis] Analysis complete. Analyzed ${result.analyzed.length} tests.`
    );

    // Log details for each analyzed test
    for (const analysis of result.analyzed) {
      if (analysis.result.statisticalSignificance === 1) {
        console.log(
          `[ABTestAutoAnalysis] ✓ Winner found for test ${analysis.testId}: ` +
          `${analysis.result.winner} with ${analysis.result.relativeImprovement.toFixed(1)}% improvement ` +
          `(p-value: ${analysis.result.pValue.toFixed(4)})`
        );
      } else {
        console.log(
          `[ABTestAutoAnalysis] ⊘ No significant winner yet for test ${analysis.testId} ` +
          `(p-value: ${analysis.result.pValue.toFixed(4)})`
        );
      }
    }

    return {
      success: true,
      testsAnalyzed: result.analyzed.length,
      winnersFound: result.analyzed.filter(
        (a) => a.result.statisticalSignificance === 1
      ).length,
    };
  } catch (error) {
    console.error("[ABTestAutoAnalysis] Error during analysis:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Schedule configuration for the job
 * 
 * Recommended schedule: Daily at 2 AM UTC
 * Cron expression: 0 0 2 * * *
 * 
 * To set up this job:
 * 1. Add a cron job to your system or use a job scheduler
 * 2. Call this function from your scheduler
 * 3. Monitor logs for results
 * 
 * Example using node-cron:
 * ```
 * import cron from 'node-cron';
 * 
 * cron.schedule('0 2 * * *', async () => {
 *   await runAbTestAutoAnalysis();
 * });
 * ```
 */
export const AB_TEST_AUTO_ANALYSIS_SCHEDULE = {
  cron: "0 0 2 * * *", // Daily at 2 AM UTC
  timezone: "UTC",
  description: "Automatically analyze running A/B tests and determine winners",
};
