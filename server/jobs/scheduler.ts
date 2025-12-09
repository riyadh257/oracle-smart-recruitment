import cron from "node-cron";
import { runAbTestAutoAnalysis, AB_TEST_AUTO_ANALYSIS_SCHEDULE } from "./abTestAutoAnalysis";

/**
 * Initialize all scheduled jobs
 * Call this function when the server starts
 */
export function initializeScheduledJobs() {
  console.log("[JobScheduler] Initializing scheduled jobs...");

  // Schedule A/B test auto-analysis job
  const abTestJob = cron.schedule(
    AB_TEST_AUTO_ANALYSIS_SCHEDULE.cron,
    async () => {
      console.log("[JobScheduler] Running A/B test auto-analysis...");
      const result = await runAbTestAutoAnalysis();
      
      if (result.success) {
        console.log(
          `[JobScheduler] A/B test analysis completed successfully. ` +
          `Analyzed: ${result.testsAnalyzed}, Winners found: ${result.winnersFound}`
        );
      } else {
        console.error(
          `[JobScheduler] A/B test analysis failed: ${result.error}`
        );
      }
    },
    {
      scheduled: true,
      timezone: AB_TEST_AUTO_ANALYSIS_SCHEDULE.timezone,
    }
  );

  console.log(
    `[JobScheduler] ✓ A/B test auto-analysis scheduled: ${AB_TEST_AUTO_ANALYSIS_SCHEDULE.cron} (${AB_TEST_AUTO_ANALYSIS_SCHEDULE.timezone})`
  );

  // Return job instances for management
  return {
    abTestJob,
  };
}

/**
 * Stop all scheduled jobs
 * Call this function during graceful shutdown
 */
export function stopScheduledJobs(jobs: ReturnType<typeof initializeScheduledJobs>) {
  console.log("[JobScheduler] Stopping scheduled jobs...");
  
  if (jobs.abTestJob) {
    jobs.abTestJob.stop();
    console.log("[JobScheduler] ✓ A/B test auto-analysis job stopped");
  }
  
  console.log("[JobScheduler] All scheduled jobs stopped");
}
