import { getDb } from "./db";
import { smsLogs, budgetThresholds, budgetAlerts } from "../drizzle/schema";
import { and, between, desc, eq, gte, lte, sql } from "drizzle-orm";

/**
 * Budget Forecasting Service
 * Provides predictive analytics for SMS spending based on historical trends
 */

export interface BudgetForecast {
  periodStart: Date;
  periodEnd: Date;
  predictedSpend: number; // SAR
  confidenceLevel: number; // 0-100%
  baselineSpend: number; // Historical average
  trendFactor: number; // Growth/decline rate
  seasonalityFactor: number; // Seasonal adjustment
  scheduledCampaignsSpend: number;
  methodology: {
    algorithm: string;
    dataPoints: number;
    historicalPeriod: string;
  };
}

export interface BudgetAnalytics {
  currentPeriodSpend: number;
  previousPeriodSpend: number;
  percentageChange: number;
  averageDailyCost: number;
  averageSmsCount: number;
  averageCostPerSms: number;
  projectedMonthlySpend: number;
  daysRemaining: number;
}

/**
 * Calculate budget forecast using linear regression with seasonality
 */
export async function generateBudgetForecast(
  periodStart: Date,
  periodEnd: Date
): Promise<BudgetForecast> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get historical data (last 90 days)
  const historicalStart = new Date(periodStart);
  historicalStart.setDate(historicalStart.getDate() - 90);

  const historicalData = await db
    .select({
      date: sql<string>`DATE(${smsLogs.createdAt})`,
      totalCost: sql<number>`SUM(${smsLogs.cost})`,
      smsCount: sql<number>`COUNT(*)`,
    })
    .from(smsLogs)
    .where(
      and(
        gte(smsLogs.createdAt, historicalStart.toISOString()),
        eq(smsLogs.status, "delivered")
      )
    )
    .groupBy(sql`DATE(${smsLogs.createdAt})`)
    .orderBy(sql`DATE(${smsLogs.createdAt})`);

  if (historicalData.length === 0) {
    // No historical data - return baseline estimate
    return {
      periodStart,
      periodEnd,
      predictedSpend: 0,
      confidenceLevel: 0,
      baselineSpend: 0,
      trendFactor: 0,
      seasonalityFactor: 1.0,
      scheduledCampaignsSpend: 0,
      methodology: {
        algorithm: "baseline",
        dataPoints: 0,
        historicalPeriod: "0 days",
      },
    };
  }

  // Calculate baseline (average daily spend)
  const totalHistoricalCost = historicalData.reduce(
    (sum, day) => sum + (day.totalCost || 0),
    0
  );
  const averageDailyCost = totalHistoricalCost / historicalData.length;

  // Calculate trend using linear regression
  const n = historicalData.length;
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;

  historicalData.forEach((day, index) => {
    const x = index;
    const y = day.totalCost || 0;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const trendFactor = slope / averageDailyCost; // Normalized trend

  // Calculate seasonality (day of week pattern)
  const dayOfWeekCosts: number[][] = [[], [], [], [], [], [], []];
  historicalData.forEach((day) => {
    const date = new Date(day.date);
    const dayOfWeek = date.getDay();
    dayOfWeekCosts[dayOfWeek].push(day.totalCost || 0);
  });

  const dayOfWeekAverages = dayOfWeekCosts.map((costs) =>
    costs.length > 0 ? costs.reduce((a, b) => a + b, 0) / costs.length : 0
  );
  const overallAverage =
    dayOfWeekAverages.reduce((a, b) => a + b, 0) / dayOfWeekAverages.length;

  // Calculate forecast period
  const forecastDays = Math.ceil(
    (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Project spending with trend and seasonality
  let predictedSpend = 0;
  for (let i = 0; i < forecastDays; i++) {
    const forecastDate = new Date(periodStart);
    forecastDate.setDate(forecastDate.getDate() + i);
    const dayOfWeek = forecastDate.getDay();

    const seasonalityFactor =
      overallAverage > 0 ? dayOfWeekAverages[dayOfWeek] / overallAverage : 1.0;
    const trendAdjustedCost = averageDailyCost * (1 + trendFactor * i);
    const dailyForecast = trendAdjustedCost * seasonalityFactor;

    predictedSpend += dailyForecast;
  }

  // Calculate confidence level based on data consistency
  const variance =
    historicalData.reduce(
      (sum, day) => sum + Math.pow((day.totalCost || 0) - averageDailyCost, 2),
      0
    ) / n;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / averageDailyCost;
  const confidenceLevel = Math.max(
    0,
    Math.min(100, 100 - coefficientOfVariation * 50)
  );

  // Get scheduled campaigns spending (if available)
  // This would come from campaignSchedule table in production
  const scheduledCampaignsSpend = 0;

  return {
    periodStart,
    periodEnd,
    predictedSpend: predictedSpend / 100, // Convert from cents to SAR
    confidenceLevel,
    baselineSpend: (averageDailyCost * forecastDays) / 100,
    trendFactor,
    seasonalityFactor: dayOfWeekAverages.reduce((a, b) => a + b, 0) / 7,
    scheduledCampaignsSpend,
    methodology: {
      algorithm: "linear_regression_with_seasonality",
      dataPoints: historicalData.length,
      historicalPeriod: `${historicalData.length} days`,
    },
  };
}

/**
 * Get current budget analytics for a period
 */
export async function getBudgetAnalytics(
  periodStart: Date,
  periodEnd: Date
): Promise<BudgetAnalytics> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Current period stats
  const currentStats = await db
    .select({
      totalCost: sql<number>`COALESCE(SUM(${smsLogs.cost}), 0)`,
      smsCount: sql<number>`COUNT(*)`,
    })
    .from(smsLogs)
    .where(
      and(
        gte(smsLogs.createdAt, periodStart.toISOString()),
        lte(smsLogs.createdAt, periodEnd.toISOString()),
        eq(smsLogs.status, "delivered")
      )
    );

  // Previous period stats (same duration)
  const periodDuration = periodEnd.getTime() - periodStart.getTime();
  const previousPeriodEnd = new Date(periodStart);
  const previousPeriodStart = new Date(periodStart.getTime() - periodDuration);

  const previousStats = await db
    .select({
      totalCost: sql<number>`COALESCE(SUM(${smsLogs.cost}), 0)`,
      smsCount: sql<number>`COUNT(*)`,
    })
    .from(smsLogs)
    .where(
      and(
        gte(smsLogs.createdAt, previousPeriodStart.toISOString()),
        lte(smsLogs.createdAt, previousPeriodEnd.toISOString()),
        eq(smsLogs.status, "delivered")
      )
    );

  const currentCost = currentStats[0]?.totalCost || 0;
  const previousCost = previousStats[0]?.totalCost || 0;
  const currentCount = currentStats[0]?.smsCount || 0;

  const percentageChange =
    previousCost > 0 ? ((currentCost - previousCost) / previousCost) * 100 : 0;

  const daysInPeriod = Math.ceil(periodDuration / (1000 * 60 * 60 * 24));
  const averageDailyCost = currentCost / daysInPeriod;
  const averageSmsCount = currentCount / daysInPeriod;
  const averageCostPerSms = currentCount > 0 ? currentCost / currentCount : 0;

  // Project to end of month
  const now = new Date();
  const daysRemaining = Math.max(
    0,
    Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );
  const projectedMonthlySpend = currentCost + averageDailyCost * daysRemaining;

  return {
    currentPeriodSpend: currentCost / 100, // Convert from cents to SAR
    previousPeriodSpend: previousCost / 100,
    percentageChange,
    averageDailyCost: averageDailyCost / 100,
    averageSmsCount,
    averageCostPerSms: averageCostPerSms / 100,
    projectedMonthlySpend: projectedMonthlySpend / 100,
    daysRemaining,
  };
}

/**
 * Check budget thresholds and create alerts if needed
 */
export async function checkBudgetThresholds(
  periodStart: Date,
  periodEnd: Date
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get active thresholds
  const thresholds = await db
    .select()
    .from(budgetThresholds)
    .where(eq(budgetThresholds.isActive, 1));

  // Get current spending
  const analytics = await getBudgetAnalytics(periodStart, periodEnd);
  const currentSpending = Math.round(analytics.currentPeriodSpend * 100); // Convert to cents

  // Get SMS count
  const smsCount = await db
    .select({
      count: sql<number>`COUNT(*)`,
    })
    .from(smsLogs)
    .where(
      and(
        gte(smsLogs.createdAt, periodStart.toISOString()),
        lte(smsLogs.createdAt, periodEnd.toISOString()),
        eq(smsLogs.status, "delivered")
      )
    );

  const totalSmsCount = smsCount[0]?.count || 0;

  // Check each threshold
  for (const threshold of thresholds) {
    const thresholdAmount = threshold.thresholdAmount || 0;
    const percentageUsed = (currentSpending / thresholdAmount) * 100;

    let alertLevel: "warning" | "critical" | "exceeded" | null = null;

    if (percentageUsed >= 100) {
      alertLevel = "exceeded";
    } else if (percentageUsed >= (threshold.criticalPercentage || 95)) {
      alertLevel = "critical";
    } else if (percentageUsed >= (threshold.warningPercentage || 80)) {
      alertLevel = "warning";
    }

    if (alertLevel) {
      // Check if alert already exists for this period
      const existingAlert = await db
        .select()
        .from(budgetAlerts)
        .where(
          and(
            eq(budgetAlerts.thresholdId, threshold.id),
            eq(budgetAlerts.alertLevel, alertLevel),
            eq(budgetAlerts.periodStart, periodStart.toISOString()),
            eq(budgetAlerts.periodEnd, periodEnd.toISOString())
          )
        )
        .limit(1);

      if (existingAlert.length === 0) {
        // Create new alert
        await db.insert(budgetAlerts).values({
          thresholdId: threshold.id,
          alertLevel,
          currentSpending,
          thresholdAmount,
          percentageUsed: Math.round(percentageUsed),
          periodStart: periodStart.toISOString(),
          periodEnd: periodEnd.toISOString(),
          smsCount: totalSmsCount,
          message: `Budget ${alertLevel}: ${percentageUsed.toFixed(1)}% of ${threshold.name} threshold reached (${(currentSpending / 100).toFixed(2)} SAR / ${(thresholdAmount / 100).toFixed(2)} SAR)`,
          acknowledged: 0,
        });
      }
    }
  }
}

/**
 * Get recent budget alerts
 */
export async function getRecentBudgetAlerts(limit: number = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const alerts = await db
    .select({
      alert: budgetAlerts,
      threshold: budgetThresholds,
    })
    .from(budgetAlerts)
    .leftJoin(
      budgetThresholds,
      eq(budgetAlerts.thresholdId, budgetThresholds.id)
    )
    .orderBy(desc(budgetAlerts.createdAt))
    .limit(limit);

  return alerts;
}
