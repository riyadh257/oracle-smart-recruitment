import cron from "node-cron";
import { eq, and, lte, isNotNull } from "drizzle-orm";
import { getDb } from "../db";
import {
  scheduledExports,
  scheduledExportRuns,
  type InsertScheduledExportRun,
} from "../../drizzle/schema";
// Import export functions (these will be created or imported from existing modules)
import { exportAnalyticsToCSV, exportAnalyticsToPDF } from "../analyticsExport";
import { storagePut } from "../../storage";
import { sendEmail } from "../emailDelivery";
import { notifyExportCompleted } from "../realtimeNotifications";

/**
 * Export Scheduler Service
 * Manages automated recurring exports with email delivery
 */

interface ScheduledTask {
  id: number;
  cronJob: cron.ScheduledTask;
  exportConfig: typeof scheduledExports.$inferSelect;
}

const activeTasks = new Map<number, ScheduledTask>();

/**
 * Calculate next run time based on schedule type
 */
function calculateNextRunTime(schedule: string, cronExpression?: string | null): Date {
  const now = new Date();
  const next = new Date(now);

  switch (schedule) {
    case "daily":
      next.setDate(next.getDate() + 1);
      next.setHours(9, 0, 0, 0); // 9 AM next day
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      next.setHours(9, 0, 0, 0); // 9 AM next week
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      next.setDate(1);
      next.setHours(9, 0, 0, 0); // 9 AM first day of next month
      break;
    case "custom":
      // For custom cron, calculate based on cron expression
      // This is a simplified calculation - in production use a proper cron parser
      next.setHours(next.getHours() + 1);
      break;
    default:
      next.setDate(next.getDate() + 1);
  }

  return next;
}

/**
 * Get cron expression for schedule type
 */
function getCronExpression(schedule: string, customExpression?: string | null): string {
  switch (schedule) {
    case "daily":
      return "0 9 * * *"; // Every day at 9 AM
    case "weekly":
      return "0 9 * * 1"; // Every Monday at 9 AM
    case "monthly":
      return "0 9 1 * *"; // First day of month at 9 AM
    case "custom":
      return customExpression || "0 9 * * *";
    default:
      return "0 9 * * *";
  }
}

/**
 * Execute a scheduled export
 */
async function executeScheduledExport(exportConfig: typeof scheduledExports.$inferSelect): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const startTime = Date.now();

  // Create export run record
  const runData: InsertScheduledExportRun = {
    scheduledExportId: exportConfig.id,
    status: "processing",
    startedAt: new Date().toISOString(),
    triggeredBy: "schedule",
  };

  const [runResult] = await db.insert(scheduledExportRuns).values(runData);
  const runId = runResult.insertId;

  try {
    console.log(`[ExportScheduler] Executing export: ${exportConfig.name}`);

    // Generate export based on template type
    let exportData: { buffer: Buffer; recordCount: number };
    const filters = exportConfig.filters ? JSON.parse(exportConfig.filters as any) : {};
    const columns = exportConfig.columns ? JSON.parse(exportConfig.columns as any) : undefined;

    switch (exportConfig.exportTemplate) {
      case "candidates":
      case "interviews":
      case "feedback":
        // For now, use analytics export as placeholder
        // TODO: Implement specific export functions for each template type
        exportData =
          exportConfig.exportFormat === "pdf"
            ? await exportAnalyticsToPDF(filters)
            : await exportAnalyticsToCSV(filters);
        break;
      case "analytics":
        exportData =
          exportConfig.exportFormat === "pdf"
            ? await exportAnalyticsToPDF(filters)
            : await exportAnalyticsToCSV(filters);
        break;
      default:
        throw new Error(`Unsupported export template: ${exportConfig.exportTemplate}`);
    }

    // Upload to S3
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `${exportConfig.name.replace(/\s+/g, "_")}_${timestamp}.${exportConfig.exportFormat}`;
    const fileKey = `scheduled-exports/${exportConfig.id}/${fileName}`;

    const { url: fileUrl } = await storagePut(
      fileKey,
      exportData.buffer,
      exportConfig.exportFormat === "pdf" ? "application/pdf" : "text/csv"
    );

    const processingTime = Date.now() - startTime;

    // Update run record with success
    await db
      .update(scheduledExportRuns)
      .set({
        status: "completed",
        completedAt: new Date().toISOString(),
        processingTime,
        recordCount: exportData.recordCount,
        fileUrl,
        fileKey,
        fileSize: exportData.buffer.length,
      })
      .where(eq(scheduledExportRuns.id, runId));

    // Send email notifications
    const recipients = exportConfig.emailRecipients
      ? (JSON.parse(exportConfig.emailRecipients as any) as string[])
      : [];
    let emailsSent = 0;
    const emailDeliveryStatus: any[] = [];

    if (recipients.length > 0 && exportConfig.includeAttachment) {
      for (const recipient of recipients) {
        try {
          await sendEmail({
            to: recipient,
            subject: exportConfig.emailSubject || `Scheduled Export: ${exportConfig.name}`,
            body:
              exportConfig.emailBody ||
              `Your scheduled export "${exportConfig.name}" is ready.\n\nDownload: ${fileUrl}`,
            attachments: [
              {
                filename: fileName,
                content: exportData.buffer,
                contentType:
                  exportConfig.exportFormat === "pdf" ? "application/pdf" : "text/csv",
              },
            ],
          });
          emailsSent++;
          emailDeliveryStatus.push({
            recipient,
            status: "sent",
            sentAt: new Date().toISOString(),
          });
        } catch (error) {
          emailDeliveryStatus.push({
            recipient,
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
            sentAt: new Date().toISOString(),
          });
        }
      }

      await db
        .update(scheduledExportRuns)
        .set({
          emailsSent,
          emailDeliveryStatus: JSON.stringify(emailDeliveryStatus),
        })
        .where(eq(scheduledExportRuns.id, runId));
    }

    // Update scheduled export stats
    const nextRunAt = calculateNextRunTime(exportConfig.schedule, exportConfig.cronExpression);
    await db
      .update(scheduledExports)
      .set({
        lastRunAt: new Date().toISOString(),
        nextRunAt: nextRunAt.toISOString(),
        lastRunStatus: "success",
        lastRunError: null,
        runCount: exportConfig.runCount + 1,
        successCount: exportConfig.successCount + 1,
      })
      .where(eq(scheduledExports.id, exportConfig.id));

    // Send real-time notification to creator
    notifyExportCompleted(exportConfig.createdBy, exportConfig.name, runId, fileUrl);

    console.log(
      `[ExportScheduler] Export completed: ${exportConfig.name} (${exportData.recordCount} records, ${emailsSent} emails sent)`
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const stackTrace = error instanceof Error ? error.stack : undefined;

    console.error(`[ExportScheduler] Export failed: ${exportConfig.name}`, error);

    // Update run record with failure
    await db
      .update(scheduledExportRuns)
      .set({
        status: "failed",
        completedAt: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        errorMessage,
        stackTrace,
      })
      .where(eq(scheduledExportRuns.id, runId));

    // Update scheduled export stats
    const nextRunAt = calculateNextRunTime(exportConfig.schedule, exportConfig.cronExpression);
    await db
      .update(scheduledExports)
      .set({
        lastRunAt: new Date().toISOString(),
        nextRunAt: nextRunAt.toISOString(),
        lastRunStatus: "failed",
        lastRunError: errorMessage,
        runCount: exportConfig.runCount + 1,
        failureCount: exportConfig.failureCount + 1,
      })
      .where(eq(scheduledExports.id, exportConfig.id));
  }
}

