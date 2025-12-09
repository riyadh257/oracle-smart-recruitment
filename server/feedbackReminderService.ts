/**
 * Feedback Reminder Service
 * Automated email reminders at 30/90/180 days to collect match success data
 */

import { getDb } from "./db";
import { 
  feedbackReminders, 
  applications, 
  candidates, 
  jobs, 
  users, 
  employers 
} from "../drizzle/schema";
import { eq, and, lte, isNull, gte, desc } from "drizzle-orm";
import { sendEmail } from "./emailDelivery";

export interface FeedbackReminderSchedule {
  applicationId: number;
  candidateId: number;
  employerId: number;
  scheduledFor: Date;
  reminderType: "30_day" | "90_day" | "180_day";
}

/**
 * Create feedback reminder email template
 */
function createFeedbackReminderEmail(data: {
  candidateName: string;
  jobTitle: string;
  matchScore: number;
  appliedDate: string;
  daysSinceMatch: number;
  feedbackUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `📊 Follow-up: How did ${data.candidateName} perform?`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .info-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .info-label { font-weight: 600; color: #4b5563; }
        .info-value { color: #1f2937; }
        .cta-button { display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .feedback-options { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Match Feedback Request</h1>
          <p>Help us improve our AI matching algorithm</p>
        </div>
        <div class="content">
          <p>Hi there,</p>
          
          <p>It's been <strong>${data.daysSinceMatch} days</strong> since we matched you with <strong>${data.candidateName}</strong> for the <strong>${data.jobTitle}</strong> position.</p>
          
          <div class="info-box">
            <div class="info-row">
              <span class="info-label">Candidate</span>
              <span class="info-value">${data.candidateName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Position</span>
              <span class="info-value">${data.jobTitle}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Match Score</span>
              <span class="info-value">${data.matchScore}%</span>
            </div>
            <div class="info-row" style="border-bottom: none;">
              <span class="info-label">Matched On</span>
              <span class="info-value">${data.appliedDate}</span>
            </div>
          </div>
          
          <div class="feedback-options">
            <strong>We'd love to hear:</strong>
            <ul style="margin: 10px 0;">
              <li>Did you interview this candidate?</li>
              <li>Did you make an offer?</li>
              <li>How well did they perform?</li>
              <li>Was our match score accurate?</li>
            </ul>
          </div>
          
          <p>Your feedback helps us continuously improve our AI matching algorithm and provide better candidates in the future.</p>
          
          <div style="text-align: center;">
            <a href="${data.feedbackUrl}" class="cta-button">Submit Feedback (2 minutes)</a>
          </div>
          
          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            💡 <strong>Why feedback matters:</strong> Every piece of feedback trains our AI to understand your hiring preferences better, leading to more accurate matches over time.
          </p>
        </div>
        <div class="footer">
          <p>Oracle Smart Recruitment System</p>
          <p>This is an automated reminder to help improve match quality.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
📊 Match Feedback Request

Hi there,

It's been ${data.daysSinceMatch} days since we matched you with ${data.candidateName} for the ${data.jobTitle} position.

Match Details:
- Candidate: ${data.candidateName}
- Position: ${data.jobTitle}
- Match Score: ${data.matchScore}%
- Matched On: ${data.appliedDate}

We'd love to hear:
- Did you interview this candidate?
- Did you make an offer?
- How well did they perform?
- Was our match score accurate?

Your feedback helps us continuously improve our AI matching algorithm.

Submit Feedback (2 minutes): ${data.feedbackUrl}

---
Oracle Smart Recruitment System
  `.trim();

  return { subject, html, text };
}

/**
 * Schedule feedback reminders for a new application
 */
export async function scheduleFeedbackReminders(applicationId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[FeedbackReminder] Database not available");
    return;
  }

  try {
    // Get application details
    const app = await db
      .select()
      .from(applications)
      .where(eq(applications.id, applicationId))
      .limit(1);

    if (app.length === 0) {
      console.warn(`[FeedbackReminder] Application ${applicationId} not found`);
      return;
    }

    const application = app[0];
    const appliedDate = new Date(application.appliedAt || new Date());

    // Schedule 30-day reminder
    const day30 = new Date(appliedDate);
    day30.setDate(day30.getDate() + 30);

    // Schedule 90-day reminder
    const day90 = new Date(appliedDate);
    day90.setDate(day90.getDate() + 90);

    // Schedule 180-day reminder
    const day180 = new Date(appliedDate);
    day180.setDate(day180.getDate() + 180);

    // Insert reminders
    await db.insert(feedbackReminders).values([
      {
        applicationId,
        candidateId: application.candidateId,
        jobId: application.jobId,
        scheduledFor: day30.toISOString(),
        reminderType: "30_day",
        status: "scheduled",
      },
      {
        applicationId,
        candidateId: application.candidateId,
        jobId: application.jobId,
        scheduledFor: day90.toISOString(),
        reminderType: "90_day",
        status: "scheduled",
      },
      {
        applicationId,
        candidateId: application.candidateId,
        jobId: application.jobId,
        scheduledFor: day180.toISOString(),
        reminderType: "180_day",
        status: "scheduled",
      },
    ]);

    console.log(`[FeedbackReminder] Scheduled 3 reminders for application ${applicationId}`);
  } catch (error) {
    console.error("[FeedbackReminder] Error scheduling reminders:", error);
  }
}

/**
 * Process due feedback reminders
 */
export async function processDueFeedbackReminders(): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[FeedbackReminder] Database not available");
    return 0;
  }

  try {
    const now = new Date().toISOString();

    // Find due reminders
    const dueReminders = await db
      .select({
        id: feedbackReminders.id,
        applicationId: feedbackReminders.applicationId,
        candidateId: feedbackReminders.candidateId,
        jobId: feedbackReminders.jobId,
        reminderType: feedbackReminders.reminderType,
        scheduledFor: feedbackReminders.scheduledFor,
        candidateName: candidates.name,
        candidateEmail: candidates.email,
        jobTitle: jobs.title,
        matchScore: applications.overallMatchScore,
        appliedAt: applications.appliedAt,
        employerId: jobs.employerId,
      })
      .from(feedbackReminders)
      .innerJoin(applications, eq(feedbackReminders.applicationId, applications.id))
      .innerJoin(candidates, eq(feedbackReminders.candidateId, candidates.id))
      .innerJoin(jobs, eq(feedbackReminders.jobId, jobs.id))
      .where(
        and(
          lte(feedbackReminders.scheduledFor, now),
          eq(feedbackReminders.status, "scheduled"),
          isNull(feedbackReminders.sentAt)
        )
      )
      .limit(100); // Process in batches

    console.log(`[FeedbackReminder] Found ${dueReminders.length} due reminders`);

    let sentCount = 0;

    for (const reminder of dueReminders) {
      try {
        // Get employer user email
        const employerData = await db
          .select({ userId: employers.userId })
          .from(employers)
          .where(eq(employers.id, reminder.employerId))
          .limit(1);

        if (employerData.length === 0) {
          console.warn(`[FeedbackReminder] No employer found for reminder ${reminder.id}`);
          continue;
        }

        const userData = await db
          .select({ email: users.email, name: users.name })
          .from(users)
          .where(eq(users.id, employerData[0].userId))
          .limit(1);

        if (userData.length === 0 || !userData[0].email) {
          console.warn(`[FeedbackReminder] No email found for reminder ${reminder.id}`);
          continue;
        }

        const userEmail = userData[0].email;

        // Calculate days since match
        const appliedDate = new Date(reminder.appliedAt || new Date());
        const daysSinceMatch = Math.floor((Date.now() - appliedDate.getTime()) / (1000 * 60 * 60 * 24));

        // Generate feedback URL with token
        const feedbackToken = Buffer.from(
          JSON.stringify({
            applicationId: reminder.applicationId,
            timestamp: Date.now(),
          })
        ).toString("base64url");

        const feedbackUrl = `${process.env.VITE_FRONTEND_FORGE_API_URL || ""}/feedback/submit?token=${feedbackToken}`;

        // Create email
        const emailTemplate = createFeedbackReminderEmail({
          candidateName: reminder.candidateName || "the candidate",
          jobTitle: reminder.jobTitle || "the position",
          matchScore: reminder.matchScore || 0,
          appliedDate: appliedDate.toLocaleDateString(),
          daysSinceMatch,
          feedbackUrl,
        });

        // Send email
        const emailSent = await sendEmail({
          to: userEmail,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
        });

        if (emailSent) {
          // Update reminder status
          await db
            .update(feedbackReminders)
            .set({
              status: "sent",
              sentAt: new Date().toISOString(),
              attempts: (reminder as any).attempts ? (reminder as any).attempts + 1 : 1,
            })
            .where(eq(feedbackReminders.id, reminder.id));

          sentCount++;
          console.log(`[FeedbackReminder] Sent reminder ${reminder.id} to ${userEmail}`);
        } else {
          // Mark as failed
          await db
            .update(feedbackReminders)
            .set({
              status: "failed",
              lastError: "Email delivery failed",
              attempts: (reminder as any).attempts ? (reminder as any).attempts + 1 : 1,
            })
            .where(eq(feedbackReminders.id, reminder.id));
        }
      } catch (error) {
        console.error(`[FeedbackReminder] Error processing reminder ${reminder.id}:`, error);
        
        // Mark as failed
        await db
          .update(feedbackReminders)
          .set({
            status: "failed",
            lastError: error instanceof Error ? error.message : "Unknown error",
            attempts: (reminder as any).attempts ? (reminder as any).attempts + 1 : 1,
          })
          .where(eq(feedbackReminders.id, reminder.id));
      }
    }

    console.log(`[FeedbackReminder] Successfully sent ${sentCount} reminders`);
    return sentCount;
  } catch (error) {
    console.error("[FeedbackReminder] Error processing due reminders:", error);
    return 0;
  }
}

/**
 * Cancel feedback reminders for an application (e.g., when feedback is already submitted)
 */
export async function cancelFeedbackReminders(applicationId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db
      .update(feedbackReminders)
      .set({
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(feedbackReminders.applicationId, applicationId),
          eq(feedbackReminders.status, "scheduled")
        )
      );

    console.log(`[FeedbackReminder] Cancelled reminders for application ${applicationId}`);
  } catch (error) {
    console.error("[FeedbackReminder] Error cancelling reminders:", error);
  }
}

/**
 * Get reminder statistics
 */
export async function getReminderStats(): Promise<{
  scheduled: number;
  sent: number;
  failed: number;
  cancelled: number;
  responseRate: number;
}> {
  const db = await getDb();
  if (!db) {
    return { scheduled: 0, sent: 0, failed: 0, cancelled: 0, responseRate: 0 };
  }

  try {
    const allReminders = await db.select().from(feedbackReminders);

    const scheduled = allReminders.filter((r) => r.status === "scheduled").length;
    const sent = allReminders.filter((r) => r.status === "sent").length;
    const failed = allReminders.filter((r) => r.status === "failed").length;
    const cancelled = allReminders.filter((r) => r.status === "cancelled").length;
    const responded = allReminders.filter((r) => r.feedbackSubmittedAt !== null).length;

    const responseRate = sent > 0 ? (responded / sent) * 100 : 0;

    return {
      scheduled,
      sent,
      failed,
      cancelled,
      responseRate: Math.round(responseRate * 10) / 10,
    };
  } catch (error) {
    console.error("[FeedbackReminder] Error getting stats:", error);
    return { scheduled: 0, sent: 0, failed: 0, cancelled: 0, responseRate: 0 };
  }
}
