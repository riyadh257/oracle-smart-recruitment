import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  scheduledExports,
  scheduledExportRuns,
  type InsertScheduledExport,
} from "../../drizzle/schema";
import {
  updateScheduledExport,
  removeScheduledExport,
  triggerExportManually,
  getActiveScheduledTasks,
} from "../services/exportScheduler";

export const scheduledExportsRouter = router({
  // Get all scheduled exports
  getAll: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    return await db
      .select()
      .from(scheduledExports)
      .orderBy(desc(scheduledExports.createdAt));
  }),

  // Get a single scheduled export by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const [exportConfig] = await db
        .select()
        .from(scheduledExports)
        .where(eq(scheduledExports.id, input.id))
        .limit(1);

      if (!exportConfig) {
        throw new Error("Scheduled export not found");
      }

      return exportConfig;
    }),

  // Create a new scheduled export
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        exportTemplate: z.enum([
          "candidates",
          "interviews",
          "feedback",
          "analytics",
          "campaigns",
          "jobs",
          "applications",
          "custom",
        ]),
        exportFormat: z.enum(["csv", "pdf", "excel"]).default("csv"),
        schedule: z.enum(["daily", "weekly", "monthly", "custom"]).default("weekly"),
        cronExpression: z.string().optional(),
        timezone: z.string().default("Asia/Riyadh"),
        filters: z.record(z.any()).optional(),
        columns: z.array(z.string()).optional(),
        emailRecipients: z.array(z.string().email()).default([]),
        emailSubject: z.string().optional(),
        emailBody: z.string().optional(),
        includeAttachment: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const nextRunAt = new Date();
      nextRunAt.setHours(nextRunAt.getHours() + 1); // First run in 1 hour

      const exportData: InsertScheduledExport = {
        ...input,
        filters: input.filters ? JSON.stringify(input.filters) : null,
        columns: input.columns ? JSON.stringify(input.columns) : null,
        emailRecipients: JSON.stringify(input.emailRecipients),
        nextRunAt: nextRunAt.toISOString(),
        createdBy: ctx.user.id,
      };

      const result = await db.insert(scheduledExports).values(exportData);
      const exportId = result[0].insertId;

      // Fetch the created export to schedule it
      const [createdExport] = await db
        .select()
        .from(scheduledExports)
        .where(eq(scheduledExports.id, exportId))
        .limit(1);

      if (createdExport) {
        updateScheduledExport(createdExport);
      }

      return { id: exportId, success: true };
    }),

  // Update a scheduled export
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        exportTemplate: z
          .enum([
            "candidates",
            "interviews",
            "feedback",
            "analytics",
            "campaigns",
            "jobs",
            "applications",
            "custom",
          ])
          .optional(),
        exportFormat: z.enum(["csv", "pdf", "excel"]).optional(),
        schedule: z.enum(["daily", "weekly", "monthly", "custom"]).optional(),
        cronExpression: z.string().optional(),
        timezone: z.string().optional(),
        filters: z.record(z.any()).optional(),
        columns: z.array(z.string()).optional(),
        emailRecipients: z.array(z.string().email()).optional(),
        emailSubject: z.string().optional(),
        emailBody: z.string().optional(),
        includeAttachment: z.boolean().optional(),
        isActive: z.number().min(0).max(1).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const { id, ...updates } = input;

      const updateData: any = { ...updates };
      if (updates.filters !== undefined) {
        updateData.filters = JSON.stringify(updates.filters);
      }
      if (updates.columns !== undefined) {
        updateData.columns = JSON.stringify(updates.columns);
      }
      if (updates.emailRecipients !== undefined) {
        updateData.emailRecipients = JSON.stringify(updates.emailRecipients);
      }

      await db
        .update(scheduledExports)
        .set(updateData)
        .where(eq(scheduledExports.id, id));

      // Fetch updated export to reschedule it
      const [updatedExport] = await db
        .select()
        .from(scheduledExports)
        .where(eq(scheduledExports.id, id))
        .limit(1);

      if (updatedExport) {
        if (updatedExport.isActive) {
          updateScheduledExport(updatedExport);
        } else {
          removeScheduledExport(id);
        }
      }

      return { success: true };
    }),

  // Delete a scheduled export
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Remove from scheduler first
      removeScheduledExport(input.id);

      // Then delete from database
      await db
        .delete(scheduledExports)
        .where(eq(scheduledExports.id, input.id));

      return { success: true };
    }),

  // Get export runs for a scheduled export
  getRuns: protectedProcedure
    .input(
      z.object({
        scheduledExportId: z.number(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      return await db
        .select()
        .from(scheduledExportRuns)
        .where(eq(scheduledExportRuns.scheduledExportId, input.scheduledExportId))
        .orderBy(desc(scheduledExportRuns.createdAt))
        .limit(input.limit);
    }),

  // Manually trigger an export
  triggerManual: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await triggerExportManually(input.id, ctx.user.id);
      return { success: true, message: "Export triggered successfully" };
    }),

  // Get active scheduled tasks status
  getActiveTasksStatus: protectedProcedure.query(() => {
    const tasks = getActiveScheduledTasks();
    return tasks.map((task) => ({
      id: task.id,
      name: task.exportConfig.name,
      schedule: task.exportConfig.schedule,
      nextRunAt: task.exportConfig.nextRunAt,
      lastRunAt: task.exportConfig.lastRunAt,
      lastRunStatus: task.exportConfig.lastRunStatus,
      isActive: task.exportConfig.isActive,
    }));
  }),

  // Get export statistics
  getStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const allExports = await db.select().from(scheduledExports);

    const stats = {
      total: allExports.length,
      active: allExports.filter((e) => e.isActive === 1).length,
      inactive: allExports.filter((e) => e.isActive === 0).length,
      totalRuns: allExports.reduce((sum, e) => sum + e.runCount, 0),
      totalSuccesses: allExports.reduce((sum, e) => sum + e.successCount, 0),
      totalFailures: allExports.reduce((sum, e) => sum + e.failureCount, 0),
    };

    return stats;
  }),
});
