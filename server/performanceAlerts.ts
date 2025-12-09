import { getDb } from "./db";
import { performanceAlerts, alertHistory, emailAnalytics } from "../drizzle/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import { sendEmail } from "./emailDelivery";

/**
 * Performance Alerts Service
 * Monitors email performance and triggers alerts based on configured thresholds
 */

export interface AlertTriggerConditions {
  metric?: string; // open_rate, click_rate, bounce_rate, etc.
  threshold?: number;
  comparison?: "above" | "below" | "equals";
  timeWindow?: string; // 24h, 7d, 30d
  benchmarkComparison?: boolean;
}

export interface CreateAlertInput {
  employerId: number;
  alertName: string;
  alertType: "underperformance" | "high_engagement" | "low_deliverability" | "benchmark_deviation" | "campaign_success";
  triggerConditions: AlertTriggerConditions;
  notificationChannels?: string[];
  recipientEmails?: string[];
}

/**
 * Create a new performance alert
 */
export async function createPerformanceAlert(input: CreateAlertInput) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(performanceAlerts).values({
    employerId: input.employerId,
    alertName: input.alertName,
    alertType: input.alertType,
    triggerConditions: input.triggerConditions,
    notificationChannels: input.notificationChannels || ["email", "dashboard"],
    recipientEmails: input.recipientEmails || [],
    isActive: true,
  });

  return result.insertId;
}

/**
 * Get all alerts for an employer
 */
export async function getEmployerAlerts(employerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(performanceAlerts)
    .where(eq(performanceAlerts.employerId, employerId))
    .orderBy(desc(performanceAlerts.createdAt));
}

/**
 * Get alert history
 */
export async function getAlertHistory(alertId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(alertHistory)
    .where(eq(alertHistory.alertId, alertId))
    .orderBy(desc(alertHistory.triggeredAt))
    .limit(limit);
}

/**
 * Check if alert conditions are met and trigger if necessary
 */
export async function checkAlertConditions(alertId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [alert] = await db
    .select()
    .from(performanceAlerts)
    .where(and(
      eq(performanceAlerts.id, alertId),
      eq(performanceAlerts.isActive, true)
    ));

  if (!alert) return false;

  const conditions = alert.triggerConditions;
  const metric = conditions.metric;
  const threshold = conditions.threshold || 0;
  const comparison = conditions.comparison || "below";

  // Calculate the metric value based on time window
  const metricValue = await calculateMetricValue(
    alert.employerId,
    metric || "open_rate",
    conditions.timeWindow || "7d"
  );

  // Check if threshold is met
  let thresholdMet = false;
  if (comparison === "below") {
    thresholdMet = metricValue < threshold;
  } else if (comparison === "above") {
    thresholdMet = metricValue > threshold;
  } else if (comparison === "equals") {
    thresholdMet = Math.abs(metricValue - threshold) < 0.1;
  }

  // If benchmark comparison is enabled, also check against industry benchmarks
  let benchmarkValue = undefined;
  if (conditions.benchmarkComparison) {
    benchmarkValue = getIndustryBenchmark(metric || "open_rate");
    if (comparison === "below") {
      thresholdMet = thresholdMet || metricValue < benchmarkValue;
    }
  }

  // Trigger alert if conditions are met
  if (thresholdMet) {
    await triggerAlert(alert.id, metricValue, benchmarkValue);
    return true;
  }

  return false;
}

/**
 * Calculate metric value for a given time window
 */
async function calculateMetricValue(
  employerId: number,
  metric: string,
  timeWindow: string
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Calculate time window start
  const now = new Date();
  const windowStart = new Date();
  if (timeWindow === "24h") {
    windowStart.setHours(now.getHours() - 24);
  } else if (timeWindow === "7d") {
    windowStart.setDate(now.getDate() - 7);
  } else if (timeWindow === "30d") {
    windowStart.setDate(now.getDate() - 30);
  }

  // Get analytics data for the time window
  const analytics = await db
    .select()
    .from(emailAnalytics)
    .where(gte(emailAnalytics.sentAt, windowStart));

  if (analytics.length === 0) return 0;

  // Calculate the requested metric
  const totalSent = analytics.length;
  const totalOpened = analytics.filter((a: any) => a.openCount && a.openCount > 0).length;
  const totalClicked = analytics.filter((a: any) => a.clickCount && a.clickCount > 0).length;
  const totalBounced = analytics.filter((a: any) => a.bounced).length;

  switch (metric) {
    case "open_rate":
      return totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    case "click_rate":
      return totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
    case "bounce_rate":
      return totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;
    case "engagement_rate":
      return totalSent > 0 ? ((totalOpened + totalClicked) / totalSent) * 100 : 0;
    default:
      return 0;
  }
}

