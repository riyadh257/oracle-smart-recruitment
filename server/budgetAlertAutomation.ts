import { getDb } from "./db";
import { 
  budgetThresholds, 
  budgetAlerts, 
  budgetScenarios,
  emailCampaigns 
} from "../drizzle/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { sendGmailMessage, generateBudgetAlertContent } from "./gmailIntegration";
import { notifyOwner } from "./_core/notification";

/**
 * Budget Alert Automation Module
 * 
 * Monitors budget thresholds and sends automated alerts when spending
 * approaches or exceeds configured limits.
 */

export interface BudgetMonitoringResult {
  thresholdId: number;
  thresholdName: string;
  currentSpending: number;
  thresholdAmount: number;
  percentUsed: number;
  alertLevel: "warning" | "critical" | "exceeded";
  alertTriggered: boolean;
  notificationsSent: number;
}

/**
 * Check a single budget threshold and trigger alerts if needed
 */
export async function checkBudgetThreshold(
  thresholdId: number,
  userId: number
): Promise<BudgetMonitoringResult | null> {
  const db = await getDb();
  if (!db) {
    console.error("[Budget Alert] Database not available");
    return null;
  }

  // Get threshold configuration
  const thresholds = await db
    .select()
    .from(budgetThresholds)
    .where(and(
      eq(budgetThresholds.id, thresholdId),
      eq(budgetThresholds.isActive, 1)
    ))
    .limit(1);

  if (thresholds.length === 0) {
    console.log(`[Budget Alert] Threshold ${thresholdId} not found or inactive`);
    return null;
  }

  const threshold = thresholds[0];

  // Calculate current spending based on threshold type
  const currentSpending = await calculateCurrentSpending(
    threshold.thresholdType,
    threshold.id
  );

  const percentUsed = (currentSpending / threshold.thresholdAmount) * 100;

  // Determine alert level
  let alertLevel: "warning" | "critical" | "exceeded" | null = null;
  
  if (percentUsed >= 100) {
    alertLevel = "exceeded";
  } else if (percentUsed >= (threshold.criticalPercentage || 95)) {
    alertLevel = "critical";
  } else if (percentUsed >= (threshold.warningPercentage || 80)) {
    alertLevel = "warning";
  }

  // Check if alert already exists for this level
  if (alertLevel) {
    const existingAlerts = await db
      .select()
      .from(budgetAlerts)
      .where(and(
        eq(budgetAlerts.thresholdId, thresholdId),
        eq(budgetAlerts.alertLevel, alertLevel),
        eq(budgetAlerts.acknowledged, 0)
      ))
      .limit(1);

    // Only trigger new alert if none exists for this level
    if (existingAlerts.length === 0) {
      await triggerBudgetAlert(
        threshold,
        currentSpending,
        percentUsed,
        alertLevel,
        userId
      );

      return {
        thresholdId: threshold.id,
        thresholdName: threshold.name,
        currentSpending,
        thresholdAmount: threshold.thresholdAmount,
        percentUsed,
        alertLevel,
        alertTriggered: true,
        notificationsSent: 1,
      };
    }
  }

  return {
    thresholdId: threshold.id,
    thresholdName: threshold.name,
    currentSpending,
    thresholdAmount: threshold.thresholdAmount,
    percentUsed,
    alertLevel: alertLevel || "warning",
    alertTriggered: false,
    notificationsSent: 0,
  };
}

/**
 * Calculate current spending for a threshold period
 */
async function calculateCurrentSpending(
  thresholdType: string,
  thresholdId: number
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const now = new Date();
  let startDate: Date;

  switch (thresholdType) {
    case "daily":
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "weekly":
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
      break;
    case "monthly":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      // For per_campaign or total, use all time
      startDate = new Date(0);
  }

  // Calculate spending from budget scenarios
  const scenarios = await db
    .select()
    .from(budgetScenarios)
    .where(gte(budgetScenarios.createdAt, startDate.toISOString()));

  let totalSpending = 0;
  for (const scenario of scenarios) {
    totalSpending += scenario.totalBudget || 0;
  }

  // Add spending from email campaigns (if tracked)
  const campaigns = await db
    .select()
    .from(emailCampaigns)
    .where(gte(emailCampaigns.createdAt, startDate.toISOString()));

  // Estimate campaign costs (simplified - could be more sophisticated)
  totalSpending += campaigns.length * 100; // Example: 100 per campaign

  return totalSpending;
}

/**
 * Trigger a budget alert and send notifications
 */
