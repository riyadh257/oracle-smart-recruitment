import { getPendingStatusNotifications, markStatusHistoryNotificationSent, getCandidateNotificationPreferences } from "./candidateNotificationDb";
import { sendMail } from "./_core/gmail";

/**
 * Application Status Notification Service
 * Sends real-time notifications to candidates when their application status changes
 */

interface StatusChangeEmailData {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  oldStatus: string;
  newStatus: string;
  notes?: string;
}

function getStatusDisplayName(status: string): string {
  const statusMap: Record<string, string> = {
    submitted: "Submitted",
    screening: "Under Review",
    interviewing: "Interview Scheduled",
    offered: "Offer Extended",
    rejected: "Not Selected",
  };
  return statusMap[status] || status;
}

function generateStatusChangeEmail(data: StatusChangeEmailData): { subject: string; html: string } {
  const { candidateName, jobTitle, oldStatus, newStatus, notes } = data;
  
  const statusDisplay = getStatusDisplayName(newStatus);
  const subject = `Application Update: ${jobTitle}`;
  
  let messageBody = "";
  let statusColor = "#3b82f6"; // blue
  
  switch (newStatus) {
    case "screening":
      messageBody = `Great news! Your application for <strong>${jobTitle}</strong> is now under review by our hiring team.`;
      statusColor = "#3b82f6"; // blue
      break;
    case "interviewing":
      messageBody = `Congratulations! You've been selected for an interview for the <strong>${jobTitle}</strong> position. You'll receive a separate email with interview details shortly.`;
      statusColor = "#10b981"; // green
      break;
    case "offered":
      messageBody = `Excellent news! We're pleased to extend an offer for the <strong>${jobTitle}</strong> position. Please check your email for the official offer letter and next steps.`;
      statusColor = "#10b981"; // green
      break;
    case "rejected":
      messageBody = `Thank you for your interest in the <strong>${jobTitle}</strong> position. After careful consideration, we've decided to move forward with other candidates. We encourage you to apply for other positions that match your skills.`;
      statusColor = "#ef4444"; // red
      break;
    default:
      messageBody = `Your application status for <strong>${jobTitle}</strong> has been updated to <strong>${statusDisplay}</strong>.`;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Status Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 3px solid ${statusColor};">
              <h1 style="margin: 0; color: #111827; font-size: 24px; font-weight: 600;">
                Application Status Update
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; color: #111827; font-size: 16px; line-height: 1.5;">
                Hi ${candidateName},
              </p>
              
              <p style="margin: 0 0 30px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                ${messageBody}
              </p>
              
              <!-- Status Badge -->
              <div style="background-color: #f9fafb; border-left: 4px solid ${statusColor}; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">
                  NEW STATUS
                </p>
                <p style="margin: 0; color: ${statusColor}; font-size: 20px; font-weight: 600;">
                  ${statusDisplay}
                </p>
              </div>
              
              ${notes ? `
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px 0; color: #92400e; font-size: 14px; font-weight: 600;">
                  Additional Notes:
                </p>
                <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.5;">
                  ${notes}
                </p>
              </div>
              ` : ''}
              
              <p style="margin: 30px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6;">
                You can view your complete application history and all updates in your dashboard.
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="${process.env.VITE_APP_URL || 'https://oracle-recruitment.manus.space'}/applications" 
                   style="display: inline-block; background-color: ${statusColor}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                  View Application Details
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                Best regards,<br>
                Oracle Smart Recruitment Team
              </p>
              <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                You're receiving this email because you applied for a position through Oracle Smart Recruitment. 
                You can manage your notification preferences in your account settings.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}

/**
 * Process and send pending status change notifications
 * This function should be called periodically (e.g., every minute) by a scheduled job
 */
export async function processPendingStatusNotifications(): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  try {
    const pending = await getPendingStatusNotifications();
    
    for (const item of pending) {
      const { history, application, candidate } = item;
      
      // Check candidate notification preferences
      const prefs = await getCandidateNotificationPreferences(candidate.id);
      
      // Skip if candidate has disabled application status updates
      if (prefs && !prefs.applicationStatusUpdates) {
        await markStatusHistoryNotificationSent(history.id);
        continue;
      }
      
      // Skip if candidate doesn't have an email
      if (!candidate.email) {
        await markStatusHistoryNotificationSent(history.id);
        continue;
      }
      
      try {
        // Generate email content
        const emailData: StatusChangeEmailData = {
          candidateName: candidate.fullName,
          candidateEmail: candidate.email,
          jobTitle: "Position", // TODO: Fetch job title from application
          oldStatus: history.previousStatus || "submitted",
          newStatus: history.newStatus,
          notes: history.notes || undefined,
        };
        
        const { subject, html } = generateStatusChangeEmail(emailData);
        
        // Send email via Gmail
        await sendMail({
          to: candidate.email,
          subject,
          html,
        });
        
        // Mark as sent
        await markStatusHistoryNotificationSent(history.id);
        sent++;
        
      } catch (error) {
        console.error(`Failed to send status notification for history ${history.id}:`, error);
        failed++;
      }
    }
    
  } catch (error) {
    console.error("Error processing pending status notifications:", error);
  }
  
  return { sent, failed };
}

/**
 * Send immediate status change notification (for real-time updates)
 */
export async function sendStatusChangeNotification(
  candidateId: number,
  candidateEmail: string,
  candidateName: string,
  jobTitle: string,
  oldStatus: string,
  newStatus: string,
  notes?: string
): Promise<boolean> {
  try {
    // Check candidate notification preferences
    const prefs = await getCandidateNotificationPreferences(candidateId);
    
    // Skip if candidate has disabled application status updates
    if (prefs && !prefs.applicationStatusUpdates) {
      return false;
    }
    
    const emailData: StatusChangeEmailData = {
      candidateName,
      candidateEmail,
      jobTitle,
      oldStatus,
      newStatus,
      notes,
    };
    
    const { subject, html } = generateStatusChangeEmail(emailData);
    
    await sendMail({
      to: candidateEmail,
      subject,
      html,
    });
    
    return true;
  } catch (error) {
    console.error("Failed to send status change notification:", error);
    return false;
  }
}