/**
 * Get industry benchmark for a metric
 */
function getIndustryBenchmark(metric: string): number {
  // Industry benchmarks for recruitment emails
  const benchmarks: Record<string, number> = {
    open_rate: 25, // 25%
    click_rate: 3.5, // 3.5%
    bounce_rate: 2, // 2%
    engagement_rate: 28, // 28%
  };

  return benchmarks[metric] || 0;
}

/**
 * Trigger an alert and record in history
 */
async function triggerAlert(
  alertId: number,
  metricValue: number,
  benchmarkValue?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [alert] = await db
    .select()
    .from(performanceAlerts)
    .where(eq(performanceAlerts.id, alertId));

  if (!alert) return;

  // Determine severity
  let severity: "info" | "warning" | "critical" = "info";
  if (alert.alertType === "underperformance" || alert.alertType === "low_deliverability") {
    severity = "critical";
  } else if (alert.alertType === "benchmark_deviation") {
    severity = "warning";
  }

  // Generate alert message
  const alertMessage = generateAlertMessage(alert, metricValue, benchmarkValue);

  // Record in history
  await db.insert(alertHistory).values({
    alertId,
    metricValue: Math.round(metricValue),
    benchmarkValue: benchmarkValue ? Math.round(benchmarkValue) : undefined,
    alertMessage,
    severity,
  });

  // Update alert trigger count and timestamp
  await db
    .update(performanceAlerts)
    .set({
      lastTriggered: new Date(),
      triggerCount: (alert.triggerCount || 0) + 1,
    })
    .where(eq(performanceAlerts.id, alertId));

  // Send notifications
  await sendAlertNotifications(alert, alertMessage, severity);
}

/**
 * Generate alert message
 */
function generateAlertMessage(
  alert: any,
  metricValue: number,
  benchmarkValue?: number
): string {
  const conditions = alert.triggerConditions;
  const metric = conditions.metric || "performance";
  const threshold = conditions.threshold || 0;

  let message = `Alert: ${alert.alertName}\n\n`;
  message += `Type: ${alert.alertType}\n`;
  message += `Metric: ${metric}\n`;
  message += `Current Value: ${metricValue.toFixed(2)}%\n`;
  message += `Threshold: ${threshold}%\n`;

  if (benchmarkValue) {
    message += `Industry Benchmark: ${benchmarkValue}%\n`;
  }

  message += `\nTime Window: ${conditions.timeWindow || "7d"}\n`;
  message += `\nAction Required: Review your email campaigns and consider adjustments to improve performance.`;

  return message;
}

/**
 * Send alert notifications via configured channels
 */
async function sendAlertNotifications(
  alert: any,
  message: string,
  severity: string
) {
  const channels = alert.notificationChannels || [];
  const recipients = alert.recipientEmails || [];

  // Send email notifications
  if (channels.includes("email") && recipients.length > 0) {
    for (const email of recipients) {
      try {
        await sendEmail({
          to: email,
          subject: `[${severity.toUpperCase()}] ${alert.alertName}`,
          body: message,
        });
      } catch (error) {
        console.error("Failed to send alert email:", error);
      }
    }
  }

  // Dashboard notifications are handled by the frontend polling/websocket
}

/**
 * Update alert configuration
 */
export async function updateAlert(
  alertId: number,
  updates: Partial<CreateAlertInput>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(performanceAlerts)
    .set(updates)
    .where(eq(performanceAlerts.id, alertId));

  return true;
}

/**
 * Toggle alert active status
 */
export async function toggleAlertStatus(alertId: number, isActive: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(performanceAlerts)
    .set({ isActive })
    .where(eq(performanceAlerts.id, alertId));

  return true;
}

/**
 * Delete an alert
 */
export async function deleteAlert(alertId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete history first
  await db.delete(alertHistory).where(eq(alertHistory.alertId, alertId));

  // Delete alert
  await db.delete(performanceAlerts).where(eq(performanceAlerts.id, alertId));

  return true;
}

/**
 * Acknowledge an alert in history
 */
export async function acknowledgeAlert(
  historyId: number,
  userId: number,
  notes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(alertHistory)
    .set({
      acknowledged: true,
      acknowledgedBy: userId,
      acknowledgedAt: new Date(),
      notes,
    })
    .where(eq(alertHistory.id, historyId));

  return true;
}

/**
 * Run all active alerts check (to be called by scheduled job)
 */
export async function runAllAlertsCheck() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const activeAlerts = await db
    .select()
    .from(performanceAlerts)
    .where(eq(performanceAlerts.isActive, true));

  const results = [];
  for (const alert of activeAlerts) {
    const triggered = await checkAlertConditions(alert.id);
    results.push({ alertId: alert.id, triggered });
  }

  return results;
}
