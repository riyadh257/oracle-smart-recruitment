import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { 
  notificationHistory, 
  pushSubscriptions, 
  users,
  type InsertNotificationHistory 
} from "../drizzle/schema";
import { sendPushNotification, sendBatchPushNotifications } from "./_core/webPush";

/**
 * Centralized notification service for sending notifications across channels
 * Handles both push notifications and email notifications
 */

export type NotificationType =
  | "interview_reminder"
  | "feedback_request"
  | "candidate_response"
  | "engagement_alert"
  | "ab_test_result"
  | "system_update"
  | "high_quality_match"
  | "bulk_operation_complete"
  | "profile_enrichment_complete"
  | "budget_alert"
  | "general";

export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export interface NotificationPayload {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  priority?: NotificationPriority;
  relatedEntityType?: string;
  relatedEntityId?: number;
  metadata?: Record<string, any>;
}

/**
 * Send a notification to a user across all enabled channels
 */
export async function sendNotification(payload: NotificationPayload): Promise<{
  success: boolean;
  pushSent: boolean;
  emailSent: boolean;
  error?: string;
}> {
  const db = await getDb();
  if (!db) {
    return { success: false, pushSent: false, emailSent: false, error: "Database not available" };
  }

  let pushSent = false;
  let emailSent = false;
  let pushSentAt: Date | null = null;
  let emailSentAt: Date | null = null;

  try {
    // Get user's active push subscriptions
    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, payload.userId),
          eq(pushSubscriptions.isActive, true)
        )
      );

    // Send push notifications if subscriptions exist
    if (subs.length > 0) {
      const pushPayload = {
        title: payload.title,
        body: payload.message,
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        url: payload.actionUrl,
        tag: `${payload.type}-${payload.relatedEntityId || Date.now()}`,
        requireInteraction: payload.priority === "urgent" || payload.priority === "high",
        data: {
          type: payload.type,
          ...payload.metadata,
        },
      };

      const result = await sendBatchPushNotifications(
        subs.map((sub) => ({
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        })),
        pushPayload
      );

      pushSent = result.successCount > 0;
      pushSentAt = pushSent ? new Date() : null;

      // Deactivate expired subscriptions
      if (result.expiredSubscriptions.length > 0) {
        for (const endpoint of result.expiredSubscriptions) {
          await db
            .update(pushSubscriptions)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(pushSubscriptions.endpoint, endpoint));
        }
      }
    }

    // TODO: Send email notification if user has email notifications enabled
    // This would integrate with the existing email notification system
    // emailSent = await sendEmailNotification(payload);
    // emailSentAt = emailSent ? new Date() : null;

    // Store notification in history
    await db.insert(notificationHistory).values({
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      actionUrl: payload.actionUrl,
      priority: payload.priority || "medium",
      deliveryMethod: pushSent ? "push" : "email",
      pushSent,
      pushSentAt,
      emailSent,
      emailSentAt,
      isRead: false,
      relatedEntityType: payload.relatedEntityType,
      relatedEntityId: payload.relatedEntityId,
      metadata: payload.metadata,
    });

    return {
      success: pushSent || emailSent,
      pushSent,
      emailSent,
    };
  } catch (error: any) {
    console.error("[NotificationService] Error sending notification:", error);
    return {
      success: false,
      pushSent: false,
      emailSent: false,
      error: error.message,
    };
  }
}

/**
 * Send notifications to multiple users
 */
export async function sendBulkNotifications(
  payloads: NotificationPayload[]
): Promise<{
  successCount: number;
  failureCount: number;
  results: Array<{ userId: number; success: boolean; error?: string }>;
}> {
  const results = await Promise.allSettled(
    payloads.map((payload) => sendNotification(payload))
  );

  let successCount = 0;
  let failureCount = 0;
  const detailedResults: Array<{ userId: number; success: boolean; error?: string }> = [];

  results.forEach((result, index) => {
    const userId = payloads[index]!.userId;
    if (result.status === "fulfilled" && result.value.success) {
      successCount++;
      detailedResults.push({ userId, success: true });
    } else {
      failureCount++;
      detailedResults.push({
        userId,
        success: false,
        error: result.status === "fulfilled" ? result.value.error : "Unknown error",
      });
    }
  });

  return { successCount, failureCount, results: detailedResults };
}

