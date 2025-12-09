import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import * as phase26Db from "./phase26-db";

// ============================================================================
// SMS COST MONITORING ROUTER
// ============================================================================

const smsCostRouter = router({
  // Get SMS logs with pagination
  getLogs: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const logs = await phase26Db.getSmsLogsByUser(ctx.user.id, input.limit);
      return logs;
    }),

  // Get SMS cost analytics for a date range
  getCostAnalytics: protectedProcedure
    .input(z.object({
      startDate: z.string().datetime(),
      endDate: z.string().datetime(),
    }))
    .query(async ({ ctx, input }) => {
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      
      const analytics = await phase26Db.getSmsCostAnalytics(ctx.user.id, startDate, endDate);
      const byPurpose = await phase26Db.getSmsCostByPurpose(ctx.user.id, startDate, endDate);
      
      return {
        summary: analytics,
        byPurpose,
      };
    }),

  // Get SMS logs by date range
  getLogsByDateRange: protectedProcedure
    .input(z.object({
      startDate: z.string().datetime(),
      endDate: z.string().datetime(),
    }))
    .query(async ({ ctx, input }) => {
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      
      return phase26Db.getSmsLogsByDateRange(ctx.user.id, startDate, endDate);
    }),

  // Get SMS cost breakdown by purpose
  getCostByPurpose: protectedProcedure
    .input(z.object({
      startDate: z.string().datetime(),
      endDate: z.string().datetime(),
    }))
    .query(async ({ ctx, input }) => {
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      
      return phase26Db.getSmsCostByPurpose(ctx.user.id, startDate, endDate);
    }),

  // Get single SMS log by ID
  getLogById: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input }) => {
      return phase26Db.getSmsLogById(input.id);
    }),
});

// ============================================================================
// JOB EXECUTION HISTORY ROUTER
// ============================================================================

const jobExecutionRouter = router({
  // Get recent job executions
  getRecent: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(200).default(100),
    }))
    .query(async ({ input }) => {
      return phase26Db.getRecentJobExecutions(input.limit);
    }),

  // Get job executions by job name
  getByJobName: protectedProcedure
    .input(z.object({
      jobName: z.string(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      return phase26Db.getJobExecutionsByName(input.jobName, input.limit);
    }),

  // Get failed job executions
  getFailed: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      return phase26Db.getFailedJobExecutions(input.limit);
    }),

  // Get job execution by ID
  getById: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input }) => {
      return phase26Db.getJobExecutionById(input.id);
    }),

  // Get job execution statistics
  getStats: protectedProcedure
    .input(z.object({
      jobName: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return phase26Db.getJobExecutionStats(input.jobName);
    }),

  // Retry a failed job execution
  retry: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      const execution = await phase26Db.getJobExecutionById(input.id);
      if (!execution) {
        throw new Error("Job execution not found");
      }

      if (execution.retryCount >= execution.maxRetries) {
        throw new Error("Maximum retry attempts reached");
      }

      // Schedule retry in 5 minutes
      const nextRetryAt = new Date(Date.now() + 5 * 60 * 1000);
      await phase26Db.incrementJobExecutionRetry(input.id, nextRetryAt);

      return { success: true, nextRetryAt };
    }),

  // Update job execution status (for manual intervention)
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled', 'timeout']),
      errorMessage: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await phase26Db.updateJobExecutionStatus(
        input.id,
        input.status,
        input.status === 'completed' ? new Date() : undefined,
        undefined,
        input.errorMessage
      );

      return { success: true };
    }),
});

// ============================================================================
// EXPORT HISTORY ROUTER
// ============================================================================

const exportHistoryRouter = router({
  // Get export history for current user
  getHistory: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      return phase26Db.getExportHistoryByUser(ctx.user.id, input.limit);
    }),

  // Get export history by date range
  getByDateRange: protectedProcedure
    .input(z.object({
      startDate: z.string().datetime(),
      endDate: z.string().datetime(),
    }))
    .query(async ({ ctx, input }) => {
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      
      return phase26Db.getExportHistoryByDateRange(ctx.user.id, startDate, endDate);
    }),

  // Get export by ID
  getById: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const exportRecord = await phase26Db.getExportHistoryById(input.id);
      
      // Verify ownership
      if (exportRecord && exportRecord.userId !== ctx.user.id) {
        throw new Error("Unauthorized access to export");
      }
      
      return exportRecord;
    }),

  // Get export analytics
  getAnalytics: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(365).default(30),
    }))
    .query(async ({ ctx, input }) => {
      const analytics = await phase26Db.getExportAnalytics(ctx.user.id, input.days);
      const byDataType = await phase26Db.getExportsByDataType(ctx.user.id, input.days);
      
      return {
        summary: analytics,
        byDataType,
      };
    }),

  // Download export file (increments download count)
  download: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const exportRecord = await phase26Db.getExportHistoryById(input.id);
      
      if (!exportRecord) {
        throw new Error("Export not found");
      }
      
      // Verify ownership
      if (exportRecord.userId !== ctx.user.id) {
        throw new Error("Unauthorized access to export");
      }
      
      // Check if expired
      if (exportRecord.status === 'expired') {
        throw new Error("Export file has expired");
      }
      
      // Check if file exists
      if (!exportRecord.fileUrl) {
        throw new Error("Export file not available");
      }
      
      // Increment download count
      await phase26Db.incrementExportDownloadCount(input.id);
      
      return {
        fileUrl: exportRecord.fileUrl,
        fileName: exportRecord.fileName,
        fileSize: exportRecord.fileSize,
      };
    }),

  // Get expired exports (admin only)
  getExpired: protectedProcedure
    .query(async ({ ctx }) => {
      // Only allow admin users
      if (ctx.user.role !== 'admin') {
        throw new Error("Unauthorized: Admin access required");
      }
      
      return phase26Db.getExpiredExports();
    }),

  // Manually mark export as expired (admin only)
  markExpired: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Only allow admin users
      if (ctx.user.role !== 'admin') {
        throw new Error("Unauthorized: Admin access required");
      }
      
      await phase26Db.markExportAsExpired(input.id);
      
      return { success: true };
    }),
});

// ============================================================================
// MAIN PHASE 26 ROUTER
// ============================================================================

export const phase26Router = router({
  smsCost: smsCostRouter,
  jobExecution: jobExecutionRouter,
  exportHistory: exportHistoryRouter,
});
