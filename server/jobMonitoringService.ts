import { getDb } from "./db";
import { jobExecutions } from "../drizzle/schema";
import { and, between, desc, eq, gte, lte, sql } from "drizzle-orm";

/**
 * Job Monitoring Service
 * Provides real-time metrics and health indicators for scheduled jobs
 */

export interface JobMetrics {
  totalExecutions: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  averageDuration: number; // milliseconds
  lastExecution: Date | null;
  lastStatus: string | null;
}

export interface SystemHealthIndicators {
  overallHealth: "healthy" | "degraded" | "critical";
  activeJobs: number;
  failedJobsLast24h: number;
  averageSuccessRate: number;
  slowestJob: {
    name: string;
    duration: number;
  } | null;
  recentFailures: Array<{
    jobName: string;
    errorMessage: string;
    timestamp: Date;
  }>;
}

export interface JobExecutionTimeline {
  timestamp: Date;
  jobName: string;
  status: string;
  duration: number;
  successCount: number;
  failureCount: number;
}

/**
 * Get metrics for a specific job
 */
export async function getJobMetrics(
  jobName: string,
  periodStart?: Date,
  periodEnd?: Date
): Promise<JobMetrics> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const whereConditions = [eq(jobExecutions.jobName, jobName)];

  if (periodStart && periodEnd) {
    whereConditions.push(
      gte(jobExecutions.createdAt, periodStart.toISOString()),
      lte(jobExecutions.createdAt, periodEnd.toISOString())
    );
  }

  const metrics = await db
    .select({
      totalExecutions: sql<number>`COUNT(*)`,
      successCount: sql<number>`SUM(CASE WHEN ${jobExecutions.status} = 'completed' THEN 1 ELSE 0 END)`,
      failureCount: sql<number>`SUM(CASE WHEN ${jobExecutions.status} = 'failed' THEN 1 ELSE 0 END)`,
      averageDuration: sql<number>`AVG(${jobExecutions.duration})`,
    })
    .from(jobExecutions)
    .where(and(...whereConditions));

  const lastExecution = await db
    .select()
    .from(jobExecutions)
    .where(eq(jobExecutions.jobName, jobName))
    .orderBy(desc(jobExecutions.createdAt))
    .limit(1);

  const total = metrics[0]?.totalExecutions || 0;
  const success = metrics[0]?.successCount || 0;
  const successRate = total > 0 ? (success / total) * 100 : 0;

  return {
    totalExecutions: total,
    successCount: success,
    failureCount: metrics[0]?.failureCount || 0,
    successRate,
    averageDuration: metrics[0]?.averageDuration || 0,
    lastExecution: lastExecution[0]?.createdAt
      ? new Date(lastExecution[0].createdAt)
      : null,
    lastStatus: lastExecution[0]?.status || null,
  };
}

/**
 * Get system health indicators
 */
export async function getSystemHealthIndicators(): Promise<SystemHealthIndicators> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get active jobs (running or pending)
  const activeJobs = await db
    .select({
      count: sql<number>`COUNT(*)`,
    })
    .from(jobExecutions)
    .where(
      sql`${jobExecutions.status} IN ('running', 'pending')`
    );

  // Get failed jobs in last 24 hours
  const last24h = new Date();
  last24h.setHours(last24h.getHours() - 24);

  const failedJobs = await db
    .select({
      count: sql<number>`COUNT(*)`,
    })
    .from(jobExecutions)
    .where(
      and(
        eq(jobExecutions.status, "failed"),
        gte(jobExecutions.createdAt, last24h.toISOString())
      )
    );

  // Get overall success rate (last 7 days)
  const last7days = new Date();
  last7days.setDate(last7days.getDate() - 7);

  const overallStats = await db
    .select({
      total: sql<number>`COUNT(*)`,
      success: sql<number>`SUM(CASE WHEN ${jobExecutions.status} = 'completed' THEN 1 ELSE 0 END)`,
    })
    .from(jobExecutions)
    .where(gte(jobExecutions.createdAt, last7days.toISOString()));

  const totalJobs = overallStats[0]?.total || 0;
  const successfulJobs = overallStats[0]?.success || 0;
  const averageSuccessRate =
    totalJobs > 0 ? (successfulJobs / totalJobs) * 100 : 100;

  // Get slowest job (last 24 hours)
  const slowestJob = await db
    .select()
    .from(jobExecutions)
    .where(
      and(
        gte(jobExecutions.createdAt, last24h.toISOString()),
        eq(jobExecutions.status, "completed")
      )
    )
    .orderBy(desc(jobExecutions.duration))
    .limit(1);

  // Get recent failures
  const recentFailures = await db
    .select({
      jobName: jobExecutions.jobName,
      errorMessage: jobExecutions.errorMessage,
      createdAt: jobExecutions.createdAt,
    })
    .from(jobExecutions)
    .where(
      and(
        eq(jobExecutions.status, "failed"),
        gte(jobExecutions.createdAt, last24h.toISOString())
      )
    )
    .orderBy(desc(jobExecutions.createdAt))
    .limit(5);

  // Determine overall health
  let overallHealth: "healthy" | "degraded" | "critical" = "healthy";
  const failedCount = failedJobs[0]?.count || 0;

  if (averageSuccessRate < 50 || failedCount > 10) {
    overallHealth = "critical";
  } else if (averageSuccessRate < 80 || failedCount > 5) {
    overallHealth = "degraded";
  }

  return {
    overallHealth,
    activeJobs: activeJobs[0]?.count || 0,
    failedJobsLast24h: failedCount,
    averageSuccessRate,
    slowestJob: slowestJob[0]
      ? {
          name: slowestJob[0].jobName || "Unknown",
          duration: slowestJob[0].duration || 0,
        }
      : null,
    recentFailures: recentFailures.map((f) => ({
      jobName: f.jobName || "Unknown",
      errorMessage: f.errorMessage || "No error message",
      timestamp: new Date(f.createdAt || new Date()),
    })),
  };
}

