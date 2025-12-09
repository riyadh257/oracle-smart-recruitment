import { randomBytes } from "crypto";
import { getDb } from "./db";
import { emailAnalytics } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Email Analytics Tracking System
 * Tracks email opens, clicks, and engagement metrics
 */

export type EmailType = "invoice" | "weekly_report" | "interview_invite" | "application_confirmation" | "job_match" | "custom";

/**
 * Generate a unique tracking ID for an email
 */
export function generateTrackingId(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Create email analytics record when sending an email
 */
export async function trackEmailSent(params: {
  employerId: number;
  emailType: EmailType;
  recipientEmail: string;
  subject: string;
  metadata?: Record<string, any>;
}): Promise<string> {
  const db = await getDb();
  if (!db) {
    console.warn("[Email Analytics] Database not available, skipping tracking");
    return "";
  }

  const trackingId = generateTrackingId();

  try {
    await db.insert(emailAnalytics).values({
      employerId: params.employerId,
      emailType: params.emailType,
      recipientEmail: params.recipientEmail,
      subject: params.subject,
      trackingId,
      metadata: params.metadata || {},
      deliveredAt: new Date(),
    });

    return trackingId;
  } catch (error) {
    console.error("[Email Analytics] Failed to track email sent:", error);
    return "";
  }
}

/**
 * Record email open event
 */
export async function trackEmailOpen(trackingId: string): Promise<boolean> {
  const db = await getDb();
  if (!db || !trackingId) return false;

  try {
    const existing = await db
      .select()
      .from(emailAnalytics)
      .where(eq(emailAnalytics.trackingId, trackingId))
      .limit(1);

    if (existing.length === 0) {
      console.warn(`[Email Analytics] Tracking ID not found: ${trackingId}`);
      return false;
    }

    const record = existing[0];
    const now = new Date();

    await db
      .update(emailAnalytics)
      .set({
        openedAt: record.openedAt || now, // Only set first open time
        openCount: (record.openCount || 0) + 1,
      })
      .where(eq(emailAnalytics.trackingId, trackingId));

    return true;
  } catch (error) {
    console.error("[Email Analytics] Failed to track email open:", error);
    return false;
  }
}

/**
 * Record email click event
 */
export async function trackEmailClick(trackingId: string): Promise<boolean> {
  const db = await getDb();
  if (!db || !trackingId) return false;

  try {
    const existing = await db
      .select()
      .from(emailAnalytics)
      .where(eq(emailAnalytics.trackingId, trackingId))
      .limit(1);

    if (existing.length === 0) {
      console.warn(`[Email Analytics] Tracking ID not found: ${trackingId}`);
      return false;
    }

    const record = existing[0];
    const now = new Date();

    await db
      .update(emailAnalytics)
      .set({
        clickedAt: record.clickedAt || now, // Only set first click time
        clickCount: (record.clickCount || 0) + 1,
      })
      .where(eq(emailAnalytics.trackingId, trackingId));

    return true;
  } catch (error) {
    console.error("[Email Analytics] Failed to track email click:", error);
    return false;
  }
}

/**
 * Get email analytics for an employer
 */
export async function getEmailAnalytics(employerId: number) {
  const db = await getDb();
  if (!db) {
    return {
      totalSent: 0,
      totalDelivered: 0,
      totalOpened: 0,
      totalClicked: 0,
      openRate: 0,
      clickRate: 0,
      deliveryRate: 0,
      byType: {},
      recentEmails: [],
    };
  }

  try {
    const records = await db
      .select()
      .from(emailAnalytics)
      .where(eq(emailAnalytics.employerId, employerId));

    const totalSent = records.length;
    const totalDelivered = records.filter((r) => r.deliveredAt).length;
    const totalOpened = records.filter((r) => r.openedAt).length;
    const totalClicked = records.filter((r) => r.clickedAt).length;

    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;

    // Group by email type
    const byType: Record<string, { sent: number; opened: number; clicked: number }> = {};
    for (const record of records) {
      if (!byType[record.emailType]) {
        byType[record.emailType] = { sent: 0, opened: 0, clicked: 0 };
      }
      byType[record.emailType].sent++;
      if (record.openedAt) byType[record.emailType].opened++;
      if (record.clickedAt) byType[record.emailType].clicked++;
    }

    // Get recent emails (last 10)
    const recentEmails = records
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
      .slice(0, 10)
      .map((r) => ({
        id: r.id,
        emailType: r.emailType,
        subject: r.subject,
        sentAt: r.sentAt,
        opened: !!r.openedAt,
        clicked: !!r.clickedAt,
        openCount: r.openCount || 0,
        clickCount: r.clickCount || 0,
      }));

    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;

    return {
      totalSent,
      totalDelivered,
      totalOpened,
      totalClicked,
      openRate: Math.round(openRate * 10) / 10,
      clickRate: Math.round(clickRate * 10) / 10,
      deliveryRate: Math.round(deliveryRate * 10) / 10,
      byType,
      recentEmails,
    };
  } catch (error) {
    console.error("[Email Analytics] Failed to get analytics:", error);
    return {
      totalSent: 0,
      totalDelivered: 0,
      totalOpened: 0,
      totalClicked: 0,
      openRate: 0,
      clickRate: 0,
      byType: {},
      recentEmails: [],
    };
  }
}

/**
 * Generate tracking pixel URL for email open tracking
 */
export function getTrackingPixelUrl(trackingId: string, baseUrl: string): string {
  return `${baseUrl}/api/email/track/open/${trackingId}`;
}

/**
 * Generate tracked link URL for click tracking
 */
export function getTrackedLinkUrl(trackingId: string, targetUrl: string, baseUrl: string): string {
  const encoded = encodeURIComponent(targetUrl);
  return `${baseUrl}/api/email/track/click/${trackingId}?url=${encoded}`;
}
