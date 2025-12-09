import { getDb } from "./db";
import { matchNotificationEvents, notificationHistory, notificationPreferences, users, employers } from "../drizzle/schema";
import { sendNotificationToUser } from "./realtimeNotifications";
import { eq, and, desc } from "drizzle-orm";
import { sendEmail } from "./emailDelivery";

/**
 * Match Notification Service
 * Handles real-time notifications for high-quality AI matches (≥90 score)
 */

export interface MatchNotificationData {
  candidateId: number;
  candidateName: string;
  jobId: number;
  jobTitle: string;
  matchScore: number;
  skillMatchScore?: number;
  cultureFitScore?: number;
  wellbeingMatchScore?: number;
  matchType: 'candidate_to_job' | 'job_to_candidate' | 'mutual';
  recruiterId: number;
  matchId?: number;
}

/**
 * Check if match score qualifies for real-time notification
 */
export function isHighQualityMatch(matchScore: number): boolean {
  return matchScore >= 90;
}

/**
 * Check if employer wants match notifications based on their preferences
 */
async function shouldNotifyEmployer(employerId: number, matchScore: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const prefs = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.employerId, employerId))
      .limit(1);

    if (prefs.length === 0) {
      // Default: notify for matches >= 85%
      return matchScore >= 85;
    }

    const pref = prefs[0];
    
    // Check if unsubscribed
    if (pref.unsubscribedAt) return false;
    
    // Check if job match alerts enabled
    if (!pref.enableJobMatchAlerts) return false;

    // Notify for high-quality matches (>= 85%)
    return matchScore >= 85;
  } catch (error) {
    console.error("[MatchNotification] Error checking preferences:", error);
    return false;
  }
}

/**
 * Create email template for match notification
 */
