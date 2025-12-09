import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createMhrsdSyncStatus,
  getMhrsdSyncStatusByEmployerId,
  getLatestMhrsdSyncStatus,
  updateMhrsdSyncStatus,
  createWorkPermit,
  getWorkPermitsByEmployerId,
  getExpiringWorkPermits,
  updateWorkPermit,
  deleteWorkPermit,
  createComplianceReport,
  getComplianceReportsByEmployerId,
  updateComplianceReport,
  getEmployerByUserId,
} from "../db";
import { TRPCError } from "@trpc/server";

export const complianceRouter = router({
  // ============================================================================
  // MHRSD Sync Status
  // ============================================================================

  // Get sync status history
  getSyncHistory: protectedProcedure.query(async ({ ctx }) => {
    const employer = await getEmployerByUserId(ctx.user.id);
    if (!employer) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Employer profile not found" });
    }

    return await getMhrsdSyncStatusByEmployerId(employer.id);
  }),

  // Get latest sync status
  getLatestSync: protectedProcedure.query(async ({ ctx }) => {
    const employer = await getEmployerByUserId(ctx.user.id);
    if (!employer) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Employer profile not found" });
    }

    const latest = await getLatestMhrsdSyncStatus(employer.id);
    return latest || null;
  }),

  // Trigger manual sync
  triggerSync: protectedProcedure.mutation(async ({ ctx }) => {
    const employer = await getEmployerByUserId(ctx.user.id);
    if (!employer) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Employer profile not found" });
    }

    // Create a new sync status record
    const syncRecord = await createMhrsdSyncStatus({
      employerId: employer.id,
      syncStatus: "in_progress",
      syncType: "manual",
      lastSyncAt: new Date(),
    });

    // Simulate sync process (in production, this would call actual MHRSD API)
    setTimeout(async () => {
      try {
        // Simulate successful sync
        await updateMhrsdSyncStatus(syncRecord.insertId as number, {
          syncStatus: "success",
          recordsSynced: Math.floor(Math.random() * 100) + 50,
          syncDuration: Math.floor(Math.random() * 30) + 10,
        });
      } catch (error) {
        await updateMhrsdSyncStatus(syncRecord.insertId as number, {
          syncStatus: "failed",
          errorMessage: "Sync failed: " + (error as Error).message,
        });
      }
    }, 2000);

    return {
      success: true,
      syncId: syncRecord.insertId,
      message: "Sync initiated successfully",
    };
  }),

  // ============================================================================
  // Work Permits Management
  // ============================================================================

  // Get all work permits
  getWorkPermits: protectedProcedure.query(async ({ ctx }) => {
    const employer = await getEmployerByUserId(ctx.user.id);
    if (!employer) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Employer profile not found" });
    }

    return await getWorkPermitsByEmployerId(employer.id);
  }),

  // Get expiring work permits
  getExpiringPermits: protectedProcedure
    .input(z.object({ daysAhead: z.number().default(30) }))
    .query(async ({ input, ctx }) => {
      const employer = await getEmployerByUserId(ctx.user.id);
      if (!employer) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Employer profile not found" });
      }

      return await getExpiringWorkPermits(employer.id, input.daysAhead);
    }),

  // Create work permit
  createWorkPermit: protectedProcedure
    .input(
      z.object({
        permitNumber: z.string().min(1),
        employeeName: z.string().min(1),
        employeeNationalId: z.string().optional(),
        nationality: z.string().optional(),
        occupation: z.string().optional(),
        issueDate: z.date(),
        expiryDate: z.date(),
        status: z.enum(["active", "expired", "cancelled", "pending_renewal", "suspended"]).default("active"),
        qiwaReferenceId: z.string().optional(),
        notes: z.string().optional(),
        candidateId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const employer = await getEmployerByUserId(ctx.user.id);
      if (!employer) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Employer profile not found" });
      }

      const permit = await createWorkPermit({
        ...input,
        employerId: employer.id,
      });

      return {
        success: true,
        permitId: permit.insertId,
      };
    }),

  // Update work permit
  updateWorkPermit: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        permitNumber: z.string().optional(),
        employeeName: z.string().optional(),
        employeeNationalId: z.string().optional(),
        nationality: z.string().optional(),
        occupation: z.string().optional(),
        issueDate: z.date().optional(),
        expiryDate: z.date().optional(),
        status: z.enum(["active", "expired", "cancelled", "pending_renewal", "suspended"]).optional(),
        qiwaReferenceId: z.string().optional(),
        notes: z.string().optional(),
        renewalReminderSent: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      await updateWorkPermit(id, updateData);

      return { success: true };
    }),

  // Delete work permit
  deleteWorkPermit: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteWorkPermit(input.id);
      return { success: true };
    }),

  // ============================================================================
  // Compliance Reports
  // ============================================================================

  // Get all compliance reports
  getComplianceReports: protectedProcedure.query(async ({ ctx }) => {
    const employer = await getEmployerByUserId(ctx.user.id);
    if (!employer) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Employer profile not found" });
    }

    return await getComplianceReportsByEmployerId(employer.id);
  }),

  // Create compliance report
  createComplianceReport: protectedProcedure
    .input(
      z.object({
        reportType: z.enum(["monthly", "quarterly", "annual", "audit", "custom"]),
        reportPeriodStart: z.date(),
        reportPeriodEnd: z.date(),
        submittedTo: z.enum(["mhrsd", "qiwa", "mudad", "gosi", "other"]),
        reportData: z.record(z.string(), z.any()).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const employer = await getEmployerByUserId(ctx.user.id);
      if (!employer) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Employer profile not found" });
      }

      const report = await createComplianceReport({
        ...input,
        employerId: employer.id,
        submissionStatus: "draft",
      });

      return {
        success: true,
        reportId: report.insertId,
      };
    }),

  // Submit compliance report
  submitComplianceReport: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        reportFileUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await updateComplianceReport(input.id, {
        submissionStatus: "submitted",
        submittedAt: new Date(),
        submittedBy: ctx.user.id,
        reportFileUrl: input.reportFileUrl,
        referenceNumber: `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      });

      return {
        success: true,
        message: "Report submitted successfully",
      };
    }),

  // Update compliance report
  updateComplianceReport: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        reportType: z.enum(["monthly", "quarterly", "annual", "audit", "custom"]).optional(),
        reportPeriodStart: z.date().optional(),
        reportPeriodEnd: z.date().optional(),
        submittedTo: z.enum(["mhrsd", "qiwa", "mudad", "gosi", "other"]).optional(),
        submissionStatus: z.enum(["draft", "submitted", "accepted", "rejected", "pending_review"]).optional(),
        reportData: z.record(z.string(), z.any()).optional(),
        reportFileUrl: z.string().optional(),
        responseData: z.record(z.string(), z.any()).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      await updateComplianceReport(id, updateData);

      return { success: true };
    }),
});
