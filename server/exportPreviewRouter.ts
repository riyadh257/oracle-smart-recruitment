import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { previewExport } from "./exportPreviewService";

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

export const exportPreviewRouter = router({
  /**
   * Preview export data before scheduling
   * Returns sample data, count, size estimate, and validation warnings
   */
  previewExport: protectedProcedure
    .input(
      z.object({
        template: z.enum([
          "candidates",
          "interviews",
          "feedback",
          "analytics",
          "campaigns",
          "jobs",
          "applications",
        ]),
        filters: z.array(exportFilterSchema),
        columns: z.array(exportColumnSchema),
        format: z.enum(["csv", "pdf", "excel"]).default("csv"),
      })
    )
    .query(async ({ input }) => {
      const result = await previewExport(
        input.template,
        input.filters,
        input.columns,
        input.format
      );
      return result;
    }),

  /**
   * Validate export configuration without fetching data
   * Quick validation for UI feedback
   */
  validateExportConfig: protectedProcedure
    .input(
      z.object({
        template: z.string(),
        filters: z.array(exportFilterSchema),
        columns: z.array(exportColumnSchema),
      })
    )
    .query(async ({ input }) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Validate filters
      for (const filter of input.filters) {
        if (!filter.field || !filter.operator) {
          errors.push(`Invalid filter: missing field or operator`);
        }

        if (filter.operator === "between" && !Array.isArray(filter.value)) {
          errors.push(`Filter "${filter.field}": 'between' operator requires array value`);
        }

        if (filter.operator === "in" && !Array.isArray(filter.value)) {
          errors.push(`Filter "${filter.field}": 'in' operator requires array value`);
        }
      }

      // Validate columns
      if (input.columns.length === 0) {
        warnings.push("No columns selected - all columns will be exported");
      }

      // Check for duplicate columns
      const columnFields = input.columns.map(c => c.field);
      const duplicates = columnFields.filter((field, index) => columnFields.indexOf(field) !== index);
      if (duplicates.length > 0) {
        warnings.push(`Duplicate columns detected: ${duplicates.join(", ")}`);
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };
    }),
});
