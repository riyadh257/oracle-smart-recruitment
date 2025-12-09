import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  createScheduledExport,
  getScheduledExports,
  getExportRunHistory,
  getAvailableFilterFields,
  getAvailableColumns,
} from "./advancedExportService";
import { getDb } from "./db";
import { scheduledExports } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const exportFilterSchema = z.object({
  field: z.string(),
  operator: z.enum([
    "equals",
    "contains",
    "greaterThan",
    "lessThan",
    "between",
    "in",
  ]),
  value: z.any(),
});

const exportColumnSchema = z.object({
  field: z.string(),
  label: z.string(),
  format: z.string().optional(),
});

export const advancedExportRouter = router({
  /**
   * Get available filter fields for a template
   */
  getAvailableFilterFields: protectedProcedure
    .input(
      z.object({
        template: z.string(),
      })
    )
    .query(async ({ input }) => {
      const fields = getAvailableFilterFields(input.template);
      return fields;
    }),

  /**
   * Get available columns for a template
   */
  getAvailableColumns: protectedProcedure
    .input(
      z.object({
        template: z.string(),
      })
    )
    .query(async ({ input }) => {
      const columns = getAvailableColumns(input.template);
      return columns;
    }),

  /**
   * Create scheduled export
   */
  createScheduledExport: protectedProcedure
    .input(
      z.object({
        name: z.string(),
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
        exportFormat: z.enum(["csv", "pdf", "excel"]),
        schedule: z.enum(["daily", "weekly", "monthly", "custom"]),
        cronExpression: z.string().optional(),
        timezone: z.string().optional(),
        filters: z.array(exportFilterSchema),
        columns: z.array(exportColumnSchema),
        emailRecipients: z.array(z.string()),
        emailSubject: z.string().optional(),
        emailBody: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await createScheduledExport(input, ctx.user.id);
      return result;
    }),

  /**
   * Get scheduled exports
   */
  getScheduledExports: protectedProcedure
    .input(
      z.object({
        userId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const exports = await getScheduledExports(input.userId);
      return exports;
    }),

  /**
   * Get export run history
   */
  getExportRunHistory: protectedProcedure
    .input(
      z.object({
        scheduledExportId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const runs = await getExportRunHistory(input.scheduledExportId);
      return runs;
    }),

  /**
   * Update scheduled export
   */
  updateScheduledExport: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        filters: z.array(exportFilterSchema).optional(),
        columns: z.array(exportColumnSchema).optional(),
        emailRecipients: z.array(z.string()).optional(),
        isActive: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined)
        updateData.description = input.description;
      if (input.filters !== undefined)
        updateData.filters = JSON.stringify(input.filters);
      if (input.columns !== undefined)
        updateData.columns = JSON.stringify(input.columns);
      if (input.emailRecipients !== undefined)
        updateData.emailRecipients = JSON.stringify(input.emailRecipients);
      if (input.isActive !== undefined) updateData.isActive = input.isActive;

      await db
        .update(scheduledExports)
        .set(updateData)
        .where(eq(scheduledExports.id, input.id));

      return { success: true };
    }),

  /**
   * Delete scheduled export
   */
  deleteScheduledExport: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .delete(scheduledExports)
        .where(eq(scheduledExports.id, input.id));

      return { success: true };
    }),
});
