import { getDb } from "./db";
import { eq, and, gte, sql } from "drizzle-orm";
import { emailAnalytics } from "../drizzle/schema";

/**
 * Email Engagement Tracking Service
 * Tracks open rates, click-through rates, and optimizes notification timing
 */

export interface EngagementMetrics {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  deliveryRate: number;
  openRate: number;
  clickThroughRate: number;
  avgTimeToOpen: number; // in hours
}

export interface EmailTypeMetrics extends EngagementMetrics {
  emailType: string;
}

export interface TimeOfDayMetrics {
  hour: number;
  sent: number;
  opened: number;
  openRate: number;
}

/**
 * Track email sent event
 */
export async function trackEmailSent(data: {
  employerId: number;
  emailType: "invoice" | "weekly_report" | "interview_invite" | "application_confirmation" | "job_match" | "custom";
  recipientEmail: string;
  subject: string;
  trackingId: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(emailAnalytics).values({
    employerId: data.employerId,
    emailType: data.emailType,
    recipientEmail: data.recipientEmail,
    subject: data.subject,
    trackingId: data.trackingId,
    sentAt: new Date(),
  });

  return Number(result.insertId);
}

/**
 * Track email delivered event
 */
export async function trackEmailDelivered(trackingId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(emailAnalytics)
    .set({ deliveredAt: new Date() })
    .where(eq(emailAnalytics.trackingId, trackingId));
}

/**
 * Track email opened event (via tracking pixel)
 */
export async function trackEmailOpened(trackingId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const existing = await db
      .select()
      .from(emailAnalytics)
      .where(eq(emailAnalytics.trackingId, trackingId))
      .limit(1);

    if (existing.length > 0) {
      const current = existing[0];
      await db
        .update(emailAnalytics)
        .set({
          openedAt: current.openedAt || new Date(),
          openCount: (current.openCount || 0) + 1,
        })
        .where(eq(emailAnalytics.trackingId, trackingId));
    }
  } catch (error) {
    console.error("Failed to track email open:", error);
  }
}

/**
 * Track email link clicked event
 */
export async function trackEmailClicked(trackingId: string, linkUrl: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const existing = await db
      .select()
      .from(emailAnalytics)
      .where(eq(emailAnalytics.trackingId, trackingId))
      .limit(1);

    if (existing.length > 0) {
      const current = existing[0];
      await db
        .update(emailAnalytics)
        .set({
          clickedAt: current.clickedAt || new Date(),
          clickCount: (current.clickCount || 0) + 1,
          clickedLinks: current.clickedLinks
            ? [...(current.clickedLinks as string[]), linkUrl]
            : [linkUrl],
        })
        .where(eq(emailAnalytics.trackingId, trackingId));
    }
  } catch (error) {
    console.error("Failed to track email click:", error);
  }
}

/**
 * Get overall engagement metrics for an employer
 */
export async function getOverallEngagementMetrics(
  employerId: number,
  days: number = 30
): Promise<EngagementMetrics> {
  const db = await getDb();
  if (!db) {
    return {
      totalSent: 0,
      totalDelivered: 0,
      totalOpened: 0,
      totalClicked: 0,
      deliveryRate: 0,
      openRate: 0,
      clickThroughRate: 0,
      avgTimeToOpen: 0,
    };
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    const metrics = await db
      .select({
        totalSent: sql<number>`COUNT(*)`,
        totalDelivered: sql<number>`SUM(CASE WHEN ${emailAnalytics.deliveredAt} IS NOT NULL THEN 1 ELSE 0 END)`,
        totalOpened: sql<number>`SUM(CASE WHEN ${emailAnalytics.openedAt} IS NOT NULL THEN 1 ELSE 0 END)`,
        totalClicked: sql<number>`SUM(CASE WHEN ${emailAnalytics.clickedAt} IS NOT NULL THEN 1 ELSE 0 END)`,
        avgTimeToOpen: sql<number>`AVG(TIMESTAMPDIFF(HOUR, ${emailAnalytics.sentAt}, ${emailAnalytics.openedAt}))`,
      })
      .from(emailAnalytics)
      .where(
        and(
          eq(emailAnalytics.employerId, employerId),
          gte(emailAnalytics.sentAt, startDate)
        )
      );

    if (metrics.length === 0) {
      return {
        totalSent: 0,
        totalDelivered: 0,
        totalOpened: 0,
        totalClicked: 0,
        deliveryRate: 0,
        openRate: 0,
        clickThroughRate: 0,
        avgTimeToOpen: 0,
      };
    }

    const data = metrics[0];
    const totalSent = data.totalSent || 0;
    const totalDelivered = data.totalDelivered || 0;
    const totalOpened = data.totalOpened || 0;
    const totalClicked = data.totalClicked || 0;

    return {
      totalSent,
      totalDelivered,
      totalOpened,
      totalClicked,
      deliveryRate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
      openRate: totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0,
      clickThroughRate: totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0,
      avgTimeToOpen: data.avgTimeToOpen || 0,
    };
  } catch (error) {
    console.error("Failed to get engagement metrics:", error);
    return {
      totalSent: 0,
      totalDelivered: 0,
      totalOpened: 0,
      totalClicked: 0,
      deliveryRate: 0,
      openRate: 0,
      clickThroughRate: 0,
      avgTimeToOpen: 0,
    };
  }
}

