import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  notificationEngagementMetrics,
  notificationPerformanceSummary,
  notificationHistory,
} from "../drizzle/schema";

// ============================================================================
// NOTIFICATION ENGAGEMENT METRICS
// ============================================================================

export async function trackNotificationEngagement(data: {
  notificationId: number;
  userId: number;
  deliveredAt?: string;
  deliveryDuration?: number;
  viewedAt?: string;
  clickedAt?: string;
  actionTakenAt?: string;
  actionType?: string;
  dismissedAt?: string;
  deviceType?: string;
  browserType?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Calculate time-to-action metrics
  let timeToView: number | null = null;
  let timeToClick: number | null = null;
  let timeToAction: number | null = null;

  if (data.deliveredAt) {
    const deliveredTime = new Date(data.deliveredAt).getTime();
    if (data.viewedAt) {
      timeToView = Math.floor((new Date(data.viewedAt).getTime() - deliveredTime) / 1000);
    }
    if (data.clickedAt) {
      timeToClick = Math.floor((new Date(data.clickedAt).getTime() - deliveredTime) / 1000);
    }
    if (data.actionTakenAt) {
      timeToAction = Math.floor((new Date(data.actionTakenAt).getTime() - deliveredTime) / 1000);
    }
  }

  const [metric] = await db.insert(notificationEngagementMetrics).values({
    notificationId: data.notificationId,
    userId: data.userId,
    deliveredAt: data.deliveredAt || null,
    deliveryDuration: data.deliveryDuration || null,
    viewedAt: data.viewedAt || null,
    clickedAt: data.clickedAt || null,
    actionTakenAt: data.actionTakenAt || null,
    actionType: data.actionType || null,
    dismissedAt: data.dismissedAt || null,
    timeToView,
    timeToClick,
    timeToAction,
    deviceType: data.deviceType || null,
    browserType: data.browserType || null,
  });

  return metric;
}

export async function updateNotificationEngagement(
  notificationId: number,
  userId: number,
  updates: {
    viewedAt?: string;
    clickedAt?: string;
    actionTakenAt?: string;
    actionType?: string;
    dismissedAt?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get existing metric
  const [existing] = await db
    .select()
    .from(notificationEngagementMetrics)
    .where(
      and(
        eq(notificationEngagementMetrics.notificationId, notificationId),
        eq(notificationEngagementMetrics.userId, userId)
      )
    )
    .limit(1);

  if (!existing) {
    // Create new metric if doesn't exist
    return await trackNotificationEngagement({
      notificationId,
      userId,
      ...updates,
    });
  }

  // Calculate time-to-action metrics
  const updateData: any = { ...updates };

  if (existing.deliveredAt) {
    const deliveredTime = new Date(existing.deliveredAt).getTime();
    if (updates.viewedAt && !existing.timeToView) {
      updateData.timeToView = Math.floor((new Date(updates.viewedAt).getTime() - deliveredTime) / 1000);
    }
    if (updates.clickedAt && !existing.timeToClick) {
      updateData.timeToClick = Math.floor((new Date(updates.clickedAt).getTime() - deliveredTime) / 1000);
    }
    if (updates.actionTakenAt && !existing.timeToAction) {
      updateData.timeToAction = Math.floor((new Date(updates.actionTakenAt).getTime() - deliveredTime) / 1000);
    }
  }

  await db
    .update(notificationEngagementMetrics)
    .set(updateData)
    .where(
      and(
        eq(notificationEngagementMetrics.notificationId, notificationId),
        eq(notificationEngagementMetrics.userId, userId)
      )
    );

  return await db
    .select()
    .from(notificationEngagementMetrics)
    .where(
      and(
        eq(notificationEngagementMetrics.notificationId, notificationId),
        eq(notificationEngagementMetrics.userId, userId)
      )
    )
    .limit(1);
}

export async function getNotificationEngagement(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [metric] = await db
    .select()
    .from(notificationEngagementMetrics)
    .where(eq(notificationEngagementMetrics.notificationId, notificationId))
    .limit(1);

  return metric || null;
}

// ============================================================================
// NOTIFICATION PERFORMANCE SUMMARY
// ============================================================================

export async function calculatePerformanceSummary(
  notificationType: string,
  channel: string,
  periodStart: string,
  periodEnd: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all notifications of this type in the period
  const notifications = await db
    .select({
      id: notificationHistory.id,
      channel: notificationHistory.channel,
    })
    .from(notificationHistory)
    .where(
      and(
        eq(notificationHistory.notificationType, notificationType),
        eq(notificationHistory.channel, channel as any),
        gte(notificationHistory.createdAt, periodStart),
        lte(notificationHistory.createdAt, periodEnd)
      )
    );

  const notificationIds = notifications.map((n) => n.id);

  if (notificationIds.length === 0) {
    return {
      notificationType,
      channel,
      periodStart,
      periodEnd,
      totalSent: 0,
      totalDelivered: 0,
      totalViewed: 0,
      totalClicked: 0,
      totalActioned: 0,
      totalDismissed: 0,
      deliveryRate: 0,
      viewRate: 0,
      clickRate: 0,
      actionRate: 0,
      avgTimeToView: null,
      avgTimeToClick: null,
      avgTimeToAction: null,
      effectivenessScore: 0,
    };
  }

  // Get engagement metrics
  const metrics = await db
    .select({
      totalDelivered: sql<number>`COUNT(CASE WHEN ${notificationEngagementMetrics.deliveredAt} IS NOT NULL THEN 1 END)`,
      totalViewed: sql<number>`COUNT(CASE WHEN ${notificationEngagementMetrics.viewedAt} IS NOT NULL THEN 1 END)`,
      totalClicked: sql<number>`COUNT(CASE WHEN ${notificationEngagementMetrics.clickedAt} IS NOT NULL THEN 1 END)`,
      totalActioned: sql<number>`COUNT(CASE WHEN ${notificationEngagementMetrics.actionTakenAt} IS NOT NULL THEN 1 END)`,
      totalDismissed: sql<number>`COUNT(CASE WHEN ${notificationEngagementMetrics.dismissedAt} IS NOT NULL THEN 1 END)`,
      avgTimeToView: sql<number>`AVG(${notificationEngagementMetrics.timeToView})`,
      avgTimeToClick: sql<number>`AVG(${notificationEngagementMetrics.timeToClick})`,
      avgTimeToAction: sql<number>`AVG(${notificationEngagementMetrics.timeToAction})`,
    })
    .from(notificationEngagementMetrics)
    .where(sql`${notificationEngagementMetrics.notificationId} IN (${sql.join(notificationIds, sql`, `)})`);

  const stats = metrics[0];
  const totalSent = notificationIds.length;
  const totalDelivered = Number(stats.totalDelivered) || 0;
  const totalViewed = Number(stats.totalViewed) || 0;
  const totalClicked = Number(stats.totalClicked) || 0;
  const totalActioned = Number(stats.totalActioned) || 0;
  const totalDismissed = Number(stats.totalDismissed) || 0;

  // Calculate rates (stored as percentage * 100 for precision)
  const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 10000) : 0;
  const viewRate = totalDelivered > 0 ? Math.round((totalViewed / totalDelivered) * 10000) : 0;
  const clickRate = totalDelivered > 0 ? Math.round((totalClicked / totalDelivered) * 10000) : 0;
  const actionRate = totalDelivered > 0 ? Math.round((totalActioned / totalDelivered) * 10000) : 0;

  // Calculate effectiveness score (0-100)
  // Weighted: 30% delivery, 25% view, 20% click, 25% action
  const effectivenessScore = Math.round(
    (deliveryRate / 10000) * 30 +
      (viewRate / 10000) * 25 +
      (clickRate / 10000) * 20 +
      (actionRate / 10000) * 25
  );

  return {
    notificationType,
    channel,
    periodStart,
    periodEnd,
    totalSent,
    totalDelivered,
    totalViewed,
    totalClicked,
    totalActioned,
    totalDismissed,
    deliveryRate,
    viewRate,
    clickRate,
    actionRate,
    avgTimeToView: stats.avgTimeToView ? Math.round(Number(stats.avgTimeToView)) : null,
    avgTimeToClick: stats.avgTimeToClick ? Math.round(Number(stats.avgTimeToClick)) : null,
    avgTimeToAction: stats.avgTimeToAction ? Math.round(Number(stats.avgTimeToAction)) : null,
    effectivenessScore,
  };
}

export async function savePerformanceSummary(summary: {
  notificationType: string;
  channel: string;
  periodStart: string;
  periodEnd: string;
  totalSent: number;
  totalDelivered: number;
  totalViewed: number;
  totalClicked: number;
  totalActioned: number;
  totalDismissed: number;
  deliveryRate: number;
  viewRate: number;
  clickRate: number;
  actionRate: number;
  avgTimeToView: number | null;
  avgTimeToClick: number | null;
  avgTimeToAction: number | null;
  effectivenessScore: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(notificationPerformanceSummary).values(summary as any);
}

export async function getPerformanceSummaries(filters: {
  notificationType?: string;
  channel?: string;
  periodStart?: string;
  periodEnd?: string;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [];
  if (filters.notificationType) {
    conditions.push(eq(notificationPerformanceSummary.notificationType, filters.notificationType));
  }
  if (filters.channel) {
    conditions.push(eq(notificationPerformanceSummary.channel, filters.channel as any));
  }
  if (filters.periodStart) {
    conditions.push(gte(notificationPerformanceSummary.periodStart, filters.periodStart));
  }
  if (filters.periodEnd) {
    conditions.push(lte(notificationPerformanceSummary.periodEnd, filters.periodEnd));
  }

  let query = db.select().from(notificationPerformanceSummary);

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  const summaries = await query
    .orderBy(desc(notificationPerformanceSummary.periodStart))
    .limit(filters.limit || 50);

  return summaries;
}

// ============================================================================
// ANALYTICS QUERIES
// ============================================================================

export async function getNotificationTypePerformance(userId: number, days: number = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const performance = await db
    .select({
      notificationType: notificationHistory.notificationType,
      channel: notificationHistory.channel,
      totalSent: sql<number>`COUNT(DISTINCT ${notificationHistory.id})`,
      totalViewed: sql<number>`COUNT(DISTINCT CASE WHEN ${notificationEngagementMetrics.viewedAt} IS NOT NULL THEN ${notificationHistory.id} END)`,
      totalClicked: sql<number>`COUNT(DISTINCT CASE WHEN ${notificationEngagementMetrics.clickedAt} IS NOT NULL THEN ${notificationHistory.id} END)`,
      totalActioned: sql<number>`COUNT(DISTINCT CASE WHEN ${notificationEngagementMetrics.actionTakenAt} IS NOT NULL THEN ${notificationHistory.id} END)`,
      avgTimeToView: sql<number>`AVG(${notificationEngagementMetrics.timeToView})`,
    })
    .from(notificationHistory)
    .leftJoin(
      notificationEngagementMetrics,
      eq(notificationHistory.id, notificationEngagementMetrics.notificationId)
    )
    .where(
      and(eq(notificationHistory.userId, userId), gte(notificationHistory.createdAt, startDate.toISOString()))
    )
    .groupBy(notificationHistory.notificationType, notificationHistory.channel);

  return performance.map((p) => ({
    ...p,
    viewRate: p.totalSent > 0 ? Math.round((Number(p.totalViewed) / Number(p.totalSent)) * 100) : 0,
    clickRate: p.totalSent > 0 ? Math.round((Number(p.totalClicked) / Number(p.totalSent)) * 100) : 0,
    actionRate: p.totalSent > 0 ? Math.round((Number(p.totalActioned) / Number(p.totalSent)) * 100) : 0,
    avgTimeToView: p.avgTimeToView ? Math.round(Number(p.avgTimeToView)) : null,
  }));
}

export async function getChannelComparison(userId: number, days: number = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const comparison = await db
    .select({
      channel: notificationHistory.channel,
      totalSent: sql<number>`COUNT(DISTINCT ${notificationHistory.id})`,
      totalViewed: sql<number>`COUNT(DISTINCT CASE WHEN ${notificationEngagementMetrics.viewedAt} IS NOT NULL THEN ${notificationHistory.id} END)`,
      totalClicked: sql<number>`COUNT(DISTINCT CASE WHEN ${notificationEngagementMetrics.clickedAt} IS NOT NULL THEN ${notificationHistory.id} END)`,
      totalActioned: sql<number>`COUNT(DISTINCT CASE WHEN ${notificationEngagementMetrics.actionTakenAt} IS NOT NULL THEN ${notificationHistory.id} END)`,
    })
    .from(notificationHistory)
    .leftJoin(
      notificationEngagementMetrics,
      eq(notificationHistory.id, notificationEngagementMetrics.notificationId)
    )
    .where(
      and(eq(notificationHistory.userId, userId), gte(notificationHistory.createdAt, startDate.toISOString()))
    )
    .groupBy(notificationHistory.channel);

  return comparison.map((c) => ({
    ...c,
    viewRate: c.totalSent > 0 ? Math.round((Number(c.totalViewed) / Number(c.totalSent)) * 100) : 0,
    clickRate: c.totalSent > 0 ? Math.round((Number(c.totalClicked) / Number(c.totalSent)) * 100) : 0,
    actionRate: c.totalSent > 0 ? Math.round((Number(c.totalActioned) / Number(c.totalSent)) * 100) : 0,
  }));
}
