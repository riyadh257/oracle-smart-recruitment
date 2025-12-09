import * as db from "./db";
import { randomBytes } from "crypto";

/**
 * Email Tracking Service
 * Provides tracking pixel and click redirect functionality for email analytics
 */

// Generate a unique tracking ID for each email
export function generateTrackingId(): string {
  return randomBytes(32).toString("hex");
}

// Generate tracking pixel URL
export function getTrackingPixelUrl(trackingId: string, baseUrl: string): string {
  return `${baseUrl}/api/track/open/${trackingId}`;
}

// Generate click tracking URL
export function getClickTrackingUrl(trackingId: string, targetUrl: string, baseUrl: string): string {
  const encodedTarget = encodeURIComponent(targetUrl);
  return `${baseUrl}/api/track/click/${trackingId}?url=${encodedTarget}`;
}

// Inject tracking pixel into HTML email
export function injectTrackingPixel(htmlContent: string, trackingId: string, baseUrl: string): string {
  const pixelUrl = getTrackingPixelUrl(trackingId, baseUrl);
  const trackingPixel = `<img src="${pixelUrl}" width="1" height="1" style="display:none;" alt="" />`;
  
  // Try to inject before closing body tag, otherwise append to end
  if (htmlContent.includes("</body>")) {
    return htmlContent.replace("</body>", `${trackingPixel}</body>`);
  }
  return htmlContent + trackingPixel;
}

// Wrap all links in HTML with tracking URLs
export function wrapLinksWithTracking(htmlContent: string, trackingId: string, baseUrl: string): string {
  // Match all href attributes in anchor tags
  const hrefRegex = /(<a[^>]+href=["'])([^"']+)(["'][^>]*>)/gi;
  
  return htmlContent.replace(hrefRegex, (match, prefix, url, suffix) => {
    // Skip if already a tracking URL or if it's a mailto/tel link
    if (url.includes("/api/track/") || url.startsWith("mailto:") || url.startsWith("tel:")) {
      return match;
    }
    
    const trackedUrl = getClickTrackingUrl(trackingId, url, baseUrl);
    return `${prefix}${trackedUrl}${suffix}`;
  });
}

// Process email HTML to add all tracking
export function addEmailTracking(htmlContent: string, trackingId: string, baseUrl: string): string {
  let trackedHtml = wrapLinksWithTracking(htmlContent, trackingId, baseUrl);
  trackedHtml = injectTrackingPixel(trackedHtml, trackingId, baseUrl);
  return trackedHtml;
}

// Handle tracking pixel request (email open)
export async function trackEmailOpen(trackingId: string): Promise<boolean> {
  try {
    const analytics = await db.getEmailAnalyticsByTrackingId(trackingId);
    
    if (!analytics) {
      console.warn(`[Email Tracking] No analytics found for tracking ID: ${trackingId}`);
      return false;
    }
    
    const now = new Date();
    const updates: any = {
      openCount: (analytics.openCount || 0) + 1,
    };
    
    // Set openedAt timestamp on first open
    if (!analytics.openedAt) {
      updates.openedAt = now;
    }
    
    await db.updateEmailAnalytics(trackingId, updates);
    
    // Update A/B test variant metrics if this email is part of a test
    if (analytics.metadata && analytics.metadata.abTestId && analytics.metadata.variantId) {
      await updateAbTestVariantMetrics(
        analytics.metadata.abTestId,
        analytics.metadata.variantId,
        "open"
      );
    }
    
    return true;
  } catch (error) {
    console.error("[Email Tracking] Error tracking open:", error);
    return false;
  }
}

// Handle click tracking request
export async function trackEmailClick(trackingId: string, targetUrl: string): Promise<string> {
  try {
    const analytics = await db.getEmailAnalyticsByTrackingId(trackingId);
    
    if (!analytics) {
      console.warn(`[Email Tracking] No analytics found for tracking ID: ${trackingId}`);
      return targetUrl; // Still redirect to target
    }
    
    const now = new Date();
    const updates: any = {
      clickCount: (analytics.clickCount || 0) + 1,
    };
    
    // Set clickedAt timestamp on first click
    if (!analytics.clickedAt) {
      updates.clickedAt = now;
    }
    
    await db.updateEmailAnalytics(trackingId, updates);
    
    // Update A/B test variant metrics if this email is part of a test
    if (analytics.metadata && analytics.metadata.abTestId && analytics.metadata.variantId) {
      await updateAbTestVariantMetrics(
        analytics.metadata.abTestId,
        analytics.metadata.variantId,
        "click"
      );
    }
    
    return targetUrl;
  } catch (error) {
    console.error("[Email Tracking] Error tracking click:", error);
    return targetUrl; // Still redirect to target
  }
}

// Update A/B test variant metrics
async function updateAbTestVariantMetrics(
  testId: number,
  variantId: number,
  eventType: "open" | "click"
): Promise<void> {
  try {
    const variant = await db.getAbVariantById(variantId);
    if (!variant) return;
    
    const updates: any = {};
    
    if (eventType === "open") {
      updates.openCount = (variant.openCount || 0) + 1;
      // Recalculate open rate
      if (variant.sentCount > 0) {
        updates.openRate = Math.round((updates.openCount / variant.sentCount) * 10000);
      }
    } else if (eventType === "click") {
      updates.clickCount = (variant.clickCount || 0) + 1;
      // Recalculate click rate
      if (variant.sentCount > 0) {
        updates.clickRate = Math.round((updates.clickCount / variant.sentCount) * 10000);
      }
    }
    
    await db.updateAbVariant(variantId, updates);
  } catch (error) {
    console.error("[Email Tracking] Error updating A/B test metrics:", error);
  }
}

// Generate 1x1 transparent PNG tracking pixel
export function getTrackingPixelImage(): Buffer {
  // 1x1 transparent PNG in base64
  const transparentPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );
  return transparentPng;
}
