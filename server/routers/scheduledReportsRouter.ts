import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import {
  createScheduledReport,
  updateScheduledReport,
  deleteScheduledReport,
  getScheduledReportById,
  getScheduledReports,
  getDeliveryLogs,
} from "../scheduledReports";
import { auditDataChange } from "../auditLog";

/**
 * Scheduled Reports Router
 * Handles report scheduling, configuration, and delivery tracking
 */

export const scheduledReportsRouter = router({
  // Create a new scheduled report
  create: protectedProcedure
    .input(
      z.object({
        reportName: z.string().min(1),
        reportType: z.enum([
          "compliance_summary",
          "analytics_dashboard",
          "ksa_labor_law",
          "nitaqat_status",
          "candidate_pipeline",
          "interview_feedback",
          "engagement_metrics",
          "custom",
        ]),
        schedule: z.enum(["daily", "weekly", "monthly", "quarterly"]),
        scheduleDay: z.number().optional(),
        scheduleTime: z.string().default("09:00"),
        recipients: z.array(z.string().email()),
        reportConfig: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const report = await createScheduledReport({
        userId: ctx.user.id,
        reportName: input.reportName,
        reportType: input.reportType,
        schedule: input.schedule,
        scheduleDay: input.scheduleDay,
        scheduleTime: input.scheduleTime,
        recipients: input.recipients as any,
        reportConfig: input.reportConfig as any,
        isActive: 1,
      });

      // Log audit entry
      await auditDataChange({
        userId: ctx.user.id,
        entityType: "scheduled_report",
        entityId: report.id,
        action: "create",
        valueAfter: report,
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.get("user-agent"),
      });

      return report;
    }),

  // Update a scheduled report
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        reportName: z.string().optional(),
        reportType: z
          .enum([
            "compliance_summary",
            "analytics_dashboard",
            "ksa_labor_law",
            "nitaqat_status",
            "candidate_pipeline",
            "interview_feedback",
            "engagement_metrics",
            "custom",
          ])
          .optional(),
        schedule: z.enum(["daily", "weekly", "monthly", "quarterly"]).optional(),
        scheduleDay: z.number().optional(),
        scheduleTime: z.string().optional(),
        recipients: z.array(z.string().email()).optional(),
        reportConfig: z.any().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Get current record for audit
      const before = await getScheduledReportById(id);

      const updated = await updateScheduledReport(id, {
        ...updateData,
        isActive: updateData.isActive !== undefined ? (updateData.isActive ? 1 : 0) : undefined,
        recipients: updateData.recipients as any,
        reportConfig: updateData.reportConfig as any,
      });

      // Log audit entry
      await auditDataChange({
        userId: ctx.user.id,
        entityType: "scheduled_report",
        entityId: id,
        action: "update",
        valueBefore: before,
        valueAfter: updated,
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.get("user-agent"),
      });

      return updated;
    }),

  // Delete a scheduled report
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Get current record for audit
      const before = await getScheduledReportById(input.id);

      await deleteScheduledReport(input.id);

      // Log audit entry
      await auditDataChange({
        userId: ctx.user.id,
        entityType: "scheduled_report",
        entityId: input.id,
        action: "delete",
        valueBefore: before,
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.get("user-agent"),
      });

      return { success: true };
    }),

  // Get all scheduled reports for the user
  list: protectedProcedure
    .input(
      z.object({
        reportType: z.string().optional(),
        isActive: z.boolean().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const reports = await getScheduledReports({
        userId: ctx.user.id,
        reportType: input.reportType,
        isActive: input.isActive,
        limit: input.limit,
        offset: input.offset,
      });

      return reports;
    }),

  // Get single scheduled report by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const report = await getScheduledReportById(input.id);
      if (!report) throw new Error("Scheduled report not found");
      return report;
    }),

  // Get delivery logs for a scheduled report
  deliveryLogs: protectedProcedure
    .input(
      z.object({
        scheduledReportId: z.number(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const logs = await getDeliveryLogs(input.scheduledReportId, input.limit);
      return logs;
    }),
});
