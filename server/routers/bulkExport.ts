/**
 * Bulk Export Router
 * tRPC procedures for exporting match results to CSV/Excel
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { generateMatchCSV, generateMatchExcel, getExportStats } from "../bulkMatchExport";
import { storagePut } from "../../storage/index";

const exportFiltersSchema = z.object({
  jobIds: z.array(z.number()).optional(),
  candidateIds: z.array(z.number()).optional(),
  minMatchScore: z.number().min(0).max(100).optional(),
  maxMatchScore: z.number().min(0).max(100).optional(),
  statuses: z.array(z.string()).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const bulkExportRouter = router({
  /**
   * Get export statistics before generating file
   */
  getStats: protectedProcedure
    .input(exportFiltersSchema)
    .query(async ({ input }) => {
      return await getExportStats(input);
    }),

  /**
   * Generate CSV export and return as text
   */
  generateCSV: protectedProcedure
    .input(exportFiltersSchema)
    .mutation(async ({ input }) => {
      const csv = await generateMatchCSV(input);
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `match-results-${timestamp}.csv`;

      // Upload to S3
      const { url } = await storagePut(
        `exports/${filename}`,
        Buffer.from(csv, "utf-8"),
        "text/csv"
      );

      return {
        success: true,
        filename,
        url,
        downloadUrl: url,
      };
    }),

  /**
   * Generate Excel export and return download URL
   */
  generateExcel: protectedProcedure
    .input(exportFiltersSchema)
    .mutation(async ({ input }) => {
      const buffer = await generateMatchExcel(input);

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `match-results-${timestamp}.xlsx`;

      // Upload to S3
      const { url } = await storagePut(
        `exports/${filename}`,
        buffer,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      return {
        success: true,
        filename,
        url,
        downloadUrl: url,
      };
    }),
});