function createMatchEmailTemplate(data: MatchNotificationData, candidateProfileUrl: string): { subject: string; html: string; text: string } {
  const subject = `🎯 High-Quality Match Found: ${data.candidateName} for ${data.jobTitle}`;
  
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
        .score-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .score-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; border-bottom: 1px solid #e5e7eb; }
        .score-label { font-weight: 600; color: #4b5563; }
        .score-value { font-weight: bold; color: #667eea; font-size: 18px; }
        .overall-score { font-size: 48px; font-weight: bold; color: #10b981; text-align: center; margin: 20px 0; }
        .cta-button { display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 New High-Quality Match!</h1>
          <p>We found an excellent candidate for your position</p>
        </div>
        <div class="content">
          <h2>Candidate: ${data.candidateName}</h2>
          <p><strong>Position:</strong> ${data.jobTitle}</p>
          
          <div class="score-card">
            <div class="overall-score">${data.matchScore}%</div>
            <p style="text-align: center; color: #6b7280; margin-top: -10px;">Overall Match Score</p>
            
            ${data.skillMatchScore ? `<div class="score-row">
              <span class="score-label">💼 Skills Match</span>
              <span class="score-value">${data.skillMatchScore}%</span>
            </div>` : ''}
            ${data.cultureFitScore ? `<div class="score-row">
              <span class="score-label">🤝 Culture Fit</span>
              <span class="score-value">${data.cultureFitScore}%</span>
            </div>` : ''}
            ${data.wellbeingMatchScore ? `<div class="score-row" style="border-bottom: none;">
              <span class="score-label">🌟 Wellbeing Match</span>
              <span class="score-value">${data.wellbeingMatchScore}%</span>
            </div>` : ''}
          </div>
          
          <div style="text-align: center;">
            <a href="${candidateProfileUrl}" class="cta-button">View Candidate Profile</a>
          </div>
          
          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            💡 <strong>Tip:</strong> High-quality matches like this are rare. We recommend reviewing this candidate promptly to secure top talent.
          </p>
        </div>
        <div class="footer">
          <p>Oracle Smart Recruitment System</p>
          <p>You're receiving this because you have job match alerts enabled.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
🎯 High-Quality Match Found!

Candidate: ${data.candidateName}
Position: ${data.jobTitle}

Overall Match Score: ${data.matchScore}%
${data.skillMatchScore ? `- Skills Match: ${data.skillMatchScore}%` : ''}
${data.cultureFitScore ? `- Culture Fit: ${data.cultureFitScore}%` : ''}
${data.wellbeingMatchScore ? `- Wellbeing Match: ${data.wellbeingMatchScore}%` : ''}

View candidate profile: ${candidateProfileUrl}

---
Oracle Smart Recruitment System
  `.trim();

  return { subject, html, text };
}

/**
 * Send email notification for match
 */
async function sendMatchEmail(userId: number, data: MatchNotificationData, candidateProfileUrl: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // Get user email
    const userData = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userData.length === 0 || !userData[0].email) {
      console.warn(`[MatchNotification] No email found for user ${userId}`);
      return false;
    }

    const userEmail = userData[0].email;
    const emailTemplate = createMatchEmailTemplate(data, candidateProfileUrl);

    // Send email
    const emailSent = await sendEmail({
      to: userEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    // Record notification in history
    if (emailSent) {
      await db.insert(notificationHistory).values({
        userId,
        type: "general",
        title: `High-Quality Match: ${data.candidateName}`,
        message: `Match score: ${data.matchScore}% for ${data.jobTitle}`,
        actionUrl: candidateProfileUrl,
        priority: "high",
        deliveryMethod: "email",
        emailSent: 1,
        emailSentAt: new Date().toISOString(),
        relatedEntityType: "candidate",
        relatedEntityId: data.candidateId,
        isRead: 0,
      });
    }

    console.log(`[MatchNotification] Sent match email to user ${userId} (${userEmail})`);
    return emailSent;
  } catch (error) {
    console.error(`[MatchNotification] Error sending email to user ${userId}:`, error);
    return false;
  }
}

/**
 * Create and send real-time match notification (with email/SMS support)
 */
export async function createMatchNotification(data: MatchNotificationData): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[MatchNotification] Database not available");
    return;
  }

  try {
    // Only notify for high-quality matches
    if (!isHighQualityMatch(data.matchScore)) {
      return;
    }

    // Insert notification event into database
    const [event] = await db.insert(matchNotificationEvents).values({
      matchId: data.matchId || null,
      candidateId: data.candidateId,
      jobId: data.jobId,
      recruiterId: data.recruiterId,
      matchScore: data.matchScore,
      matchType: data.matchType,
      notificationSent: 1,
      notificationSentAt: new Date(),
      acknowledged: 0,
    });

    // Send real-time WebSocket notification
    sendNotificationToUser(data.recruiterId, {
      id: `match-notification-${event.insertId || Date.now()}`,
      type: "high_quality_match",
      title: "🎯 High-Quality Match Found!",
      message: `${data.candidateName} is a ${data.matchScore}% match for ${data.jobTitle}`,
      data: {
        candidateId: data.candidateId,
        candidateName: data.candidateName,
        jobId: data.jobId,
        jobTitle: data.jobTitle,
        matchScore: data.matchScore,
        skillMatchScore: data.skillMatchScore,
        cultureFitScore: data.cultureFitScore,
        wellbeingMatchScore: data.wellbeingMatchScore,
        matchId: data.matchId,
        notificationEventId: event.insertId,
        priority: "high",
        actionUrl: `/candidates/${data.candidateId}`,
      },
      timestamp: new Date(),
      read: false,
    });

    console.log(`[MatchNotification] Sent high-quality match notification to recruiter ${data.recruiterId}`);

    // Send email notification if enabled
    const candidateProfileUrl = `${process.env.VITE_FRONTEND_FORGE_API_URL || ''}/candidates/${data.candidateId}`;
    await sendMatchEmail(data.recruiterId, data, candidateProfileUrl);

  } catch (error) {
    console.error("[MatchNotification] Error creating match notification:", error);
  }
}

/**
 * Send standalone email notification for match (for bulk/scheduled notifications)
 */
export async function sendMatchNotificationEmail(employerId: number, data: MatchNotificationData): Promise<boolean> {
  try {
    // Check if employer wants notifications
    const shouldNotify = await shouldNotifyEmployer(employerId, data.matchScore);
    if (!shouldNotify) {
      console.log(`[MatchNotification] Skipping email for employer ${employerId} (preferences or score threshold)`);
      return false;
    }

    const db = await getDb();
    if (!db) return false;

    // Get employer user
    const employerData = await db
      .select({ userId: employers.userId })
      .from(employers)
      .where(eq(employers.id, employerId))
      .limit(1);

    if (employerData.length === 0) {
      console.warn(`[MatchNotification] No user found for employer ${employerId}`);
      return false;
    }

    const userId = employerData[0].userId;
    const candidateProfileUrl = `${process.env.VITE_FRONTEND_FORGE_API_URL || ''}/candidates/${data.candidateId}`;
    
    return await sendMatchEmail(userId, data, candidateProfileUrl);
  } catch (error) {
    console.error("[MatchNotification] Error in sendMatchNotificationEmail:", error);
    return false;
  }
}

/**
 * Send SMS notification (placeholder for future SMS integration)
 */
export async function sendMatchSMS(phoneNumber: string, data: MatchNotificationData): Promise<boolean> {
  // TODO: Integrate with SMS gateway (Twilio, AWS SNS, etc.)
  console.log(`[MatchNotification] SMS notification not yet implemented. Would send to: ${phoneNumber}`);
  console.log(`Match: ${data.candidateName} - ${data.matchScore}% for ${data.jobTitle}`);
  return false;
}

/**
 * Acknowledge a match notification
 */
export async function acknowledgeMatchNotification(
  notificationEventId: number,
  action: 'viewed' | 'contacted' | 'scheduled' | 'dismissed'
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[MatchNotification] Database not available");
    return;
  }

  try {
    await db.update(matchNotificationEvents)
      .set({
        acknowledged: 1,
        acknowledgedAt: new Date(),
        actionTaken: action,
        actionTakenAt: new Date(),
      })
      .where(eq(matchNotificationEvents.id, notificationEventId));

    console.log(`[MatchNotification] Acknowledged notification ${notificationEventId} with action: ${action}`);
  } catch (error) {
    console.error("[MatchNotification] Error acknowledging notification:", error);
  }
}

/**
 * Get unacknowledged match notifications for a recruiter
 */
export async function getUnacknowledgedNotifications(recruiterId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[MatchNotification] Database not available");
    return [];
  }

  try {
    const notifications = await db.select()
      .from(matchNotificationEvents)
      .where(
        and(
          eq(matchNotificationEvents.recruiterId, recruiterId),
          eq(matchNotificationEvents.acknowledged, 0)
        )
      )
      .orderBy(desc(matchNotificationEvents.createdAt))
      .limit(50);

    return notifications;
  } catch (error) {
    console.error("[MatchNotification] Error fetching unacknowledged notifications:", error);
    return [];
  }
}

/**
 * Get notification statistics for a recruiter
 */
export async function getNotificationStats(recruiterId: number): Promise<{
  total: number;
  unacknowledged: number;
  byAction: Record<string, number>;
}> {
  const db = await getDb();
  if (!db) {
    console.warn("[MatchNotification] Database not available");
    return { total: 0, unacknowledged: 0, byAction: {} };
  }

  try {
    const allNotifications = await db.select()
      .from(matchNotificationEvents)
      .where(eq(matchNotificationEvents.recruiterId, recruiterId));

    const unacknowledged = allNotifications.filter(n => n.acknowledged === 0).length;
    const byAction = allNotifications.reduce((acc, n) => {
      const action = n.actionTaken || 'none';
      acc[action] = (acc[action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: allNotifications.length,
      unacknowledged,
      byAction,
    };
  } catch (error) {
    console.error("[MatchNotification] Error fetching notification stats:", error);
    return { total: 0, unacknowledged: 0, byAction: {} };
  }
}
