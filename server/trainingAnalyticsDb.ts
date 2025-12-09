import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { getDb } from "./db";
import {
  trainingPrograms,
  programEnrollments,
  applications,
  candidates,
} from "../drizzle/schema";

/**
 * Training Completion Analytics Database Helpers
 * Provides business intelligence metrics for training program effectiveness
 */

export interface TrainingEffectivenessMetrics {
  programId: number;
  programTitle: string;
  category: string;
  totalEnrollments: number;
  completionCount: number;
  completionRate: number;
  avgMatchScoreImprovement: number;
  applicationCount: number;
  applicationRate: number;
  avgTimeToComplete: number; // in days
}

export interface TrainingCompletionTrend {
  month: string;
  completions: number;
  enrollments: number;
  completionRate: number;
}

/**
 * Get training effectiveness metrics for all programs
 */
export async function getTrainingEffectivenessMetrics(
  startDate?: Date,
  endDate?: Date
): Promise<TrainingEffectivenessMetrics[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const dateFilter = startDate && endDate
      ? and(
          gte(programEnrollments.completedAt, startDate.toISOString()),
          lte(programEnrollments.completedAt, endDate.toISOString())
        )
      : undefined;

    const results = await db
      .select({
        programId: trainingPrograms.id,
        programTitle: trainingPrograms.title,
        category: trainingPrograms.category,
        totalEnrollments: sql<number>`COUNT(DISTINCT ${programEnrollments.id})`,
        completionCount: sql<number>`SUM(CASE WHEN ${programEnrollments.status} = 'completed' THEN 1 ELSE 0 END)`,
        avgTimeToComplete: sql<number>`AVG(CASE 
          WHEN ${programEnrollments.completedAt} IS NOT NULL 
          THEN DATEDIFF(${programEnrollments.completedAt}, ${programEnrollments.enrolledAt})
          ELSE NULL 
        END)`,
      })
      .from(trainingPrograms)
      .leftJoin(programEnrollments, eq(trainingPrograms.id, programEnrollments.programId))
      .where(dateFilter)
      .groupBy(trainingPrograms.id, trainingPrograms.title, trainingPrograms.category);

    // Calculate derived metrics
    const metrics: TrainingEffectivenessMetrics[] = [];

    for (const result of results) {
      const completionRate = result.totalEnrollments > 0
        ? (result.completionCount / result.totalEnrollments) * 100
        : 0;

      // Get match score improvements for this program
      const matchScoreImprovement = await getMatchScoreImprovementForProgram(
        result.programId,
        startDate,
        endDate
      );

      // Get application counts for completers
      const applicationMetrics = await getApplicationMetricsForProgram(
        result.programId,
        startDate,
        endDate
      );

      metrics.push({
        programId: result.programId,
        programTitle: result.programTitle,
        category: result.category || "uncategorized",
        totalEnrollments: result.totalEnrollments,
        completionCount: result.completionCount,
        completionRate: Math.round(completionRate * 100) / 100,
        avgMatchScoreImprovement: matchScoreImprovement,
        applicationCount: applicationMetrics.applicationCount,
        applicationRate: applicationMetrics.applicationRate,
        avgTimeToComplete: Math.round(result.avgTimeToComplete || 0),
      });
    }

    return metrics.sort((a, b) => b.completionCount - a.completionCount);
  } catch (error) {
    console.error("[Training Analytics] Error getting effectiveness metrics:", error);
    return [];
  }
}

/**
 * Get match score improvement for program completers
 */
async function getMatchScoreImprovementForProgram(
  programId: number,
  startDate?: Date,
  endDate?: Date
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    // Get users who completed this program
    const completedEnrollments = await db
      .select({
        userId: programEnrollments.userId,
        completedAt: programEnrollments.completedAt,
      })
      .from(programEnrollments)
      .where(
        and(
          eq(programEnrollments.programId, programId),
          eq(programEnrollments.status, "completed"),
          startDate && endDate
            ? and(
                gte(programEnrollments.completedAt, startDate.toISOString()),
                lte(programEnrollments.completedAt, endDate.toISOString())
              )
            : undefined
        )
      );

    if (completedEnrollments.length === 0) return 0;

    let totalImprovement = 0;
    let count = 0;

    // For each completer, calculate match score improvement
    for (const enrollment of completedEnrollments) {
      if (!enrollment.completedAt) continue;

      const completionDate = new Date(enrollment.completedAt);

      // Get average match score before completion
      const beforeMatches = await db
        .select({
          avgScore: sql<number>`AVG(${applications.overallMatchScore})`,
        })
        .from(applications)
        .where(
          and(
            eq(applications.candidateId, enrollment.userId),
            lte(applications.createdAt, completionDate.toISOString())
          )
        );

      // Get average match score after completion
      const afterMatches = await db
        .select({
          avgScore: sql<number>`AVG(${applications.overallMatchScore})`,
        })
        .from(applications)
        .where(
          and(
            eq(applications.candidateId, enrollment.userId),
            gte(applications.createdAt, completionDate.toISOString())
          )
        );

      const beforeScore = beforeMatches[0]?.avgScore || 0;
      const afterScore = afterMatches[0]?.avgScore || 0;

      if (beforeScore > 0 && afterScore > 0) {
        totalImprovement += afterScore - beforeScore;
        count++;
      }
    }

    return count > 0 ? Math.round((totalImprovement / count) * 100) / 100 : 0;
  } catch (error) {
    console.error("[Training Analytics] Error calculating match score improvement:", error);
    return 0;
  }
}