/**
 * Schedule a cron job for an export
 */
function scheduleExport(exportConfig: typeof scheduledExports.$inferSelect): void {
  // Remove existing task if any
  if (activeTasks.has(exportConfig.id)) {
    const existing = activeTasks.get(exportConfig.id);
    existing?.cronJob.stop();
    activeTasks.delete(exportConfig.id);
  }

  if (!exportConfig.isActive) {
    console.log(`[ExportScheduler] Skipping inactive export: ${exportConfig.name}`);
    return;
  }

  const cronExpression = getCronExpression(exportConfig.schedule, exportConfig.cronExpression);

  console.log(`[ExportScheduler] Scheduling export: ${exportConfig.name} (${cronExpression})`);

  const cronJob = cron.schedule(
    cronExpression,
    async () => {
      await executeScheduledExport(exportConfig);
    },
    {
      scheduled: true,
      timezone: exportConfig.timezone || "Asia/Riyadh",
    }
  );

  activeTasks.set(exportConfig.id, {
    id: exportConfig.id,
    cronJob,
    exportConfig,
  });
}

/**
 * Initialize export scheduler - load all active exports and schedule them
 */
export async function initializeExportScheduler(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[ExportScheduler] Database not available, skipping initialization");
    return;
  }

  console.log("[ExportScheduler] Initializing export scheduler...");

  const activeExports = await db
    .select()
    .from(scheduledExports)
    .where(eq(scheduledExports.isActive, 1));

  for (const exportConfig of activeExports) {
    scheduleExport(exportConfig);
  }

  console.log(`[ExportScheduler] Initialized ${activeExports.length} scheduled exports`);
}

/**
 * Add or update a scheduled export
 */
export function updateScheduledExport(exportConfig: typeof scheduledExports.$inferSelect): void {
  scheduleExport(exportConfig);
}

/**
 * Remove a scheduled export
 */
export function removeScheduledExport(exportId: number): void {
  const task = activeTasks.get(exportId);
  if (task) {
    task.cronJob.stop();
    activeTasks.delete(exportId);
    console.log(`[ExportScheduler] Removed scheduled export: ${exportId}`);
  }
}

/**
 * Manually trigger an export (outside of schedule)
 */
export async function triggerExportManually(
  exportId: number,
  userId: number
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const [exportConfig] = await db
    .select()
    .from(scheduledExports)
    .where(eq(scheduledExports.id, exportId))
    .limit(1);

  if (!exportConfig) {
    throw new Error("Scheduled export not found");
  }

  // Create a manual run record
  const runData: InsertScheduledExportRun = {
    scheduledExportId: exportId,
    status: "pending",
    triggeredBy: "manual",
    triggeredByUserId: userId,
  };

  await db.insert(scheduledExportRuns).values(runData);

  // Execute immediately
  await executeScheduledExport(exportConfig);
}

/**
 * Get all active scheduled tasks
 */
export function getActiveScheduledTasks(): ScheduledTask[] {
  return Array.from(activeTasks.values());
}
