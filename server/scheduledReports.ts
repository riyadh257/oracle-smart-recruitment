import { eq, desc, and, lte } from "drizzle-orm";
import { getDb } from "./db";
import {
  scheduledReports,
  reportDeliveryLogs,
  type InsertScheduledReport,
  type ScheduledReport,
  type InsertReportDeliveryLog,
  type ReportDeliveryLog,
} from "../drizzle/schema";

/**
 * Scheduled Reports Database Operations
 * Handles report scheduling, configuration, and delivery tracking
 */

export async function createScheduledReport(
  data: InsertScheduledReport
): Promise<ScheduledReport> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Calculate next run time based on schedule
  const nextRunAt = calculateNextRunTime(
    data.schedule,
    data.scheduleDay,
    data.scheduleTime || "09:00"
  );

  const result = await db.insert(scheduledReports).values({
    ...data,
    nextRunAt: nextRunAt.toISOString() as any,
  });

  const insertedId = Number(result[0].insertId);
  const record = await db
    .select()
    .from(scheduledReports)
    .where(eq(scheduledReports.id, insertedId))
    .limit(1);

  if (!record[0]) throw new Error("Failed to create scheduled report");
  return record[0];
}

export async function updateScheduledReport(
  id: number,
  data: Partial<InsertScheduledReport>
): Promise<ScheduledReport> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Recalculate next run time if schedule changed
  if (data.schedule || data.scheduleDay || data.scheduleTime) {
    const existing = await getScheduledReportById(id);
    if (existing) {
      const nextRunAt = calculateNextRunTime(
        data.schedule || existing.schedule,
        data.scheduleDay ?? existing.scheduleDay ?? undefined,
        data.scheduleTime || existing.scheduleTime || "09:00"
      );
      data.nextRunAt = nextRunAt.toISOString() as any;
    }
  }

  await db.update(scheduledReports).set(data).where(eq(scheduledReports.id, id));

  const record = await db
    .select()
    .from(scheduledReports)
    .where(eq(scheduledReports.id, id))
    .limit(1);

  if (!record[0]) throw new Error("Scheduled report not found");
  return record[0];
}

export async function deleteScheduledReport(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(scheduledReports).where(eq(scheduledReports.id, id));
}

export async function getScheduledReportById(
  id: number
): Promise<ScheduledReport | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const record = await db
    .select()
    .from(scheduledReports)
    .where(eq(scheduledReports.id, id))
    .limit(1);

  return record[0];
}

export async function getScheduledReports(filters: {
  userId?: number;
  reportType?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [];

  if (filters.userId) {
    conditions.push(eq(scheduledReports.userId, filters.userId));
  }
  if (filters.reportType) {
    conditions.push(eq(scheduledReports.reportType, filters.reportType as any));
  }
  if (filters.isActive !== undefined) {
    conditions.push(eq(scheduledReports.isActive, filters.isActive ? 1 : 0));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const records = await db
    .select()
    .from(scheduledReports)
    .where(whereClause)
    .orderBy(desc(scheduledReports.createdAt))
    .limit(filters.limit || 50)
    .offset(filters.offset || 0);

  return records;
}

export async function getDueReports(): Promise<ScheduledReport[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date().toISOString();

  const records = await db
    .select()
    .from(scheduledReports)
    .where(
      and(
        eq(scheduledReports.isActive, 1),
        lte(scheduledReports.nextRunAt, now as any)
      )
    );

  return records;
}

export async function markReportAsRun(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const report = await getScheduledReportById(id);
  if (!report) throw new Error("Report not found");

  const now = new Date();
  const nextRunAt = calculateNextRunTime(
    report.schedule,
    report.scheduleDay ?? undefined,
    report.scheduleTime || "09:00"
  );

  await db
    .update(scheduledReports)
    .set({
      lastRunAt: now.toISOString() as any,
      nextRunAt: nextRunAt.toISOString() as any,
    })
    .where(eq(scheduledReports.id, id));
}

export async function createDeliveryLog(
  data: InsertReportDeliveryLog
): Promise<ReportDeliveryLog> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(reportDeliveryLogs).values(data);
  const insertedId = Number(result[0].insertId);

  const record = await db
    .select()
    .from(reportDeliveryLogs)
    .where(eq(reportDeliveryLogs.id, insertedId))
    .limit(1);

  if (!record[0]) throw new Error("Failed to create delivery log");
  return record[0];
}

export async function updateDeliveryLog(
  id: number,
  data: Partial<InsertReportDeliveryLog>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(reportDeliveryLogs).set(data).where(eq(reportDeliveryLogs.id, id));
}

export async function getDeliveryLogs(scheduledReportId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const records = await db
    .select()
    .from(reportDeliveryLogs)
    .where(eq(reportDeliveryLogs.scheduledReportId, scheduledReportId))
    .orderBy(desc(reportDeliveryLogs.createdAt))
    .limit(limit);

  return records;
}

/**
 * Calculate the next run time based on schedule configuration
 */
function calculateNextRunTime(
  schedule: string,
  scheduleDay: number | undefined,
  scheduleTime: string
): Date {
  const now = new Date();
  const [hours, minutes] = scheduleTime.split(":").map(Number);

  const nextRun = new Date(now);
  nextRun.setHours(hours || 9, minutes || 0, 0, 0);

  switch (schedule) {
    case "daily":
      // If today's time has passed, schedule for tomorrow
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;

    case "weekly":
      // Schedule for specific day of week (1 = Monday, 7 = Sunday)
      const targetDay = scheduleDay || 1;
      const currentDay = nextRun.getDay() || 7; // Convert Sunday from 0 to 7

      let daysUntilTarget = targetDay - currentDay;
      if (daysUntilTarget < 0 || (daysUntilTarget === 0 && nextRun <= now)) {
        daysUntilTarget += 7;
      }

      nextRun.setDate(nextRun.getDate() + daysUntilTarget);
      break;

    case "monthly":
      // Schedule for specific day of month
      const targetDayOfMonth = scheduleDay || 1;
      nextRun.setDate(targetDayOfMonth);

      // If this month's date has passed, move to next month
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1);
        nextRun.setDate(targetDayOfMonth);
      }
      break;

    case "quarterly":
      // Schedule for first day of next quarter
      const currentMonth = nextRun.getMonth();
      const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
      nextRun.setMonth(quarterStartMonth);
      nextRun.setDate(1);

      // If current quarter start has passed, move to next quarter
      if (nextRun <= now) {
        nextRun.setMonth(quarterStartMonth + 3);
        nextRun.setDate(1);
      }
      break;
  }

  return nextRun;
}