/**
 * Get application metrics for program completers
 */
async function getApplicationMetricsForProgram(
  programId: number,
  startDate?: Date,
  endDate?: Date
): Promise<{ applicationCount: number; applicationRate: number }> {
  const db = await getDb();
  if (!db) return { applicationCount: 0, applicationRate: 0 };

  try {
    // Get users who completed this program
    const completedEnrollments = await db
      .select({
        userId: programEnrollments.userId,
        completedAt: programEnrollments.completedAt,
      })
      .from(programEnrollments)
      .where(
        and(
          eq(programEnrollments.programId, programId),
          eq(programEnrollments.status, "completed"),
          startDate && endDate
            ? and(
                gte(programEnrollments.completedAt, startDate.toISOString()),
                lte(programEnrollments.completedAt, endDate.toISOString())
              )
            : undefined
        )
      );

    if (completedEnrollments.length === 0) {
      return { applicationCount: 0, applicationRate: 0 };
    }

    // Count applications submitted after program completion
    let totalApplications = 0;
    let usersWithApplications = 0;

    for (const enrollment of completedEnrollments) {
      if (!enrollment.completedAt) continue;

      const completionDate = new Date(enrollment.completedAt);

      const userApplications = await db
        .select({
          count: sql<number>`COUNT(*)`,
        })
        .from(applications)
        .where(
          and(
            eq(applications.candidateId, enrollment.userId),
            gte(applications.createdAt, completionDate.toISOString())
          )
        );

      const appCount = userApplications[0]?.count || 0;
      totalApplications += appCount;
      if (appCount > 0) usersWithApplications++;
    }

    const applicationRate =
      (usersWithApplications / completedEnrollments.length) * 100;

    return {
      applicationCount: totalApplications,
      applicationRate: Math.round(applicationRate * 100) / 100,
    };
  } catch (error) {
    console.error("[Training Analytics] Error calculating application metrics:", error);
    return { applicationCount: 0, applicationRate: 0 };
  }
}

/**
 * Get training completion trends over time
 */
export async function getTrainingCompletionTrends(
  months: number = 12
): Promise<TrainingCompletionTrend[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const results = await db
      .select({
        month: sql<string>`DATE_FORMAT(${programEnrollments.completedAt}, '%Y-%m')`,
        completions: sql<number>`COUNT(CASE WHEN ${programEnrollments.status} = 'completed' THEN 1 END)`,
        enrollments: sql<number>`COUNT(*)`,
      })
      .from(programEnrollments)
      .where(
        gte(
          programEnrollments.enrolledAt,
          sql`DATE_SUB(NOW(), INTERVAL ${months} MONTH)`
        )
      )
      .groupBy(sql`DATE_FORMAT(${programEnrollments.completedAt}, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(${programEnrollments.completedAt}, '%Y-%m') DESC`);

    return results.map((row) => ({
      month: row.month || "Unknown",
      completions: row.completions,
      enrollments: row.enrollments,
      completionRate:
        row.enrollments > 0
          ? Math.round((row.completions / row.enrollments) * 10000) / 100
          : 0,
    }));
  } catch (error) {
    console.error("[Training Analytics] Error getting completion trends:", error);
    return [];
  }
}

/**
 * Get top performing training programs by ROI
 */
export async function getTopPerformingPrograms(
  limit: number = 10
): Promise<TrainingEffectivenessMetrics[]> {
  const metrics = await getTrainingEffectivenessMetrics();

  // Sort by a composite ROI score
  return metrics
    .map((m) => ({
      ...m,
      roiScore:
        m.completionRate * 0.3 +
        m.avgMatchScoreImprovement * 0.4 +
        m.applicationRate * 0.3,
    }))
    .sort((a, b) => b.roiScore - a.roiScore)
    .slice(0, limit);
}