/**
 * Get engagement metrics by email type
 */
export async function getEngagementByEmailType(
  employerId: number,
  days: number = 30
): Promise<EmailTypeMetrics[]> {
  const db = await getDb();
  if (!db) return [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    const metrics = await db
      .select({
        emailType: emailAnalytics.emailType,
        totalSent: sql<number>`COUNT(*)`,
        totalDelivered: sql<number>`SUM(CASE WHEN ${emailAnalytics.deliveredAt} IS NOT NULL THEN 1 ELSE 0 END)`,
        totalOpened: sql<number>`SUM(CASE WHEN ${emailAnalytics.openedAt} IS NOT NULL THEN 1 ELSE 0 END)`,
        totalClicked: sql<number>`SUM(CASE WHEN ${emailAnalytics.clickedAt} IS NOT NULL THEN 1 ELSE 0 END)`,
        avgTimeToOpen: sql<number>`AVG(TIMESTAMPDIFF(HOUR, ${emailAnalytics.sentAt}, ${emailAnalytics.openedAt}))`,
      })
      .from(emailAnalytics)
      .where(
        and(
          eq(emailAnalytics.employerId, employerId),
          gte(emailAnalytics.sentAt, startDate)
        )
      )
      .groupBy(emailAnalytics.emailType);

    return metrics.map((m) => {
      const totalSent = m.totalSent || 0;
      const totalDelivered = m.totalDelivered || 0;
      const totalOpened = m.totalOpened || 0;
      const totalClicked = m.totalClicked || 0;

      return {
        emailType: m.emailType,
        totalSent,
        totalDelivered,
        totalOpened,
        totalClicked,
        deliveryRate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
        openRate: totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0,
        clickThroughRate: totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0,
        avgTimeToOpen: m.avgTimeToOpen || 0,
      };
    });
  } catch (error) {
    console.error("Failed to get engagement by email type:", error);
    return [];
  }
}

/**
 * Get optimal send time based on historical open rates
 */
export async function getOptimalSendTime(employerId: number): Promise<TimeOfDayMetrics[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const metrics = await db
      .select({
        hour: sql<number>`HOUR(${emailAnalytics.sentAt})`,
        sent: sql<number>`COUNT(*)`,
        opened: sql<number>`SUM(CASE WHEN ${emailAnalytics.openedAt} IS NOT NULL THEN 1 ELSE 0 END)`,
      })
      .from(emailAnalytics)
      .where(eq(emailAnalytics.employerId, employerId))
      .groupBy(sql`HOUR(${emailAnalytics.sentAt})`)
      .orderBy(sql`HOUR(${emailAnalytics.sentAt})`);

    return metrics.map((m) => ({
      hour: m.hour || 0,
      sent: m.sent || 0,
      opened: m.opened || 0,
      openRate: m.sent > 0 ? ((m.opened || 0) / m.sent) * 100 : 0,
    }));
  } catch (error) {
    console.error("Failed to get optimal send time:", error);
    return [];
  }
}

/**
 * Generate tracking pixel URL
 */
export function getTrackingPixelUrl(trackingId: string): string {
  const baseUrl = process.env.VITE_APP_URL || "https://oracle-recruitment.manus.space";
  return `${baseUrl}/api/email/track/open/${trackingId}`;
}

/**
 * Generate tracked link URL
 */
export function getTrackedLinkUrl(trackingId: string, targetUrl: string): string {
  const baseUrl = process.env.VITE_APP_URL || "https://oracle-recruitment.manus.space";
  return `${baseUrl}/api/email/track/click/${trackingId}?url=${encodeURIComponent(targetUrl)}`;
}

/**
 * Generate unique tracking ID
 */
export function generateTrackingId(): string {
  return `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
