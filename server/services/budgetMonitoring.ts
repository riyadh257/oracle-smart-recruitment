import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { getDb } from "../db";
import {
  budgetThresholds,
  budgetAlerts,
  smsLogs,
  type InsertBudgetAlert,
} from "../../drizzle/schema";
import { notifyOwner } from "../_core/notification";
import { sendNotification } from "../notificationService";

/**
 * Budget Monitoring Service
 * Monitors SMS spending against configured thresholds and triggers alerts
 */

interface BudgetCheckResult {
  thresholdId: number;
  thresholdName: string;
  currentSpending: number;
  thresholdAmount: number;
  percentageUsed: number;
  shouldAlert: boolean;
  alertLevel?: "warning" | "critical" | "exceeded";
  periodStart: Date;
  periodEnd: Date;
  smsCount: number;
}

/**
 * Calculate the date range for a given threshold type
 */
function getThresholdPeriod(thresholdType: string): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date();
  const end = new Date();

  switch (thresholdType) {
    case "daily":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "weekly":
      const dayOfWeek = now.getDay();
      start.setDate(now.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    case "monthly":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(start.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      break;
    case "total":
      // All time
      start.setFullYear(2020, 0, 1);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      // Default to monthly
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(start.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
  }

  return { start, end };
}

/**
 * Calculate SMS spending for a given period
 */
async function calculateSmsSpending(
  periodStart: Date,
  periodEnd: Date
): Promise<{ totalCost: number; smsCount: number }> {
  const db = await getDb();
  if (!db) {
    return { totalCost: 0, smsCount: 0 };
  }

  const result = await db
    .select({
      totalCost: sql<number>`COALESCE(SUM(${smsLogs.cost}), 0)`,
      smsCount: sql<number>`COUNT(*)`,
    })
    .from(smsLogs)
    .where(
      and(
        gte(smsLogs.sentAt, periodStart.toISOString()),
        lte(smsLogs.sentAt, periodEnd.toISOString()),
        eq(smsLogs.status, "sent")
      )
    );

  return {
    totalCost: Number(result[0]?.totalCost || 0),
    smsCount: Number(result[0]?.smsCount || 0),
  };
}

/**
 * Check all active budget thresholds and return status
 */
export async function checkBudgetThresholds(): Promise<BudgetCheckResult[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  // Get all active thresholds
  const activeThresholds = await db
    .select()
    .from(budgetThresholds)
    .where(eq(budgetThresholds.isActive, 1));

  const results: BudgetCheckResult[] = [];

  for (const threshold of activeThresholds) {
    const { start, end } = getThresholdPeriod(threshold.thresholdType);
    const { totalCost, smsCount } = await calculateSmsSpending(start, end);

    const percentageUsed = Math.round(
      (totalCost / threshold.thresholdAmount) * 100
    );

    let shouldAlert = false;
    let alertLevel: "warning" | "critical" | "exceeded" | undefined;

    if (percentageUsed >= 100) {
      shouldAlert = true;
      alertLevel = "exceeded";
    } else if (percentageUsed >= (threshold.criticalPercentage || 95)) {
      shouldAlert = true;
      alertLevel = "critical";
    } else if (percentageUsed >= (threshold.warningPercentage || 80)) {
      shouldAlert = true;
      alertLevel = "warning";
    }

    results.push({
      thresholdId: threshold.id,
      thresholdName: threshold.name,
      currentSpending: totalCost,
      thresholdAmount: threshold.thresholdAmount,
      percentageUsed,
      shouldAlert,
      alertLevel,
      periodStart: start,
      periodEnd: end,
      smsCount,
    });
  }

  return results;
}

/**
 * Create a budget alert and send notifications
 */
async function createBudgetAlert(
  result: BudgetCheckResult,
  threshold: typeof budgetThresholds.$inferSelect
): Promise<void> {
  const db = await getDb();
  if (!db || !result.alertLevel) {
    return;
  }

  // Check if we already have a recent alert for this threshold at this level
  const recentAlerts = await db
    .select()
    .from(budgetAlerts)
    .where(
      and(
        eq(budgetAlerts.thresholdId, result.thresholdId),
        eq(budgetAlerts.alertLevel, result.alertLevel),
        gte(
          budgetAlerts.createdAt,
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        ) // Last 24 hours
      )
    )
    .limit(1);

  // Don't create duplicate alerts within 24 hours
  if (recentAlerts.length > 0) {
    return;
  }

  const message = `Budget alert: ${threshold.name} has reached ${result.percentageUsed}% of the threshold (${result.currentSpending} / ${result.thresholdAmount} ${threshold.currency}). ${result.smsCount} SMS sent in this period.`;

  const alertData: InsertBudgetAlert = {
    thresholdId: result.thresholdId,
    alertLevel: result.alertLevel,
    currentSpending: result.currentSpending,
    thresholdAmount: result.thresholdAmount,
    percentageUsed: result.percentageUsed,
    periodStart: result.periodStart.toISOString(),
    periodEnd: result.periodEnd.toISOString(),
    smsCount: result.smsCount,
    message,
    notificationsSent: [],
  };

  const [alert] = await db.insert(budgetAlerts).values(alertData);

  // Send notifications based on configured channels
  const alertChannels = (threshold.alertChannels as string[]) || [];
  const notificationsSent: any[] = [];

  // Send email notification
  if (alertChannels.includes("email")) {
    try {
      await notifyOwner({
        title: `Budget Alert: ${threshold.name}`,
        content: message,
      });
      notificationsSent.push({
        channel: "email",
        status: "sent",
        sentAt: new Date().toISOString(),
      });
    } catch (error) {
      notificationsSent.push({
        channel: "email",
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        sentAt: new Date().toISOString(),
      });
    }
  }

  // Send push notification
  if (alertChannels.includes("push")) {
    try {
      const recipients = (threshold.alertRecipients as number[]) || [];
      for (const userId of recipients) {
        await sendNotification({
          userId,
          type: "budget_alert",
          title: `Budget Alert: ${threshold.name}`,
          message,
          priority: result.alertLevel === "exceeded" ? "high" : "low",
          metadata: {
            thresholdId: result.thresholdId,
            alertLevel: result.alertLevel,
            percentageUsed: result.percentageUsed,
          },
        });
      }
      notificationsSent.push({
        channel: "push",
        status: "sent",
        recipientCount: recipients.length,
        sentAt: new Date().toISOString(),
      });
    } catch (error) {
      notificationsSent.push({
        channel: "push",
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        sentAt: new Date().toISOString(),
      });
    }
  }

  // Update alert with notification delivery status
  if (notificationsSent.length > 0) {
    await db
      .update(budgetAlerts)
      .set({ notificationsSent: JSON.stringify(notificationsSent) })
      .where(eq(budgetAlerts.id, alert.insertId));
  }
}

/**
 * Monitor budgets and trigger alerts if needed
 * This should be called periodically (e.g., every hour)
 */
export async function monitorBudgets(): Promise<void> {
  const db = await getDb();
  if (!db) {
    return;
  }

  const results = await checkBudgetThresholds();

  for (const result of results) {
    if (result.shouldAlert) {
      const [threshold] = await db
        .select()
        .from(budgetThresholds)
        .where(eq(budgetThresholds.id, result.thresholdId))
        .limit(1);

      if (threshold) {
        await createBudgetAlert(result, threshold);
      }
    }
  }
}

/**
 * Get budget spending forecast based on historical data
 */
export async function getBudgetForecast(
  thresholdId: number
): Promise<{
  currentSpending: number;
  projectedSpending: number;
  daysRemaining: number;
  dailyAverage: number;
  willExceed: boolean;
}> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const [threshold] = await db
    .select()
    .from(budgetThresholds)
    .where(eq(budgetThresholds.id, thresholdId))
    .limit(1);

  if (!threshold) {
    throw new Error("Threshold not found");
  }

  const { start, end } = getThresholdPeriod(threshold.thresholdType);
  const { totalCost } = await calculateSmsSpending(start, new Date());

  const daysElapsed = Math.max(
    1,
    Math.ceil((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24))
  );
  const daysRemaining = Math.max(
    0,
    Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );
  const dailyAverage = totalCost / daysElapsed;
  const projectedSpending = totalCost + dailyAverage * daysRemaining;

  return {
    currentSpending: totalCost,
    projectedSpending: Math.round(projectedSpending),
    daysRemaining,
    dailyAverage: Math.round(dailyAverage),
    willExceed: projectedSpending > threshold.thresholdAmount,
  };
}
