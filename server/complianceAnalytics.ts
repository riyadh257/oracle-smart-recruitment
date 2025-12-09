import { getDb } from "./db";
import { eq, and, gte, sql } from "drizzle-orm";
import { complianceAlerts, nitaqatTracking, workPermits } from "../drizzle/schema";

/**
 * Compliance Analytics Service
 * Provides historical trends, violation patterns, and Nitaqat progression
 */

export interface ComplianceTimeSeries {
  date: string;
  critical: number;
  warning: number;
  info: number;
  total: number;
}

export interface ViolationPattern {
  alertType: string;
  count: number;
  percentage: number;
  trend: "increasing" | "decreasing" | "stable";
}

export interface NitaqatProgression {
  date: string;
  band: "platinum" | "green" | "yellow" | "red";
  saudizationPercentage: number;
  totalEmployees: number;
  saudiEmployees: number;
}

/**
 * Get compliance alerts time series for the last N days
 */
export async function getComplianceTimeSeries(
  employerId: number,
  days: number = 30
): Promise<ComplianceTimeSeries[]> {
  const db = await getDb();
  if (!db) return [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    const alerts = await db
      .select({
        date: sql<string>`DATE(${complianceAlerts.createdAt})`,
        severity: complianceAlerts.severity,
        count: sql<number>`COUNT(*)`,
      })
      .from(complianceAlerts)
      .where(
        and(
          eq(complianceAlerts.employerId, employerId),
          gte(complianceAlerts.createdAt, startDate)
        )
      )
      .groupBy(sql`DATE(${complianceAlerts.createdAt})`, complianceAlerts.severity)
      .orderBy(sql`DATE(${complianceAlerts.createdAt})`);

    // Group by date
    const timeSeriesMap = new Map<string, ComplianceTimeSeries>();

    for (const alert of alerts) {
      if (!timeSeriesMap.has(alert.date)) {
        timeSeriesMap.set(alert.date, {
          date: alert.date,
          critical: 0,
          warning: 0,
          info: 0,
          total: 0,
        });
      }

      const entry = timeSeriesMap.get(alert.date)!;
      if (alert.severity === "critical") entry.critical += alert.count;
      else if (alert.severity === "warning") entry.warning += alert.count;
      else if (alert.severity === "info") entry.info += alert.count;
      entry.total += alert.count;
    }

    // Fill in missing dates with zeros
    const result: ComplianceTimeSeries[] = [];
    const currentDate = new Date(startDate);
    const endDate = new Date();

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      result.push(
        timeSeriesMap.get(dateStr) || {
          date: dateStr,
          critical: 0,
          warning: 0,
          info: 0,
          total: 0,
        }
      );
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  } catch (error) {
    console.error("Failed to get compliance time series:", error);
    return [];
  }
}

/**
 * Get violation patterns and trends
 */