/**
 * Get job execution timeline
 */
export async function getJobExecutionTimeline(
  periodStart: Date,
  periodEnd: Date,
  jobName?: string
): Promise<JobExecutionTimeline[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const whereConditions = [
    gte(jobExecutions.createdAt, periodStart.toISOString()),
    lte(jobExecutions.createdAt, periodEnd.toISOString()),
  ];

  if (jobName) {
    whereConditions.push(eq(jobExecutions.jobName, jobName));
  }

  const timeline = await db
    .select({
      timestamp: jobExecutions.createdAt,
      jobName: jobExecutions.jobName,
      status: jobExecutions.status,
      duration: jobExecutions.duration,
      successCount: jobExecutions.successCount,
      failureCount: jobExecutions.failureCount,
    })
    .from(jobExecutions)
    .where(and(...whereConditions))
    .orderBy(desc(jobExecutions.createdAt))
    .limit(100);

  return timeline.map((t) => ({
    timestamp: new Date(t.timestamp || new Date()),
    jobName: t.jobName || "Unknown",
    status: t.status || "unknown",
    duration: t.duration || 0,
    successCount: t.successCount || 0,
    failureCount: t.failureCount || 0,
  }));
}

/**
 * Get job execution statistics by hour (for charts)
 */
export async function getJobExecutionStatsByHour(
  periodStart: Date,
  periodEnd: Date
): Promise<
  Array<{
    hour: string;
    total: number;
    success: number;
    failed: number;
    avgDuration: number;
  }>
> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const stats = await db
    .select({
      hour: sql<string>`DATE_FORMAT(${jobExecutions.createdAt}, '%Y-%m-%d %H:00:00')`,
      total: sql<number>`COUNT(*)`,
      success: sql<number>`SUM(CASE WHEN ${jobExecutions.status} = 'completed' THEN 1 ELSE 0 END)`,
      failed: sql<number>`SUM(CASE WHEN ${jobExecutions.status} = 'failed' THEN 1 ELSE 0 END)`,
      avgDuration: sql<number>`AVG(${jobExecutions.duration})`,
    })
    .from(jobExecutions)
    .where(
      and(
        gte(jobExecutions.createdAt, periodStart.toISOString()),
        lte(jobExecutions.createdAt, periodEnd.toISOString())
      )
    )
    .groupBy(sql`DATE_FORMAT(${jobExecutions.createdAt}, '%Y-%m-%d %H:00:00')`)
    .orderBy(sql`DATE_FORMAT(${jobExecutions.createdAt}, '%Y-%m-%d %H:00:00')`);

  return stats.map((s) => ({
    hour: s.hour,
    total: s.total,
    success: s.success,
    failed: s.failed,
    avgDuration: s.avgDuration || 0,
  }));
}

/**
 * Get all unique job names
 */
export async function getAllJobNames(): Promise<string[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const jobs = await db
    .selectDistinct({
      jobName: jobExecutions.jobName,
    })
    .from(jobExecutions)
    .orderBy(jobExecutions.jobName);

  return jobs.map((j) => j.jobName || "Unknown").filter((name) => name !== "Unknown");
}
