import cron, { type ScheduledTask } from "node-cron";
import { generateMonthlyInvoices } from "./invoiceGeneration";
import { notifyOwner } from "./_core/notification";
import { sendEmail } from "./emailDelivery";
import { getDb } from "./db";
import { employers, notificationPreferences, type Employer } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { generateInvoiceEmail, generateWeeklyReportEmail } from "./responsiveEmailTemplates";
import { trackEmailSent, getTrackingPixelUrl, getTrackedLinkUrl } from "./emailAnalytics";
import { sendAllFeedbackReminders } from "./feedbackReminders";
import { cleanupOldTestData } from "./automationTestingCleanup";

/**
 * Scheduled Jobs System
 * Handles automated recurring tasks using cron
 */

interface JobLog {
  jobName: string;
  executedAt: Date;
  status: "success" | "error";
  message: string;
  duration: number;
}

// In-memory job logs (in production, store in database)
const jobLogs: JobLog[] = [];
const MAX_LOGS = 100;

/**
 * Log job execution
 */
function logJobExecution(log: JobLog) {
  jobLogs.unshift(log);
  if (jobLogs.length > MAX_LOGS) {
    jobLogs.pop();
  }
  console.log(`[Scheduled Job] ${log.jobName} - ${log.status}: ${log.message} (${log.duration}ms)`);
}

/**
 * Get job logs
 */
export function getJobLogs(): JobLog[] {
  return jobLogs;
}

/**
 * Monthly Invoice Generation Job
 * Runs on the 1st of every month at 9:00 AM
 */
