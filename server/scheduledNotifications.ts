import { eq, and, lte, gte, desc, asc, sql } from "drizzle-orm";
import { getDb } from "./db";
import { notificationQueue, optimalSendTimes } from "../drizzle/schema";
import { incrementTemplateUsage } from "./notificationTemplates";

export interface ScheduledNotification {
  id: number;
  userId: number;
  templateId: number | null;
  type: 'interview_reminder' | 'feedback_request' | 'candidate_response' | 'engagement_alert' | 'ab_test_result' | 'system_update' | 'general';
  title: string;
  message: string;
  actionUrl: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deliveryMethod: 'push' | 'email' | 'sms' | 'push_email' | 'push_sms' | 'email_sms' | 'all';
  scheduledFor: string;
  optimalSendTime: number;
  userSegment: string | null;
  campaignId: number | null;
  status: 'queued' | 'processing' | 'sent' | 'failed' | 'cancelled';
  attempts: number;
  lastAttemptAt: string | null;
  errorMessage: string | null;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

export async function scheduleNotification(notification: {
  userId: number;
  templateId?: number;
  type: ScheduledNotification['type'];
  title: string;
  message: string;
  actionUrl?: string;
  priority?: ScheduledNotification['priority'];
  deliveryMethod: ScheduledNotification['deliveryMethod'];
  scheduledFor: Date | string;
  optimalSendTime?: boolean;
  userSegment?: string;
  campaignId?: number;
  metadata?: any;
}): Promise<ScheduledNotification> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let scheduledTime = typeof notification.scheduledFor === 'string' 
    ? notification.scheduledFor 
    : notification.scheduledFor.toISOString();

  // If optimal send time is requested, adjust the scheduled time
  if (notification.optimalSendTime && notification.userId) {
    const optimal = await getOptimalSendTime(notification.userId, notification.type);
    if (optimal) {
      const scheduledDate = new Date(scheduledTime);
      const [hours, minutes] = optimal.split(':').map(Number);
      scheduledDate.setHours(hours, minutes, 0, 0);
      scheduledTime = scheduledDate.toISOString();
    }
  }

  const result = await db.insert(notificationQueue).values({
    userId: notification.userId,
    templateId: notification.templateId || null,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    actionUrl: notification.actionUrl || null,
    priority: notification.priority || 'medium',
    deliveryMethod: notification.deliveryMethod,
    scheduledFor: scheduledTime,
    optimalSendTime: notification.optimalSendTime ? 1 : 0,
    userSegment: notification.userSegment || null,
    campaignId: notification.campaignId || null,
    status: 'queued',
    attempts: 0,
    metadata: notification.metadata ? JSON.stringify(notification.metadata) : null,
  });

  const insertedId = Number(result[0].insertId);
  const inserted = await getScheduledNotificationById(insertedId);
  if (!inserted) throw new Error("Failed to retrieve scheduled notification");
  
  // Increment template usage if template was used
  if (notification.templateId) {
    await incrementTemplateUsage(notification.templateId);
  }
  
  return inserted;
}

export async function getScheduledNotificationById(id: number): Promise<ScheduledNotification | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(notificationQueue)
    .where(eq(notificationQueue.id, id))
    .limit(1);

  return result[0];
}

