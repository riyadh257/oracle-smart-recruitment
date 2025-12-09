import { eq, desc, and, gte, lte, sql, count, sum } from "drizzle-orm";
import { getDb } from "./db";
import {
  smsLogs,
  jobExecutions,
  exportHistory,
  type SmsLog,
  type InsertSmsLog,
  type JobExecution,
  type InsertJobExecution,
  type ExportHistory,
  type InsertExportHistory,
} from "../drizzle/schema";

// ============================================================================
// SMS COST TRACKING
// ============================================================================

export async function createSmsLog(data: InsertSmsLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(smsLogs).values(data);
  return result;
}

export async function getSmsLogById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const [result] = await db.select().from(smsLogs).where(eq(smsLogs.id, id)).limit(1);
  return result || null;
}

export async function getSmsLogsByUser(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(smsLogs)
    .where(eq(smsLogs.userId, userId))
    .orderBy(desc(smsLogs.createdAt))
    .limit(limit);
}

export async function getSmsLogsByDateRange(
  userId: number,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(smsLogs)
    .where(
      and(
        eq(smsLogs.userId, userId),
        gte(smsLogs.createdAt, startDate.toISOString()),
        lte(smsLogs.createdAt, endDate.toISOString())
      )
    )
    .orderBy(desc(smsLogs.createdAt));
}

export async function getSmsCostAnalytics(
  userId: number,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) return null;
  
  const [result] = await db.select({
    totalCost: sum(smsLogs.cost),
    totalSent: count(smsLogs.id),
    totalDelivered: sql<number>`SUM(CASE WHEN ${smsLogs.status} = 'delivered' THEN 1 ELSE 0 END)`,
    totalFailed: sql<number>`SUM(CASE WHEN ${smsLogs.status} = 'failed' THEN 1 ELSE 0 END)`,
    totalSegments: sum(smsLogs.segments),
  })
  .from(smsLogs)
  .where(
    and(
      eq(smsLogs.userId, userId),
      gte(smsLogs.createdAt, startDate.toISOString()),
      lte(smsLogs.createdAt, endDate.toISOString())
    )
  );
  
  return result;
}

export async function getSmsCostByPurpose(
  userId: number,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    purpose: smsLogs.purpose,
    totalCost: sum(smsLogs.cost),
    totalSent: count(smsLogs.id),
    totalDelivered: sql<number>`SUM(CASE WHEN ${smsLogs.status} = 'delivered' THEN 1 ELSE 0 END)`,
  })
  .from(smsLogs)
  .where(
    and(
      eq(smsLogs.userId, userId),
      gte(smsLogs.createdAt, startDate.toISOString()),
      lte(smsLogs.createdAt, endDate.toISOString())
    )
  )
  .groupBy(smsLogs.purpose);
}

export async function updateSmsLogStatus(
  id: number,
  status: SmsLog['status'],
  deliveredAt?: Date,
  failedAt?: Date,
  failureReason?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(smsLogs)
    .set({
      status,
      deliveredAt: deliveredAt?.toISOString(),
      failedAt: failedAt?.toISOString(),
      failureReason,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(smsLogs.id, id));
}

// ============================================================================
// JOB EXECUTION HISTORY
// ============================================================================

export async function createJobExecution(data: InsertJobExecution) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(jobExecutions).values(data);
  return result;
}

export async function getJobExecutionById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const [result] = await db.select().from(jobExecutions).where(eq(jobExecutions.id, id)).limit(1);
  return result || null;
}

export async function getJobExecutionsByName(jobName: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(jobExecutions)
    .where(eq(jobExecutions.jobName, jobName))
    .orderBy(desc(jobExecutions.createdAt))
    .limit(limit);
}

export async function getRecentJobExecutions(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(jobExecutions)
    .orderBy(desc(jobExecutions.createdAt))
    .limit(limit);
}

export async function getFailedJobExecutions(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(jobExecutions)
    .where(eq(jobExecutions.status, 'failed'))
    .orderBy(desc(jobExecutions.createdAt))
    .limit(limit);
}

