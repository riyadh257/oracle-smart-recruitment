import { z } from "zod";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { advancedAnalytics } from "../drizzle/schema";

export const advancedAnalyticsRouter = router({
  // Get advanced metrics for a date range
  getAdvancedMetrics: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        dataType: z.enum(["all", "imports", "audits", "reports"]).default("all"),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const metrics = await db
        .select()
        .from(advancedAnalytics)
        .where(
          and(
            eq(advancedAnalytics.userId, ctx.user.id),
            gte(advancedAnalytics.date, input.startDate),
            lte(advancedAnalytics.date, input.endDate)
          )
        )
        .orderBy(advancedAnalytics.date);

      // Calculate summary statistics
      const summary = {
        totalImports: metrics.reduce((sum, m) => sum + (m.importsCompleted || 0), 0),
        failedImports: metrics.reduce((sum, m) => sum + (m.importsFailed || 0), 0),
        totalRecords: metrics.reduce((sum, m) => sum + (m.recordsImported || 0), 0),
        totalAuditEvents: metrics.reduce((sum, m) => sum + (m.auditEventsCreated || 0), 0),
        totalViolations: metrics.reduce((sum, m) => sum + (m.complianceViolations || 0), 0),
        totalReportsDelivered: metrics.reduce((sum, m) => sum + (m.reportsDelivered || 0), 0),
        totalReportsFailed: metrics.reduce((sum, m) => sum + (m.reportsFailed || 0), 0),
      };

      const successRate =
        summary.totalImports > 0
          ? ((summary.totalImports / (summary.totalImports + summary.failedImports)) * 100).toFixed(1)
          : "0";

      return {
        metrics,
        summary: {
          ...summary,
          successRate: parseFloat(successRate),
        },
      };
    }),

  // Get import trends
  getImportTrends: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        groupBy: z.enum(["day", "week", "month"]).default("day"),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const trends = await db
        .select()
        .from(advancedAnalytics)
        .where(
          and(
            eq(advancedAnalytics.userId, ctx.user.id),
            gte(advancedAnalytics.date, input.startDate),
            lte(advancedAnalytics.date, input.endDate)
          )
        )
        .orderBy(advancedAnalytics.date);

      return trends.map((t) => ({
        date: t.date,
        started: t.importsStarted || 0,
        completed: t.importsCompleted || 0,
        failed: t.importsFailed || 0,
        records: t.recordsImported || 0,
        avgTime: t.avgImportTime || 0,
      }));
    }),

  // Get audit activity patterns
  getAuditPatterns: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const patterns = await db
        .select()
        .from(advancedAnalytics)
        .where(
          and(
            eq(advancedAnalytics.userId, ctx.user.id),
            gte(advancedAnalytics.date, input.startDate),
            lte(advancedAnalytics.date, input.endDate)
          )
        )
        .orderBy(advancedAnalytics.date);

      return patterns.map((p) => ({
        date: p.date,
        events: p.auditEventsCreated || 0,
        changes: p.dataChanges || 0,
        violations: p.complianceViolations || 0,
        critical: p.criticalChanges || 0,
      }));
    }),

  // Get report delivery metrics
  getReportDeliveryMetrics: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const metrics = await db
        .select()
        .from(advancedAnalytics)
        .where(
          and(
            eq(advancedAnalytics.userId, ctx.user.id),
            gte(advancedAnalytics.date, input.startDate),
            lte(advancedAnalytics.date, input.endDate)
          )
        )
        .orderBy(advancedAnalytics.date);

      const totalScheduled = metrics.reduce((sum, m) => sum + (m.reportsScheduled || 0), 0);
      const totalDelivered = metrics.reduce((sum, m) => sum + (m.reportsDelivered || 0), 0);
      const totalFailed = metrics.reduce((sum, m) => sum + (m.reportsFailed || 0), 0);
      const pending = totalScheduled - totalDelivered - totalFailed;

      const avgDeliveryTime =
        metrics.length > 0
          ? metrics.reduce((sum, m) => sum + (m.avgDeliveryTime || 0), 0) / metrics.length
          : 0;

      return {
        distribution: [
          { name: "Delivered", value: totalDelivered, color: "#10b981" },
          { name: "Failed", value: totalFailed, color: "#ef4444" },
          { name: "Pending", value: pending, color: "#f59e0b" },
        ],
        stats: {
          totalScheduled,
          totalDelivered,
          totalFailed,
          pending,
          avgDeliveryTime: (avgDeliveryTime / 1000).toFixed(2), // Convert to seconds
          successRate: totalScheduled > 0 ? ((totalDelivered / totalScheduled) * 100).toFixed(1) : "0",
        },
      };
    }),

  // Record import metrics (called by import system)
  recordImportMetrics: protectedProcedure
    .input(
      z.object({
        date: z.string(),
        started: z.number().optional(),
        completed: z.number().optional(),
        failed: z.number().optional(),
        records: z.number().optional(),
        avgTime: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if record exists for this date
      const [existing] = await db
        .select()
        .from(advancedAnalytics)
        .where(
          and(
            eq(advancedAnalytics.userId, ctx.user.id),
            eq(advancedAnalytics.date, input.date)
          )
        )
        .limit(1);

      if (existing) {
        // Update existing record
        await db
          .update(advancedAnalytics)
          .set({
            importsStarted: (existing.importsStarted || 0) + (input.started || 0),
            importsCompleted: (existing.importsCompleted || 0) + (input.completed || 0),
            importsFailed: (existing.importsFailed || 0) + (input.failed || 0),
            recordsImported: (existing.recordsImported || 0) + (input.records || 0),
            avgImportTime: input.avgTime || existing.avgImportTime,
          })
          .where(eq(advancedAnalytics.id, existing.id));
      } else {
        // Create new record
        await db.insert(advancedAnalytics).values({
          userId: ctx.user.id,
          date: input.date,
          importsStarted: input.started || 0,
          importsCompleted: input.completed || 0,
          importsFailed: input.failed || 0,
          recordsImported: input.records || 0,
          avgImportTime: input.avgTime || 0,
        });
      }

      return { success: true };
    }),

  // Record audit metrics (called by audit system)
  recordAuditMetrics: protectedProcedure
    .input(
      z.object({
        date: z.string(),
        events: z.number().optional(),
        changes: z.number().optional(),
        violations: z.number().optional(),
        critical: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [existing] = await db
        .select()
        .from(advancedAnalytics)
        .where(
          and(
            eq(advancedAnalytics.userId, ctx.user.id),
            eq(advancedAnalytics.date, input.date)
          )
        )
        .limit(1);

      if (existing) {
        await db
          .update(advancedAnalytics)
          .set({
            auditEventsCreated: (existing.auditEventsCreated || 0) + (input.events || 0),
            dataChanges: (existing.dataChanges || 0) + (input.changes || 0),
            complianceViolations: (existing.complianceViolations || 0) + (input.violations || 0),
            criticalChanges: (existing.criticalChanges || 0) + (input.critical || 0),
          })
          .where(eq(advancedAnalytics.id, existing.id));
      } else {
        await db.insert(advancedAnalytics).values({
          userId: ctx.user.id,
          date: input.date,
          auditEventsCreated: input.events || 0,
          dataChanges: input.changes || 0,
          complianceViolations: input.violations || 0,
          criticalChanges: input.critical || 0,
        });
      }

      return { success: true };
    }),

  // Record report delivery metrics (called by report system)
  recordReportMetrics: protectedProcedure
    .input(
      z.object({
        date: z.string(),
        scheduled: z.number().optional(),
        delivered: z.number().optional(),
        failed: z.number().optional(),
        avgTime: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [existing] = await db
        .select()
        .from(advancedAnalytics)
        .where(
          and(
            eq(advancedAnalytics.userId, ctx.user.id),
            eq(advancedAnalytics.date, input.date)
          )
        )
        .limit(1);

      if (existing) {
        await db
          .update(advancedAnalytics)
          .set({
            reportsScheduled: (existing.reportsScheduled || 0) + (input.scheduled || 0),
            reportsDelivered: (existing.reportsDelivered || 0) + (input.delivered || 0),
            reportsFailed: (existing.reportsFailed || 0) + (input.failed || 0),
            avgDeliveryTime: input.avgTime || existing.avgDeliveryTime,
          })
          .where(eq(advancedAnalytics.id, existing.id));
      } else {
        await db.insert(advancedAnalytics).values({
          userId: ctx.user.id,
          date: input.date,
          reportsScheduled: input.scheduled || 0,
          reportsDelivered: input.delivered || 0,
          reportsFailed: input.failed || 0,
          avgDeliveryTime: input.avgTime || 0,
        });
      }

      return { success: true };
    }),
});