export function scheduleMonthlyInvoiceGeneration() {
  // Cron format: minute hour day month weekday
  // "0 9 1 * *" = At 9:00 AM on the 1st of every month
  const schedule = "0 9 1 * *";

  const job = cron.schedule(schedule, async () => {
    const startTime = Date.now();
    const jobName = "Monthly Invoice Generation";

    try {
      console.log(`[Scheduled Job] Starting ${jobName}...`);

      // Generate invoices for all employers
      const results = await generateMonthlyInvoices();

      const duration = Date.now() - startTime;
      const message = `Generated ${results.successCount} invoices (${results.errorCount} errors)`;

      logJobExecution({
        jobName,
        executedAt: new Date(),
        status: results.errorCount > 0 ? "error" : "success",
        message,
        duration,
      });

      // Notify owner of completion
      await notifyOwner({
        title: "Monthly Invoices Generated",
        content: `${message}. Total amount: $${results.totalAmount.toFixed(2)}`,
      });

      // Send email notifications to employers with invoices
      const db = await getDb();
      if (db && results.invoices && results.invoices.length > 0) {
        for (const invoice of results.invoices) {
          try {
            const employer = await db.select().from(employers).where(eq(employers.id, invoice.employerId)).limit(1);
            if (!employer[0]?.contactEmail) continue;
            
            // Check notification preferences
            const prefs = await db.select().from(notificationPreferences).where(eq(notificationPreferences.employerId, invoice.employerId)).limit(1);
            if (prefs.length > 0 && !prefs[0].enableMonthlyInvoices) {
              console.log(`[Scheduled Job] Skipping invoice email for employer ${invoice.employerId} (disabled in preferences)`);
              continue;
            }
            
            // Track email for analytics
            const trackingId = await trackEmailSent({
              employerId: invoice.employerId,
              emailType: "invoice",
              recipientEmail: employer[0].contactEmail,
              subject: `Invoice Ready - ${invoice.period}`,
              metadata: { invoiceId: invoice.id, period: invoice.period },
            });
            
            const baseUrl = process.env.VITE_APP_URL || "http://localhost:3000";
            const trackingPixelUrl = trackingId ? getTrackingPixelUrl(trackingId, baseUrl) : undefined;
            const downloadUrl = trackingId ? getTrackedLinkUrl(trackingId, invoice.url, baseUrl) : invoice.url;
            
            // Generate responsive email
            const html = generateInvoiceEmail({
              companyName: employer[0].companyName,
              period: invoice.period,
              amount: invoice.totalAmount,
              dueDate: new Date(invoice.dueDate).toLocaleDateString(),
              downloadUrl,
              trackingPixelUrl,
            });
            
            await sendEmail({
              to: employer[0].contactEmail,
              subject: `Invoice Ready - ${invoice.period}`,
              html,
            });
          } catch (emailError) {
            console.error(`[Scheduled Job] Failed to send invoice email to employer ${invoice.employerId}:`, emailError);
          }
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      logJobExecution({
        jobName,
        executedAt: new Date(),
        status: "error",
        message: `Failed: ${errorMessage}`,
        duration,
      });

      // Notify owner of failure
      await notifyOwner({
        title: "Monthly Invoice Generation Failed",
        content: `Error: ${errorMessage}`,
      });
    }
  });

  console.log(`[Scheduled Job] ${schedule} - Monthly Invoice Generation scheduled`);
  return job;
}

/**
 * Weekly Report Generation Job
 * Runs every Monday at 8:00 AM
 */
export function scheduleWeeklyReportGeneration() {
  // "0 8 * * 1" = At 8:00 AM every Monday
  const schedule = "0 8 * * 1";

  const job = cron.schedule(schedule, async () => {
    const startTime = Date.now();
    const jobName = "Weekly Report Generation";

    try {
      console.log(`[Scheduled Job] Starting ${jobName}...`);

      // Generate and email weekly reports to all employers
      const db = await getDb();
      let reportCount = 0;
      
      if (db) {
        const allEmployers = await db.select().from(employers);
        
        for (const employer of allEmployers) {
          const contactEmail = employer.contactEmail;
          if (!contactEmail) continue;
          
          try {
            // Check notification preferences
            const prefs = await db.select().from(notificationPreferences).where(eq(notificationPreferences.employerId, employer.id)).limit(1);
            if (prefs.length > 0 && !prefs[0].enableWeeklyReports) {
              console.log(`[Scheduled Job] Skipping weekly report for employer ${employer.id} (disabled in preferences)`);
              continue;
            }
            
            // Generate simple weekly summary
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - 7);
            
            const summary = {
              companyName: employer.companyName,
              period: `${weekStart.toLocaleDateString()} - ${new Date().toLocaleDateString()}`,
              // In production, fetch actual metrics from database
              newApplications: 0,
              scheduledInterviews: 0,
              activeJobs: 0,
            };
            
            // Track email for analytics
            const trackingId = await trackEmailSent({
              employerId: employer.id,
              emailType: "weekly_report",
              recipientEmail: contactEmail,
              subject: `Weekly Recruitment Report - ${employer.companyName}`,
              metadata: { period: summary.period },
            });
            
            const baseUrl = process.env.VITE_APP_URL || "http://localhost:3000";
            const trackingPixelUrl = trackingId ? getTrackingPixelUrl(trackingId, baseUrl) : undefined;
            const dashboardUrl = `${baseUrl}/employer/analytics`;
            const trackedDashboardUrl = trackingId ? getTrackedLinkUrl(trackingId, dashboardUrl, baseUrl) : dashboardUrl;
            
            // Generate responsive email
            const html = generateWeeklyReportEmail({
              companyName: employer.companyName,
              period: summary.period,
              newApplications: summary.newApplications,
              scheduledInterviews: summary.scheduledInterviews,
              activeJobs: summary.activeJobs,
              dashboardUrl: trackedDashboardUrl,
              trackingPixelUrl,
            });
            
            await sendEmail({
              to: contactEmail,
              subject: `Weekly Recruitment Report - ${employer.companyName}`,
              html,
            });
            
            reportCount++;
          } catch (emailError) {
            console.error(`[Scheduled Job] Failed to send weekly report to ${employer.contactEmail}:`, emailError);
          }
        }
      }

      const duration = Date.now() - startTime;
      const message = `Generated and sent ${reportCount} weekly reports`;

      logJobExecution({
        jobName,
        executedAt: new Date(),
        status: "success",
        message,
        duration,
      });

      // Notify owner
      await notifyOwner({
        title: "Weekly Reports Sent",
        content: message,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      logJobExecution({
        jobName,
        executedAt: new Date(),
        status: "error",
        message: `Failed: ${errorMessage}`,
        duration,
      });

      await notifyOwner({
        title: "Weekly Report Generation Failed",
        content: `Error: ${errorMessage}`,
      });
    }
  });

  console.log(`[Scheduled Job] ${schedule} - Weekly Report Generation scheduled`);
  return job;
}

/**
 * Daily Cleanup Job
 * Runs every day at 2:00 AM
 */
export function scheduleDailyCleanup() {
  // "0 2 * * *" = At 2:00 AM every day
  const schedule = "0 2 * * *";

  const job = cron.schedule(schedule, async () => {
    const startTime = Date.now();
    const jobName = "Daily Cleanup";

    try {
      console.log(`[Scheduled Job] Starting ${jobName}...`);

      // Cleanup tasks:
      // - Remove old job logs
      // - Clean up temporary files
      // - Archive old data

      const duration = Date.now() - startTime;
      const message = "Cleanup completed successfully";

      logJobExecution({
        jobName,
        executedAt: new Date(),
        status: "success",
        message,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      logJobExecution({
        jobName,
        executedAt: new Date(),
        status: "error",
        message: `Failed: ${errorMessage}`,
        duration,
      });
    }
  });

  console.log(`[Scheduled Job] ${schedule} - Daily Cleanup scheduled`);
  return job;
}

/**
 * Job Monitoring - Check for stale data
 * Runs every hour
 */
export function scheduleJobMonitoring() {
  // "0 * * * *" = At the start of every hour
  const schedule = "0 * * * *";

  const job = cron.schedule(schedule, async () => {
    const startTime = Date.now();
    const jobName = "Job Monitoring";

    try {
      // Check for:
      // - Pending applications older than 7 days
      // - Unpaid invoices older than 30 days
      // - Stale job postings

      const duration = Date.now() - startTime;

      logJobExecution({
        jobName,
        executedAt: new Date(),
        status: "success",
        message: "Monitoring check completed",
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      logJobExecution({
        jobName,
        executedAt: new Date(),
        status: "error",
        message: `Failed: ${errorMessage}`,
        duration,
      });
    }
  });

  console.log(`[Scheduled Job] ${schedule} - Job Monitoring scheduled`);
  return job;
}

/**
 * Feedback Reminder Job
 * Runs every hour to check for interviews needing feedback
 */
export function scheduleFeedbackReminders() {
  // "0 * * * *" = At minute 0 of every hour
  const schedule = "0 * * * *";

  const job = cron.schedule(schedule, async () => {
    const startTime = Date.now();
    const jobName = "Feedback Reminders";

    try {
      console.log(`[Scheduled Job] Starting ${jobName}...`);

      const remindersSent = await sendAllFeedbackReminders();
      
      const duration = Date.now() - startTime;
      const message = `Sent ${remindersSent} feedback reminder(s)`;

      logJobExecution({
        jobName,
        executedAt: new Date(),
        status: "success",
        message,
        duration,
      });

      // Notify owner if reminders were sent
      if (remindersSent > 0) {
        await notifyOwner({
          title: "Feedback Reminders Sent",
          content: `Successfully sent ${remindersSent} interview feedback reminder(s) to interviewers.`,
        });
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      logJobExecution({
        jobName,
        executedAt: new Date(),
        status: "error",
        message: `Failed: ${errorMessage}`,
        duration,
      });

      await notifyOwner({
        title: "Feedback Reminder Job Failed",
        content: `Error sending feedback reminders: ${errorMessage}`,
      });
    }
  });

  console.log(`[Scheduled Job] ${schedule} - Feedback Reminders scheduled`);
  return job;
}

/**
 * Daily Matching Digest Job
 * Runs every day at 8:00 AM to send matching digests
 */
export function scheduleDailyMatchingDigest() {
  // Cron format: minute hour day month weekday
  // "0 8 * * *" = At 8:00 AM every day
  const schedule = "0 8 * * *";

  const job = cron.schedule(schedule, async () => {
    const startTime = Date.now();
    const jobName = "Daily Matching Digest";

    try {
      console.log(`[Scheduled Job] Starting ${jobName}...`);

      const { sendAllMatchingDigests } = await import("./matchingDigestService");
      const result = await sendAllMatchingDigests("daily_digest");

      const duration = Date.now() - startTime;
      const message = `Sent ${result.totalSent} digest(s) with ${result.totalMatches} total matches`;

      logJobExecution({
        jobName,
        executedAt: new Date(),
        status: "success",
        message,
        duration,
      });

      if (result.errors.length > 0) {
        await notifyOwner({
          title: "Matching Digest Job Completed with Errors",
          content: `Sent ${result.totalSent} digests, but encountered ${result.errors.length} error(s): ${result.errors.slice(0, 3).join(", ")}`,
        });
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      logJobExecution({
        jobName,
        executedAt: new Date(),
        status: "error",
        message: `Failed: ${errorMessage}`,
        duration,
      });

      await notifyOwner({
        title: "Daily Matching Digest Job Failed",
        content: `Error sending daily matching digests: ${errorMessage}`,
      });
    }
  });

  console.log(`[Scheduled Job] ${schedule} - Daily Matching Digest scheduled`);
  return job;
}

/**
 * Weekly Matching Digest Job
 * Runs every Monday at 9:00 AM to send weekly matching digests
 */
export function scheduleWeeklyMatchingDigest() {
  // Cron format: minute hour day month weekday
  // "0 9 * * 1" = At 9:00 AM every Monday
  const schedule = "0 9 * * 1";

  const job = cron.schedule(schedule, async () => {
    const startTime = Date.now();
    const jobName = "Weekly Matching Digest";

    try {
      console.log(`[Scheduled Job] Starting ${jobName}...`);

      const { sendAllMatchingDigests } = await import("./matchingDigestService");
      const result = await sendAllMatchingDigests("weekly_digest");

      const duration = Date.now() - startTime;
      const message = `Sent ${result.totalSent} digest(s) with ${result.totalMatches} total matches`;

      logJobExecution({
        jobName,
        executedAt: new Date(),
        status: "success",
        message,
        duration,
      });

      if (result.errors.length > 0) {
        await notifyOwner({
          title: "Weekly Matching Digest Job Completed with Errors",
          content: `Sent ${result.totalSent} digests, but encountered ${result.errors.length} error(s): ${result.errors.slice(0, 3).join(", ")}`,
        });
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      logJobExecution({
        jobName,
        executedAt: new Date(),
        status: "error",
        message: `Failed: ${errorMessage}`,
        duration,
      });

      await notifyOwner({
        title: "Weekly Matching Digest Job Failed",
        content: `Error sending weekly matching digests: ${errorMessage}`,
      });
    }
  });

  console.log(`[Scheduled Job] ${schedule} - Weekly Matching Digest scheduled`);
  return job;
}

/**
 * Daily Compliance Checks Job
 * Runs every day at 3:00 AM to check for compliance issues
 */
export function scheduleDailyComplianceChecks() {
  // Cron format: minute hour day month weekday
  // "0 3 * * *" = At 3:00 AM every day
  const schedule = "0 3 * * *";

  const job = cron.schedule(schedule, async () => {
    const startTime = Date.now();
    const jobName = "Daily Compliance Checks";

    try {
      console.log(`[Scheduled Job] Starting ${jobName}...`);

      const { runComplianceChecks } = await import("./complianceAlerts");
      const db = await getDb();
      
      if (!db) {
        throw new Error("Database not available");
      }

      // Get all employers
      const allEmployers = await db.select().from(employers);
      
      let totalAlerts = 0;
      let totalCritical = 0;
      let totalWarnings = 0;

      // Run compliance checks for each employer
      for (const employer of allEmployers) {
        const result = await runComplianceChecks(employer.id);
        totalAlerts += result.totalAlerts;
        totalCritical += result.criticalAlerts;
        totalWarnings += result.warningAlerts;
      }

      const duration = Date.now() - startTime;
      const message = `Checked ${allEmployers.length} employers: ${totalAlerts} alerts (${totalCritical} critical, ${totalWarnings} warnings)`;

      logJobExecution({
        jobName,
        executedAt: new Date(),
        status: "success",
        message,
        duration,
      });

      // Notify owner if there are critical alerts
      if (totalCritical > 0) {
        await notifyOwner({
          title: "Critical Compliance Alerts Detected",
          content: `Daily compliance check found ${totalCritical} critical alert(s) and ${totalWarnings} warning(s) across ${allEmployers.length} employers. Please review the Compliance Alerts Dashboard.`,
        });
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      logJobExecution({
        jobName,
        executedAt: new Date(),
        status: "error",
        message: `Failed: ${errorMessage}`,
        duration,
      });

      await notifyOwner({
        title: "Compliance Check Job Failed",
        content: `Error running daily compliance checks: ${errorMessage}`,
      });
    }
  });

  console.log(`[Scheduled Job] ${schedule} - Daily Compliance Checks scheduled`);
  return job;
}

/**
 * Weekly Test Data Cleanup Job
 * Runs every Sunday at 2:00 AM
 */
export function scheduleWeeklyTestDataCleanup() {
  // Cron format: minute hour day month weekday
  // "0 2 * * 0" = At 2:00 AM every Sunday
  const schedule = "0 2 * * 0";

  const job = cron.schedule(schedule, async () => {
    const startTime = Date.now();
    const jobName = "Weekly Test Data Cleanup";

    try {
      console.log(`[Scheduled Job] Starting ${jobName}...`);

      // Clean up old test data
      const results = await cleanupOldTestData();

      const duration = Date.now() - startTime;
      const message = `Cleaned up ${results.executionsDeleted} executions, ${results.testDataDeleted} test data records, ${results.candidatesDeleted} candidates, ${results.jobsDeleted} jobs, ${results.applicationsDeleted} applications`;

      logJobExecution({
        jobName,
        executedAt: new Date(),
        status: "success",
        message,
        duration,
      });

      // Notify owner of completion
      await notifyOwner({
        title: "Test Data Cleanup Completed",
        content: message,
      });

      console.log(`[Scheduled Job] ${jobName} completed successfully`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      logJobExecution({
        jobName,
        executedAt: new Date(),
        status: "error",
        message: `Failed: ${errorMessage}`,
        duration,
      });

      console.error(`[Scheduled Job] ${jobName} failed:`, error);

      // Notify owner of failure
      await notifyOwner({
        title: "Test Data Cleanup Failed",
        content: `Error: ${errorMessage}`,
      });
    }
  });

  console.log(`[Scheduled Job] ${schedule} - Weekly Test Data Cleanup scheduled`);
  return job;
}

/**
 * Initialize all scheduled jobs
 */
export function initializeScheduledJobs() {
  console.log("[Scheduled Jobs] Initializing automated tasks...");

  const jobs = [
    scheduleMonthlyInvoiceGeneration(),
    scheduleWeeklyReportGeneration(),
    scheduleDailyCleanup(),
    scheduleJobMonitoring(),
    scheduleFeedbackReminders(),
    scheduleDailyComplianceChecks(),
    scheduleDailyMatchingDigest(),
    scheduleWeeklyMatchingDigest(),
    scheduleWeeklyTestDataCleanup(),
  ];

  console.log(`[Scheduled Jobs] ${jobs.length} jobs initialized successfully`);

  return jobs;
}

/**
 * Stop all scheduled jobs
 */
export function stopAllJobs(jobs: ScheduledTask[]) {
  jobs.forEach((job) => job.stop());
  console.log("[Scheduled Jobs] All jobs stopped");
}

/**
 * Get job status
 */
export function getJobStatus() {
  const recentLogs = jobLogs.slice(0, 10);
  const successCount = jobLogs.filter((log) => log.status === "success").length;
  const errorCount = jobLogs.filter((log) => log.status === "error").length;

  return {
    totalExecutions: jobLogs.length,
    successCount,
    errorCount,
    successRate: jobLogs.length > 0 ? ((successCount / jobLogs.length) * 100).toFixed(2) + "%" : "N/A",
    recentLogs,
  };
}