export async function updateJobExecutionStatus(
  id: number,
  status: JobExecution['status'],
  completedAt?: Date,
  duration?: number,
  errorMessage?: string,
  stackTrace?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(jobExecutions)
    .set({
      status,
      completedAt: completedAt?.toISOString(),
      duration,
      errorMessage,
      stackTrace,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(jobExecutions.id, id));
}

export async function incrementJobExecutionRetry(id: number, nextRetryAt: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(jobExecutions)
    .set({
      retryCount: sql`${jobExecutions.retryCount} + 1`,
      nextRetryAt: nextRetryAt.toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(jobExecutions.id, id));
}

export async function getJobExecutionStats(jobName?: string) {
  const db = await getDb();
  if (!db) return null;
  
  const whereClause = jobName ? eq(jobExecutions.jobName, jobName) : undefined;
  
  const [result] = await db.select({
    totalExecutions: count(jobExecutions.id),
    completedCount: sql<number>`SUM(CASE WHEN ${jobExecutions.status} = 'completed' THEN 1 ELSE 0 END)`,
    failedCount: sql<number>`SUM(CASE WHEN ${jobExecutions.status} = 'failed' THEN 1 ELSE 0 END)`,
    runningCount: sql<number>`SUM(CASE WHEN ${jobExecutions.status} = 'running' THEN 1 ELSE 0 END)`,
    avgDuration: sql<number>`AVG(${jobExecutions.duration})`,
    totalProcessedRecords: sum(jobExecutions.processedRecords),
  })
  .from(jobExecutions)
  .where(whereClause);
  
  return result;
}

// ============================================================================
// EXPORT HISTORY
// ============================================================================

export async function createExportHistory(data: InsertExportHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(exportHistory).values(data);
  return result;
}

export async function getExportHistoryById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const [result] = await db.select().from(exportHistory).where(eq(exportHistory.id, id)).limit(1);
  return result || null;
}

export async function getExportHistoryByUser(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(exportHistory)
    .where(eq(exportHistory.userId, userId))
    .orderBy(desc(exportHistory.createdAt))
    .limit(limit);
}

export async function getExportHistoryByDateRange(
  userId: number,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(exportHistory)
    .where(
      and(
        eq(exportHistory.userId, userId),
        gte(exportHistory.createdAt, startDate.toISOString()),
        lte(exportHistory.createdAt, endDate.toISOString())
      )
    )
    .orderBy(desc(exportHistory.createdAt));
}

export async function updateExportHistoryStatus(
  id: number,
  status: ExportHistory['status'],
  fileUrl?: string,
  fileKey?: string,
  fileSize?: number,
  processingTime?: number,
  errorMessage?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(exportHistory)
    .set({
      status,
      fileUrl,
      fileKey,
      fileSize,
      processingTime,
      errorMessage,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(exportHistory.id, id));
}

export async function incrementExportDownloadCount(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(exportHistory)
    .set({
      downloadCount: sql`${exportHistory.downloadCount} + 1`,
      lastDownloadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(exportHistory.id, id));
}

export async function getExpiredExports() {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date().toISOString();
  
  return db.select().from(exportHistory)
    .where(
      and(
        lte(exportHistory.expiresAt, now),
        eq(exportHistory.status, 'completed')
      )
    );
}

export async function markExportAsExpired(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(exportHistory)
    .set({
      status: 'expired',
      updatedAt: new Date().toISOString(),
    })
    .where(eq(exportHistory.id, id));
}

export async function getExportAnalytics(userId: number, days = 30) {
  const db = await getDb();
  if (!db) return null;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const [result] = await db.select({
    totalExports: count(exportHistory.id),
    totalDownloads: sum(exportHistory.downloadCount),
    csvCount: sql<number>`SUM(CASE WHEN ${exportHistory.exportType} = 'csv' THEN 1 ELSE 0 END)`,
    pdfCount: sql<number>`SUM(CASE WHEN ${exportHistory.exportType} = 'pdf' THEN 1 ELSE 0 END)`,
    excelCount: sql<number>`SUM(CASE WHEN ${exportHistory.exportType} = 'excel' THEN 1 ELSE 0 END)`,
    totalRecords: sum(exportHistory.recordCount),
    avgProcessingTime: sql<number>`AVG(${exportHistory.processingTime})`,
  })
  .from(exportHistory)
  .where(
    and(
      eq(exportHistory.userId, userId),
      gte(exportHistory.createdAt, startDate.toISOString())
    )
  );
  
  return result;
}

export async function getExportsByDataType(userId: number, days = 30) {
  const db = await getDb();
  if (!db) return [];
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return db.select({
    dataType: exportHistory.dataType,
    totalExports: count(exportHistory.id),
    totalDownloads: sum(exportHistory.downloadCount),
    totalRecords: sum(exportHistory.recordCount),
  })
  .from(exportHistory)
  .where(
    and(
      eq(exportHistory.userId, userId),
      gte(exportHistory.createdAt, startDate.toISOString())
    )
  )
  .groupBy(exportHistory.dataType);
}