export async function getScheduledNotifications(filters: {
  userId?: number;
  status?: ScheduledNotification['status'];
  type?: ScheduledNotification['type'];
  userSegment?: string;
  campaignId?: number;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
}): Promise<ScheduledNotification[]> {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(notificationQueue);
  const conditions: any[] = [];

  if (filters.userId) {
    conditions.push(eq(notificationQueue.userId, filters.userId));
  }
  if (filters.status) {
    conditions.push(eq(notificationQueue.status, filters.status));
  }
  if (filters.type) {
    conditions.push(eq(notificationQueue.type, filters.type));
  }
  if (filters.userSegment) {
    conditions.push(eq(notificationQueue.userSegment, filters.userSegment));
  }
  if (filters.campaignId) {
    conditions.push(eq(notificationQueue.campaignId, filters.campaignId));
  }
  if (filters.fromDate) {
    conditions.push(gte(notificationQueue.scheduledFor, filters.fromDate.toISOString()));
  }
  if (filters.toDate) {
    conditions.push(lte(notificationQueue.scheduledFor, filters.toDate.toISOString()));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  query = query.orderBy(asc(notificationQueue.scheduledFor)) as any;

  if (filters.limit) {
    query = query.limit(filters.limit) as any;
  }

  return await query;
}

export async function getDueNotifications(): Promise<ScheduledNotification[]> {
  const db = await getDb();
  if (!db) return [];

  const now = new Date().toISOString();
  
  return await db
    .select()
    .from(notificationQueue)
    .where(
      and(
        eq(notificationQueue.status, 'queued'),
        lte(notificationQueue.scheduledFor, now)
      )
    )
    .orderBy(desc(notificationQueue.priority), asc(notificationQueue.scheduledFor))
    .limit(100);
}

export async function updateNotificationStatus(
  id: number,
  status: ScheduledNotification['status'],
  errorMessage?: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {
    status,
    lastAttemptAt: new Date().toISOString(),
  };

  if (status === 'processing' || status === 'failed') {
    updateData.attempts = sql`${notificationQueue.attempts} + 1`;
  }

  if (errorMessage) {
    updateData.errorMessage = errorMessage;
  }

  await db
    .update(notificationQueue)
    .set(updateData)
    .where(eq(notificationQueue.id, id));
}

export async function cancelScheduledNotification(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(notificationQueue)
    .set({ status: 'cancelled' })
    .where(eq(notificationQueue.id, id));
}

export async function rescheduleNotification(
  id: number,
  newScheduledTime: Date | string
): Promise<ScheduledNotification> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const scheduledTime = typeof newScheduledTime === 'string' 
    ? newScheduledTime 
    : newScheduledTime.toISOString();

  await db
    .update(notificationQueue)
    .set({
      scheduledFor: scheduledTime,
      status: 'queued',
      attempts: 0,
      lastAttemptAt: null,
      errorMessage: null,
    })
    .where(eq(notificationQueue.id, id));

  const updated = await getScheduledNotificationById(id);
  if (!updated) throw new Error("Notification not found after rescheduling");
  return updated;
}

export async function getOptimalSendTime(
  userId: number,
  notificationType: string
): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(optimalSendTimes)
    .where(
      and(
        eq(optimalSendTimes.userId, userId),
        eq(optimalSendTimes.notificationType, notificationType)
      )
    )
    .limit(1);

  return result[0]?.optimalHour || null;
}

export async function getScheduledNotificationStats(filters: {
  userId?: number;
  campaignId?: number;
  fromDate?: Date;
  toDate?: Date;
}): Promise<{
  total: number;
  queued: number;
  processing: number;
  sent: number;
  failed: number;
  cancelled: number;
}> {
  const db = await getDb();
  if (!db) {
    return { total: 0, queued: 0, processing: 0, sent: 0, failed: 0, cancelled: 0 };
  }

  const conditions: any[] = [];

  if (filters.userId) {
    conditions.push(eq(notificationQueue.userId, filters.userId));
  }
  if (filters.campaignId) {
    conditions.push(eq(notificationQueue.campaignId, filters.campaignId));
  }
  if (filters.fromDate) {
    conditions.push(gte(notificationQueue.scheduledFor, filters.fromDate.toISOString()));
  }
  if (filters.toDate) {
    conditions.push(lte(notificationQueue.scheduledFor, filters.toDate.toISOString()));
  }

  let query = db
    .select({
      status: notificationQueue.status,
      count: sql<number>`count(*)`,
    })
    .from(notificationQueue);

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  query = query.groupBy(notificationQueue.status) as any;

  const results = await query;

  const stats = {
    total: 0,
    queued: 0,
    processing: 0,
    sent: 0,
    failed: 0,
    cancelled: 0,
  };

  results.forEach((row: any) => {
    const count = Number(row.count);
    stats.total += count;
    if (row.status === 'queued') stats.queued = count;
    else if (row.status === 'processing') stats.processing = count;
    else if (row.status === 'sent') stats.sent = count;
    else if (row.status === 'failed') stats.failed = count;
    else if (row.status === 'cancelled') stats.cancelled = count;
  });

  return stats;
}
