import { batchCheckSimilarJobs } from "./jobSimilarity";
import { notifyInterviewReminder } from "./emailNotifications";
import * as db from "./db";
import { getTalentPoolAnalyticsDashboard } from "./talentPoolAnalytics";
import { generateWeeklyReportEmail, sendWeeklyAnalyticsEmail } from "./weeklyReports";

/**
 * Scheduled Tasks Service
 * Handles automated background jobs for the recruitment system
 */

/**
 * Daily job: Check for similar jobs and notify candidates
 * Runs every day at 9 AM
 */
export async function dailyJobSimilarityCheck(): Promise<void> {
  console.log("[Scheduled Task] Starting daily job similarity check...");
  
  try {
    // Check jobs posted in the last 24 hours
    await batchCheckSimilarJobs(24);
    
    console.log("[Scheduled Task] Daily job similarity check completed successfully");
  } catch (error) {
    console.error("[Scheduled Task] Error in daily job similarity check:", error);
    throw error;
  }
}

/**
 * Hourly job: Send interview reminders for interviews happening in 24 hours
 * Runs every hour
 */
export async function hourlyInterviewReminderCheck(): Promise<void> {
  console.log("[Scheduled Task] Starting hourly interview reminder check...");
  
  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);
    
    // Get interviews scheduled between 24-25 hours from now
    const upcomingInterviews = await db.getInterviewsInTimeRange(in24Hours, in25Hours);
    
    for (const interview of upcomingInterviews) {
      // Skip if reminder already sent
      if (interview.reminderSent) continue;
      
      const candidate = await db.getCandidateById(interview.candidateId);
      const job = await db.getJobById(interview.jobId);
      const employer = await db.getEmployerById(interview.employerId);
      
      if (candidate && job && employer && interview.scheduledTime) {
        await notifyInterviewReminder(
          candidate.fullName,
          candidate.email,
          job.title,
          employer.companyName,
          interview.scheduledTime,
          interview.meetingUrl || undefined
        );
        
        // Mark reminder as sent
        await db.markInterviewReminderSent(interview.id);
        
        console.log(`[Scheduled Task] Sent reminder for interview ${interview.id}`);
      }
    }
    
    console.log(`[Scheduled Task] Processed ${upcomingInterviews.length} interview reminders`);
  } catch (error) {
    console.error("[Scheduled Task] Error in interview reminder check:", error);
    throw error;
  }
}

/**
 * Weekly job: Generate and send analytics reports
 * Runs every Monday at 8 AM
 */
export async function weeklyAnalyticsReport(): Promise<void> {
  console.log("[Scheduled Task] Starting weekly analytics report generation...");
  
  try {
    // Get all employers who have talent pool candidates
    const employers = await db.getAllEmployersWithTalentPool();
    
    for (const employer of employers) {
      try {
        // Generate analytics report
        const analytics = await getTalentPoolAnalyticsDashboard(employer.id);
        
        // Generate HTML report
        const reportHtml = await generateWeeklyReportEmail(employer.id, analytics);
        
        // Send email report
        if (employer.contactEmail) {
          await sendWeeklyAnalyticsEmail(employer.contactEmail, employer.companyName, reportHtml);
          console.log(`[Scheduled Task] Sent weekly report to employer ${employer.id}`);
        }
      } catch (error) {
        console.error(`[Scheduled Task] Error generating report for employer ${employer.id}:`, error);
      }
    }
    
    console.log(`[Scheduled Task] Weekly analytics report completed for ${employers.length} employers`);
  } catch (error) {
    console.error("[Scheduled Task] Error in weekly analytics report:", error);
    throw error;
  }
}

/**
 * Initialize all scheduled tasks
 * This should be called when the server starts
 */
export function initializeScheduledTasks(): void {
  console.log("[Scheduled Tasks] Initializing automated tasks...");
  
  // Note: In production, these would be registered with a job scheduler
  // For now, we'll document the schedule and they can be triggered manually or via cron
  
  const tasks = [
    {
      name: "Daily Job Similarity Check",
      schedule: "0 9 * * *", // Every day at 9 AM
      handler: dailyJobSimilarityCheck,
    },
    {
      name: "Hourly Interview Reminder Check",
      schedule: "0 * * * *", // Every hour
      handler: hourlyInterviewReminderCheck,
    },
    {
      name: "Weekly Analytics Report",
      schedule: "0 8 * * 1", // Every Monday at 8 AM
      handler: weeklyAnalyticsReport,
    },
  ];
  
  console.log("[Scheduled Tasks] Registered tasks:");
  tasks.forEach((task: any) => {
    console.log(`  - ${task.name}: ${task.schedule}`);
  });
  
  console.log("[Scheduled Tasks] Initialization complete");
}

/**
 * Manual trigger endpoints for testing
 */
export const scheduledTaskHandlers = {
  dailyJobSimilarityCheck,
  hourlyInterviewReminderCheck,
  weeklyAnalyticsReport,
};
