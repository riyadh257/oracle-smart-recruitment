/**
 * Scheduled Job Runner
 * Manages automated background tasks that run on a schedule
 */

import { processDueFeedbackReminders } from "./feedbackReminderService";
import { getDb } from "./db";

export interface JobResult {
  jobName: string;
  success: boolean;
  executedAt: string;
  duration: number;
  recordsProcessed?: number;
  error?: string;
}

/**
 * Run daily feedback reminder processing job
 */
export async function runDailyFeedbackReminders(): Promise<JobResult> {
  const startTime = Date.now();
  const jobName = "Daily Feedback Reminders";

  try {
    console.log(`[Scheduled Job] Starting: ${jobName}`);

    const sentCount = await processDueFeedbackReminders();

    const duration = Date.now() - startTime;

    console.log(`[Scheduled Job] Completed: ${jobName} in ${duration}ms`);
    console.log(`  - Reminders sent: ${sentCount}`);

    return {
      jobName,
      success: true,
      executedAt: new Date().toISOString(),
      duration,
      recordsProcessed: sentCount,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Scheduled Job] Failed: ${jobName}`, error);

    return {
      jobName,
      success: false,
      executedAt: new Date().toISOString(),
      duration,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Run all scheduled jobs
 * This function should be called by a cron scheduler (e.g., node-cron, external cron)
 */
export async function runScheduledJobs(): Promise<JobResult[]> {
  console.log("[Scheduled Job Runner] Starting scheduled jobs...");

  const results: JobResult[] = [];

  // Run daily feedback reminders
  const feedbackResult = await runDailyFeedbackReminders();
  results.push(feedbackResult);

  // Add more scheduled jobs here as needed
  // Example:
  // const anotherJobResult = await runAnotherJob();
  // results.push(anotherJobResult);

  console.log("[Scheduled Job Runner] All scheduled jobs completed");
  console.log(`  - Total jobs: ${results.length}`);
  console.log(`  - Successful: ${results.filter((r) => r.success).length}`);
  console.log(`  - Failed: ${results.filter((r) => !r.success).length}`);

  return results;
}

/**
 * Initialize scheduled job runner with node-cron
 * This sets up automatic execution at specified intervals
 */
export function initializeScheduledJobs() {
  // For now, we'll use a simple setInterval approach
  // In production, you might want to use node-cron or a more robust scheduler

  // Run daily at 9:00 AM UTC (adjust timezone as needed)
  const DAILY_RUN_HOUR = 9;
  const DAILY_RUN_MINUTE = 0;

  // Calculate milliseconds until next run
  const now = new Date();
  const nextRun = new Date();
  nextRun.setUTCHours(DAILY_RUN_HOUR, DAILY_RUN_MINUTE, 0, 0);

  // If the scheduled time has already passed today, schedule for tomorrow
  if (nextRun <= now) {
    nextRun.setUTCDate(nextRun.getUTCDate() + 1);
  }

  const msUntilNextRun = nextRun.getTime() - now.getTime();

  console.log("[Scheduled Job Runner] Initialized");
  console.log(`  - Next run scheduled for: ${nextRun.toISOString()}`);
  console.log(`  - Time until next run: ${Math.round(msUntilNextRun / 1000 / 60)} minutes`);

  // Schedule first run
  setTimeout(() => {
    runScheduledJobs();

    // Then run every 24 hours
    setInterval(() => {
      runScheduledJobs();
    }, 24 * 60 * 60 * 1000);
  }, msUntilNextRun);

  // Also provide a manual trigger endpoint via tRPC
  console.log("[Scheduled Job Runner] Manual trigger available via admin.runScheduledJobs");
}

/**
 * Get scheduled job status and next run time
 */
export function getScheduledJobStatus() {
  const now = new Date();
  const nextRun = new Date();
  nextRun.setUTCHours(9, 0, 0, 0);

  if (nextRun <= now) {
    nextRun.setUTCDate(nextRun.getUTCDate() + 1);
  }

  return {
    enabled: true,
    nextRun: nextRun.toISOString(),
    timeUntilNextRun: nextRun.getTime() - now.getTime(),
    schedule: "Daily at 09:00 UTC",
    jobs: [
      {
        name: "Daily Feedback Reminders",
        description: "Process and send due feedback reminder emails",
        enabled: true,
      },
    ],
  };
}
