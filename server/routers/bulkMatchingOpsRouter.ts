import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  bulkMatchJobs,
  exportBulkMatchesToCSV,
  exportBulkMatchesToPDFData,
  getJobsForBulkMatching,
  getBulkMatchStatistics,
} from "../bulkMatchingOps";

export const bulkMatchingOpsRouter = router({
  /**
   * Get available jobs for bulk matching
   */
  getAvailableJobs: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return getJobsForBulkMatching({
        userId: ctx.user.id,
        status: input.status,
      });
    }),

  /**
   * Perform bulk matching for multiple jobs
   */
  performBulkMatch: protectedProcedure
    .input(
      z.object({
        jobIds: z.array(z.number()),
        topN: z.number().optional(),
        minScore: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.jobIds.length === 0) {
        throw new Error("At least one job must be selected");
      }

      return bulkMatchJobs({
        userId: ctx.user.id,
        jobIds: input.jobIds,
        topN: input.topN,
        minScore: input.minScore,
      });
    }),

  /**
   * Export bulk match results to CSV
   */
  exportToCSV: protectedProcedure
    .input(
      z.object({
        jobIds: z.array(z.number()),
        topN: z.number().optional(),
        minScore: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Perform bulk matching
      const results = await bulkMatchJobs({
        userId: ctx.user.id,
        jobIds: input.jobIds,
        topN: input.topN,
        minScore: input.minScore,
      });

      // Convert to CSV
      const csvContent = exportBulkMatchesToCSV(results);

      return {
        filename: `bulk-match-report-${new Date().toISOString().split('T')[0]}.csv`,
        content: csvContent,
        mimeType: 'text/csv',
      };
    }),

  /**
   * Export bulk match results to PDF data
   */
  exportToPDF: protectedProcedure
    .input(
      z.object({
        jobIds: z.array(z.number()),
        topN: z.number().optional(),
        minScore: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Perform bulk matching
      const results = await bulkMatchJobs({
        userId: ctx.user.id,
        jobIds: input.jobIds,
        topN: input.topN,
        minScore: input.minScore,
      });

      // Convert to PDF data structure
      const pdfData = exportBulkMatchesToPDFData(results);

      return {
        filename: `bulk-match-report-${new Date().toISOString().split('T')[0]}.pdf`,
        data: pdfData,
      };
    }),

  /**
   * Get bulk match statistics
   */
  getStatistics: protectedProcedure
    .input(
      z.object({
        jobIds: z.array(z.number()),
      })
    )
    .query(async ({ ctx, input }) => {
      return getBulkMatchStatistics({
        userId: ctx.user.id,
        jobIds: input.jobIds,
      });
    }),
});