/**
 * Notify user about new candidate application
 */
export async function notifyNewApplication(params: {
  userId: number;
  candidateName: string;
  jobTitle: string;
  applicationId: number;
}): Promise<void> {
  await sendNotification({
    userId: params.userId,
    type: "candidate_response",
    title: "New Application Received",
    message: `${params.candidateName} has applied for ${params.jobTitle}`,
    actionUrl: `/candidates/${params.applicationId}`,
    priority: "medium",
    relatedEntityType: "application",
    relatedEntityId: params.applicationId,
  });
}

/**
 * Notify user about interview response
 */
export async function notifyInterviewResponse(params: {
  userId: number;
  candidateName: string;
  interviewId: number;
  accepted: boolean;
}): Promise<void> {
  await sendNotification({
    userId: params.userId,
    type: "candidate_response",
    title: `Interview ${params.accepted ? "Accepted" : "Declined"}`,
    message: `${params.candidateName} has ${params.accepted ? "accepted" : "declined"} the interview invitation`,
    actionUrl: `/interviews/${params.interviewId}`,
    priority: params.accepted ? "medium" : "high",
    relatedEntityType: "interview",
    relatedEntityId: params.interviewId,
  });
}

/**
 * Notify user to submit feedback after interview
 */
export async function notifyFeedbackRequest(params: {
  userId: number;
  candidateName: string;
  interviewId: number;
}): Promise<void> {
  await sendNotification({
    userId: params.userId,
    type: "feedback_request",
    title: "Feedback Request",
    message: `Please submit feedback for ${params.candidateName}'s interview`,
    actionUrl: `/interviews/${params.interviewId}`,
    priority: "high",
    relatedEntityType: "interview",
    relatedEntityId: params.interviewId,
  });
}

/**
 * Notify user about engagement score changes
 */
export async function notifyEngagementAlert(params: {
  userId: number;
  candidateName: string;
  engagementScore: number;
  candidateId: number;
}): Promise<void> {
  const isHighEngagement = params.engagementScore >= 80;
  
  await sendNotification({
    userId: params.userId,
    type: "engagement_alert",
    title: isHighEngagement ? "High Engagement Detected" : "Engagement Alert",
    message: `${params.candidateName} has an engagement score of ${params.engagementScore}`,
    actionUrl: `/candidates/${params.candidateId}`,
    priority: isHighEngagement ? "high" : "medium",
    relatedEntityType: "candidate",
    relatedEntityId: params.candidateId,
    metadata: { engagementScore: params.engagementScore },
  });
}

/**
 * Notify user about A/B test results
 */
export async function notifyAbTestResult(params: {
  userId: number;
  testName: string;
  winningVariant: string;
  testId: number;
}): Promise<void> {
  await sendNotification({
    userId: params.userId,
    type: "ab_test_result",
    title: "A/B Test Results Available",
    message: `${params.testName}: Variant ${params.winningVariant} is performing better`,
    actionUrl: `/campaigns/ab-tests/${params.testId}`,
    priority: "medium",
    relatedEntityType: "ab_test",
    relatedEntityId: params.testId,
  });
}

/**
 * Send interview reminder notification
 */
export async function notifyInterviewReminder(params: {
  userId: number;
  candidateName: string;
  interviewTime: Date;
  interviewId: number;
}): Promise<void> {
  const timeString = interviewTime.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  await sendNotification({
    userId: params.userId,
    type: "interview_reminder",
    title: "Upcoming Interview",
    message: `Interview with ${params.candidateName} at ${timeString}`,
    actionUrl: `/interviews/${params.interviewId}`,
    priority: "high",
    relatedEntityType: "interview",
    relatedEntityId: params.interviewId,
    metadata: { interviewTime: params.interviewTime.toISOString() },
  });
}
