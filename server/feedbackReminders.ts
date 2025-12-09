import { getDb } from "./db";
import { interviews, interviewFeedback, candidates, users } from "../drizzle/schema";
import { eq, and, lt, isNull } from "drizzle-orm";
import { sendEmail } from "./emailDelivery";

/**
 * Feedback Reminder Email System
 * Sends automated reminders to interviewers who haven't submitted feedback
 * within 24 hours of completed interviews
 */

interface PendingFeedbackInterview {
  interviewId: number;
  candidateId: number;
  candidateName: string;
  interviewerEmail: string;
  interviewerName: string;
  scheduledAt: Date;
  completedHoursAgo: number;
}

/**
 * Find interviews that need feedback reminders
 * Criteria:
 * - Interview status is "completed"
 * - Interview was completed more than 24 hours ago
 * - No feedback has been submitted yet
 */
export async function findInterviewsNeedingFeedbackReminders(): Promise<PendingFeedbackInterview[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Feedback Reminders] Database not available");
    return [];
  }

  // Calculate 24 hours ago timestamp
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    // Get all completed interviews from more than 24 hours ago
    const completedInterviews = await db
      .select({
        interviewId: interviews.id,
        candidateId: interviews.candidateId,
        employerId: interviews.employerId,
        scheduledAt: interviews.scheduledAt,
      })
      .from(interviews)
      .where(
        and(
          eq(interviews.status, "completed"),
          lt(interviews.scheduledAt, twentyFourHoursAgo)
        )
      );

    const pendingFeedback: PendingFeedbackInterview[] = [];

    for (const interview of completedInterviews) {
      // Check if feedback exists for this interview
      const existingFeedback = await db
        .select()
        .from(interviewFeedback)
        .where(eq(interviewFeedback.interviewId, interview.interviewId))
        .limit(1);

      if (existingFeedback.length === 0) {
        // Get candidate details
        const candidate = await db
          .select()
          .from(candidates)
          .where(eq(candidates.id, interview.candidateId))
          .limit(1);

        // Get interviewer details (assuming employer is the interviewer)
        // In a real system, you'd have a separate interviewers table or link to users
        const interviewer = await db
          .select()
          .from(users)
          .where(eq(users.id, interview.employerId))
          .limit(1);

        if (candidate[0] && interviewer[0] && interviewer[0].email) {
          const completedHoursAgo = Math.floor(
            (Date.now() - interview.scheduledAt.getTime()) / (1000 * 60 * 60)
          );

          pendingFeedback.push({
            interviewId: interview.interviewId,
            candidateId: interview.candidateId,
            candidateName: candidate[0].fullName,
            interviewerEmail: interviewer[0].email,
            interviewerName: interviewer[0].name || "Interviewer",
            scheduledAt: interview.scheduledAt,
            completedHoursAgo,
          });
        }
      }
    }

    return pendingFeedback;
  } catch (error) {
    console.error("[Feedback Reminders] Error finding pending feedback:", error);
    return [];
  }
}

/**
 * Generate HTML email for feedback reminder
 */
function generateFeedbackReminderEmail(params: {
  interviewerName: string;
  candidateName: string;
  interviewDate: string;
  feedbackUrl: string;
}): string {
  const { interviewerName, candidateName, interviewDate, feedbackUrl } = params;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Feedback Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Interview Feedback Reminder</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hi ${interviewerName},
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                This is a friendly reminder that you haven't yet submitted feedback for your interview with <strong>${candidateName}</strong> on ${interviewDate}.
              </p>
              
              <p style="margin: 0 0 30px; color: #666666; font-size: 14px; line-height: 1.6;">
                Timely feedback helps us make better hiring decisions and provides valuable insights to improve our recruitment process.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${feedbackUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Submit Feedback Now
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #999999; font-size: 13px; line-height: 1.6;">
                If you've already submitted feedback, please disregard this message.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.6;">
                Oracle Smart Recruitment System<br>
                Automated Feedback Reminder
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Send feedback reminder email to a single interviewer
 */
export async function sendFeedbackReminderEmail(
  interview: PendingFeedbackInterview,
  baseUrl: string = process.env.VITE_APP_URL || "http://localhost:3000"
): Promise<boolean> {
  try {
    const feedbackUrl = `${baseUrl}/interviews/${interview.interviewId}/feedback`;
    const interviewDate = interview.scheduledAt.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const html = generateFeedbackReminderEmail({
      interviewerName: interview.interviewerName,
      candidateName: interview.candidateName,
      interviewDate,
      feedbackUrl,
    });

    await sendEmail({
      to: interview.interviewerEmail,
      subject: `Reminder: Submit feedback for ${interview.candidateName}'s interview`,
      html,
    });

    console.log(
      `[Feedback Reminders] Sent reminder to ${interview.interviewerEmail} for interview ${interview.interviewId}`
    );
    return true;
  } catch (error) {
    console.error(
      `[Feedback Reminders] Failed to send reminder for interview ${interview.interviewId}:`,
      error
    );
    return false;
  }
}

/**
 * Send feedback reminders for all pending interviews
 * Returns the number of reminders sent successfully
 */
export async function sendAllFeedbackReminders(): Promise<number> {
  const pendingInterviews = await findInterviewsNeedingFeedbackReminders();
  
  if (pendingInterviews.length === 0) {
    console.log("[Feedback Reminders] No pending feedback reminders found");
    return 0;
  }

  console.log(`[Feedback Reminders] Found ${pendingInterviews.length} interviews needing feedback`);

  let successCount = 0;
  for (const interview of pendingInterviews) {
    const sent = await sendFeedbackReminderEmail(interview);
    if (sent) {
      successCount++;
    }
    // Add a small delay between emails to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`[Feedback Reminders] Successfully sent ${successCount}/${pendingInterviews.length} reminders`);
  return successCount;
}