async function triggerBudgetAlert(
  threshold: any,
  currentSpending: number,
  percentUsed: number,
  alertLevel: "warning" | "critical" | "exceeded",
  userId: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const now = new Date();
  const periodStart = getPeriodStart(threshold.thresholdType);
  const periodEnd = now;

  // Create alert record
  const alertMessage = generateAlertMessage(
    threshold.name,
    currentSpending,
    threshold.thresholdAmount,
    percentUsed,
    alertLevel
  );

  const alertResult = await db.insert(budgetAlerts).values({
    thresholdId: threshold.id,
    alertLevel,
    currentSpending,
    thresholdAmount: threshold.thresholdAmount,
    percentageUsed: Math.round(percentUsed),
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    smsCount: 0,
    message: alertMessage,
    notificationsSent: JSON.stringify([]),
    acknowledged: 0,
  });

  console.log(`[Budget Alert] Alert created: ${alertMessage}`);

  // Send notifications via configured channels
  const channels = threshold.alertChannels || ["email"];
  const recipients = threshold.alertRecipients || [];
  const notificationsSent: any[] = [];

  for (const channel of channels) {
    if (channel === "email" && recipients.length > 0) {
      try {
        const emailContent = generateBudgetAlertContent({
          userName: "Admin",
          budgetName: threshold.name,
          currentSpending,
          budgetLimit: threshold.thresholdAmount,
          percentUsed,
          threshold: alertLevel === "warning" 
            ? (threshold.warningPercentage || 80)
            : (threshold.criticalPercentage || 95),
        });

        const gmailResult = await sendGmailMessage({
          to: recipients,
          subject: `⚠️ Budget Alert: ${threshold.name} (${percentUsed.toFixed(1)}% used)`,
          content: emailContent,
        });

        notificationsSent.push({
          channel: "email",
          recipients,
          success: gmailResult.success,
          messageId: gmailResult.messageId,
          timestamp: new Date().toISOString(),
        });

        console.log(`[Budget Alert] Email notification sent:`, gmailResult);
      } catch (error) {
        console.error("[Budget Alert] Failed to send email:", error);
      }
    }

    if (channel === "push") {
      // Notify owner via push notification
      try {
        await notifyOwner({
          title: `Budget Alert: ${threshold.name}`,
          content: alertMessage,
        });

        notificationsSent.push({
          channel: "push",
          success: true,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("[Budget Alert] Failed to send push notification:", error);
      }
    }
  }

  // Update alert with notification records
  if (notificationsSent.length > 0) {
    await db
      .update(budgetAlerts)
      .set({ notificationsSent: JSON.stringify(notificationsSent) })
      .where(eq(budgetAlerts.id, Number(alertResult.insertId)));
  }
}

/**
 * Generate alert message text
 */
function generateAlertMessage(
  thresholdName: string,
  currentSpending: number,
  thresholdAmount: number,
  percentUsed: number,
  alertLevel: string
): string {
  const levelEmoji = {
    warning: "⚠️",
    critical: "🚨",
    exceeded: "❌",
  }[alertLevel] || "⚠️";

  return `${levelEmoji} Budget ${alertLevel.toUpperCase()}: ${thresholdName} has reached ${percentUsed.toFixed(1)}% (${currentSpending.toLocaleString()} / ${thresholdAmount.toLocaleString()})`;
}

/**
 * Get period start date based on threshold type
 */
function getPeriodStart(thresholdType: string): Date {
  const now = new Date();
  
  switch (thresholdType) {
    case "daily":
      const daily = new Date(now);
      daily.setHours(0, 0, 0, 0);
      return daily;
    case "weekly":
      const weekly = new Date(now);
      weekly.setDate(now.getDate() - now.getDay());
      weekly.setHours(0, 0, 0, 0);
      return weekly;
    case "monthly":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    default:
      return new Date(0);
  }
}

/**
 * Check all active budget thresholds
 */
export async function checkAllBudgetThresholds(userId: number): Promise<BudgetMonitoringResult[]> {
  const db = await getDb();
  if (!db) {
    console.error("[Budget Alert] Database not available");
    return [];
  }

  const activeThresholds = await db
    .select()
    .from(budgetThresholds)
    .where(eq(budgetThresholds.isActive, 1));

  const results: BudgetMonitoringResult[] = [];

  for (const threshold of activeThresholds) {
    const result = await checkBudgetThreshold(threshold.id, userId);
    if (result) {
      results.push(result);
    }
  }

  return results;
}

/**
 * Get budget alert history
 */
export async function getBudgetAlertHistory(
  thresholdId?: number,
  limit: number = 50
): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(budgetAlerts);

  if (thresholdId) {
    query = query.where(eq(budgetAlerts.thresholdId, thresholdId)) as any;
  }

  const alerts = await query
    .orderBy(desc(budgetAlerts.createdAt))
    .limit(limit);

  return alerts;
}

/**
 * Acknowledge a budget alert
 */
export async function acknowledgeBudgetAlert(
  alertId: number,
  userId: number,
  notes?: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .update(budgetAlerts)
    .set({
      acknowledged: 1,
      acknowledgedBy: userId,
      acknowledgedAt: new Date().toISOString(),
      notes: notes || null,
    })
    .where(eq(budgetAlerts.id, alertId));

  return true;
}