export async function getViolationPatterns(
  employerId: number,
  days: number = 30
): Promise<ViolationPattern[]> {
  const db = await getDb();
  if (!db) return [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const midpoint = new Date();
  midpoint.setDate(midpoint.getDate() - Math.floor(days / 2));

  try {
    // Get alert counts by type for the full period
    const fullPeriodAlerts = await db
      .select({
        alertType: complianceAlerts.alertType,
        count: sql<number>`COUNT(*)`,
      })
      .from(complianceAlerts)
      .where(
        and(
          eq(complianceAlerts.employerId, employerId),
          gte(complianceAlerts.createdAt, startDate)
        )
      )
      .groupBy(complianceAlerts.alertType);

    // Get alert counts by type for the first half
    const firstHalfAlerts = await db
      .select({
        alertType: complianceAlerts.alertType,
        count: sql<number>`COUNT(*)`,
      })
      .from(complianceAlerts)
      .where(
        and(
          eq(complianceAlerts.employerId, employerId),
          gte(complianceAlerts.createdAt, startDate),
          sql`${complianceAlerts.createdAt} < ${midpoint}`
        )
      )
      .groupBy(complianceAlerts.alertType);

    // Get alert counts by type for the second half
    const secondHalfAlerts = await db
      .select({
        alertType: complianceAlerts.alertType,
        count: sql<number>`COUNT(*)`,
      })
      .from(complianceAlerts)
      .where(
        and(
          eq(complianceAlerts.employerId, employerId),
          gte(complianceAlerts.createdAt, midpoint)
        )
      )
      .groupBy(complianceAlerts.alertType);

    const totalAlerts = fullPeriodAlerts.reduce((sum, a) => sum + a.count, 0);

    const firstHalfMap = new Map(firstHalfAlerts.map((a) => [a.alertType, a.count]));
    const secondHalfMap = new Map(secondHalfAlerts.map((a) => [a.alertType, a.count]));

    return fullPeriodAlerts.map((alert) => {
      const firstHalfCount = firstHalfMap.get(alert.alertType) || 0;
      const secondHalfCount = secondHalfMap.get(alert.alertType) || 0;

      let trend: "increasing" | "decreasing" | "stable" = "stable";
      if (secondHalfCount > firstHalfCount * 1.2) trend = "increasing";
      else if (secondHalfCount < firstHalfCount * 0.8) trend = "decreasing";

      return {
        alertType: alert.alertType,
        count: alert.count,
        percentage: totalAlerts > 0 ? (alert.count / totalAlerts) * 100 : 0,
        trend,
      };
    }).sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error("Failed to get violation patterns:", error);
    return [];
  }
}

/**
 * Get Nitaqat band progression over time
 */
export async function getNitaqatProgression(
  employerId: number,
  months: number = 12
): Promise<NitaqatProgression[]> {
  const db = await getDb();
  if (!db) return [];

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  try {
    const tracking = await db
      .select()
      .from(nitaqatTracking)
      .where(
        and(
          eq(nitaqatTracking.employerId, employerId),
          gte(nitaqatTracking.updatedAt, startDate)
        )
      )
      .orderBy(nitaqatTracking.updatedAt);

    return tracking.map((t) => ({
      date: t.updatedAt.toISOString().split("T")[0],
      band: t.currentBand,
      saudizationPercentage: t.saudizationPercentage,
      totalEmployees: t.totalEmployees,
      saudiEmployees: t.saudiEmployees,
    }));
  } catch (error) {
    console.error("Failed to get Nitaqat progression:", error);
    return [];
  }
}

/**
 * Get work permit expiry forecast
 */
export async function getPermitExpiryForecast(
  employerId: number,
  months: number = 12
): Promise<{ month: string; expiring: number }[]> {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + months);

  try {
    const permits = await db
      .select({
        expiryDate: workPermits.expiryDate,
      })
      .from(workPermits)
      .where(
        and(
          eq(workPermits.employerId, employerId),
          eq(workPermits.status, "active"),
          gte(workPermits.expiryDate, now),
          sql`${workPermits.expiryDate} <= ${endDate}`
        )
      );

    // Group by month
    const monthlyCount = new Map<string, number>();

    for (const permit of permits) {
      if (permit.expiryDate) {
        const monthKey = `${permit.expiryDate.getFullYear()}-${String(permit.expiryDate.getMonth() + 1).padStart(2, "0")}`;
        monthlyCount.set(monthKey, (monthlyCount.get(monthKey) || 0) + 1);
      }
    }

    // Fill in all months
    const result: { month: string; expiring: number }[] = [];
    const currentDate = new Date(now);

    for (let i = 0; i < months; i++) {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
      result.push({
        month: monthKey,
        expiring: monthlyCount.get(monthKey) || 0,
      });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return result;
  } catch (error) {
    console.error("Failed to get permit expiry forecast:", error);
    return [];
  }
}

/**
 * Get compliance summary statistics
 */
export async function getComplianceSummary(employerId: number): Promise<{
  totalAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  infoAlerts: number;
  resolvedAlerts: number;
  averageResolutionTime: number; // in hours
  mostCommonViolation: string;
  currentNitaqatBand: string;
}> {
  const db = await getDb();
  if (!db) {
    return {
      totalAlerts: 0,
      criticalAlerts: 0,
      warningAlerts: 0,
      infoAlerts: 0,
      resolvedAlerts: 0,
      averageResolutionTime: 0,
      mostCommonViolation: "None",
      currentNitaqatBand: "Unknown",
    };
  }

  try {
    // Get alert counts
    const alertCounts = await db
      .select({
        severity: complianceAlerts.severity,
        status: complianceAlerts.alertStatus,
        count: sql<number>`COUNT(*)`,
      })
      .from(complianceAlerts)
      .where(eq(complianceAlerts.employerId, employerId))
      .groupBy(complianceAlerts.severity, complianceAlerts.alertStatus);

    let totalAlerts = 0;
    let criticalAlerts = 0;
    let warningAlerts = 0;
    let infoAlerts = 0;
    let resolvedAlerts = 0;

    for (const count of alertCounts) {
      totalAlerts += count.count;
      if (count.severity === "critical") criticalAlerts += count.count;
      else if (count.severity === "warning") warningAlerts += count.count;
      else if (count.severity === "info") infoAlerts += count.count;

      if (count.status === "resolved" || count.status === "acknowledged") {
        resolvedAlerts += count.count;
      }
    }

    // Get most common violation
    const violations = await db
      .select({
        alertType: complianceAlerts.alertType,
        count: sql<number>`COUNT(*)`,
      })
      .from(complianceAlerts)
      .where(eq(complianceAlerts.employerId, employerId))
      .groupBy(complianceAlerts.alertType)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(1);

    const mostCommonViolation = violations.length > 0 ? violations[0].alertType : "None";

    // Get current Nitaqat band
    const currentTracking = await db
      .select()
      .from(nitaqatTracking)
      .where(eq(nitaqatTracking.employerId, employerId))
      .orderBy(sql`${nitaqatTracking.updatedAt} DESC`)
      .limit(1);

    const currentNitaqatBand = currentTracking.length > 0 ? currentTracking[0].currentBand.toUpperCase() : "Unknown";

    // Calculate average resolution time
    const resolvedAlertsData = await db
      .select({
        createdAt: complianceAlerts.createdAt,
        acknowledgedAt: complianceAlerts.acknowledgedAt,
      })
      .from(complianceAlerts)
      .where(
        and(
          eq(complianceAlerts.employerId, employerId),
          sql`${complianceAlerts.acknowledgedAt} IS NOT NULL`
        )
      );

    let totalResolutionTime = 0;
    let resolutionCount = 0;

    for (const alert of resolvedAlertsData) {
      if (alert.acknowledgedAt) {
        const resolutionTime = alert.acknowledgedAt.getTime() - alert.createdAt.getTime();
        totalResolutionTime += resolutionTime;
        resolutionCount++;
      }
    }

    const averageResolutionTime =
      resolutionCount > 0 ? totalResolutionTime / resolutionCount / (1000 * 60 * 60) : 0; // Convert to hours

    return {
      totalAlerts,
      criticalAlerts,
      warningAlerts,
      infoAlerts,
      resolvedAlerts,
      averageResolutionTime: Math.round(averageResolutionTime * 10) / 10,
      mostCommonViolation,
      currentNitaqatBand,
    };
  } catch (error) {
    console.error("Failed to get compliance summary:", error);
    return {
      totalAlerts: 0,
      criticalAlerts: 0,
      warningAlerts: 0,
      infoAlerts: 0,
      resolvedAlerts: 0,
      averageResolutionTime: 0,
      mostCommonViolation: "None",
      currentNitaqatBand: "Unknown",
    };
  }
}
