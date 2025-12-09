import { getDb } from "./db";
import { candidates, interviews, interviewFeedback, emailCampaigns, campaignAnalytics } from "../drizzle/schema";
import { ExportFilter, ExportColumn } from "./advancedExportService";
import { eq, and, gte, lte, like, inArray, sql } from "drizzle-orm";

/**
 * Export Preview Service
 * Provides live data preview before scheduling exports for validation
 */

export interface ExportPreviewResult {
  success: boolean;
  data: any[];
  totalCount: number;
  estimatedSize: number; // in bytes
  warnings: string[];
  sampleRows: any[];
}

/**
 * Build Drizzle WHERE conditions from filters
 */
function buildDrizzleConditions(filters: ExportFilter[], table: any): any[] {
  const conditions: any[] = [];

  for (const filter of filters) {
    const column = table[filter.field];
    if (!column) continue;

    switch (filter.operator) {
      case "equals":
        conditions.push(eq(column, filter.value));
        break;
      case "contains":
        conditions.push(like(column, `%${filter.value}%`));
        break;
      case "greaterThan":
        conditions.push(gte(column, filter.value));
        break;
      case "lessThan":
        conditions.push(lte(column, filter.value));
        break;
      case "between":
        if (Array.isArray(filter.value) && filter.value.length === 2) {
          conditions.push(and(gte(column, filter.value[0]), lte(column, filter.value[1])));
        }
        break;
      case "in":
        if (Array.isArray(filter.value)) {
          conditions.push(inArray(column, filter.value));
        }
        break;
    }
  }

  return conditions;
}

/**
 * Extract selected columns from data rows
 */
function extractColumns(rows: any[], columns: ExportColumn[]): any[] {
  if (columns.length === 0) return rows;

  return rows.map(row => {
    const extracted: any = {};
    for (const col of columns) {
      if (row[col.field] !== undefined) {
        extracted[col.label || col.field] = row[col.field];
      }
    }
    return extracted;
  });
}

/**
 * Estimate export file size based on data
 */
function estimateFileSize(data: any[], format: string): number {
  const jsonSize = JSON.stringify(data).length;
  
  // Rough estimates based on format
  switch (format) {
    case "csv":
      return jsonSize * 0.7; // CSV is typically smaller
    case "excel":
      return jsonSize * 1.2; // Excel has overhead
    case "pdf":
      return jsonSize * 2.5; // PDF has significant overhead
    default:
      return jsonSize;
  }
}

/**
 * Validate filters and generate warnings
 */
function validateAndWarn(filters: ExportFilter[], columns: ExportColumn[], totalCount: number): string[] {
  const warnings: string[] = [];

  // Check for empty results
  if (totalCount === 0) {
    warnings.push("No data matches the current filters. Export will be empty.");
  }

  // Check for very large exports
  if (totalCount > 10000) {
    warnings.push(`Large export detected (${totalCount} rows). Consider adding more filters to reduce size.`);
  }

  // Check for missing columns
  if (columns.length === 0) {
    warnings.push("No columns selected. All available columns will be exported.");
  }

  // Check for potentially slow filters
  const containsFilters = filters.filter(f => f.operator === "contains");
  if (containsFilters.length > 3) {
    warnings.push("Multiple 'contains' filters may slow down export. Consider using exact matches where possible.");
  }

  return warnings;
}

/**
 * Preview export data for candidates template
 */
async function previewCandidatesExport(
  filters: ExportFilter[],
  columns: ExportColumn[]
): Promise<ExportPreviewResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = buildDrizzleConditions(filters, candidates);
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(candidates)
    .where(whereClause);
  const totalCount = countResult[0]?.count || 0;

  // Get sample data (first 10 rows)
  const sampleData = await db
    .select()
    .from(candidates)
    .where(whereClause)
    .limit(10);

  const extractedSample = extractColumns(sampleData, columns);
  const estimatedSize = estimateFileSize(extractedSample, "csv") * (totalCount / Math.max(sampleData.length, 1));
  const warnings = validateAndWarn(filters, columns, totalCount);

  return {
    success: true,
    data: extractedSample,
    totalCount,
    estimatedSize: Math.round(estimatedSize),
    warnings,
    sampleRows: extractedSample.slice(0, 5),
  };
}

/**
 * Preview export data for interviews template
 */
async function previewInterviewsExport(
  filters: ExportFilter[],
  columns: ExportColumn[]
): Promise<ExportPreviewResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = buildDrizzleConditions(filters, interviews);
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(interviews)
    .where(whereClause);
  const totalCount = countResult[0]?.count || 0;

  const sampleData = await db
    .select()
    .from(interviews)
    .where(whereClause)
    .limit(10);

  const extractedSample = extractColumns(sampleData, columns);
  const estimatedSize = estimateFileSize(extractedSample, "csv") * (totalCount / Math.max(sampleData.length, 1));
  const warnings = validateAndWarn(filters, columns, totalCount);

  return {
    success: true,
    data: extractedSample,
    totalCount,
    estimatedSize: Math.round(estimatedSize),
    warnings,
    sampleRows: extractedSample.slice(0, 5),
  };
}

/**
 * Preview export data for feedback template
 */
async function previewFeedbackExport(
  filters: ExportFilter[],
  columns: ExportColumn[]
): Promise<ExportPreviewResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = buildDrizzleConditions(filters, interviewFeedback);
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(interviewFeedback)
    .where(whereClause);
  const totalCount = countResult[0]?.count || 0;

  const sampleData = await db
    .select()
    .from(interviewFeedback)
    .where(whereClause)
    .limit(10);

  const extractedSample = extractColumns(sampleData, columns);
  const estimatedSize = estimateFileSize(extractedSample, "csv") * (totalCount / Math.max(sampleData.length, 1));
  const warnings = validateAndWarn(filters, columns, totalCount);

  return {
    success: true,
    data: extractedSample,
    totalCount,
    estimatedSize: Math.round(estimatedSize),
    warnings,
    sampleRows: extractedSample.slice(0, 5),
  };
}

/**
 * Preview export data for campaigns template
 */
async function previewCampaignsExport(
  filters: ExportFilter[],
  columns: ExportColumn[]
): Promise<ExportPreviewResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = buildDrizzleConditions(filters, emailCampaigns);
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(emailCampaigns)
    .where(whereClause);
  const totalCount = countResult[0]?.count || 0;

  const sampleData = await db
    .select()
    .from(emailCampaigns)
    .where(whereClause)
    .limit(10);

  const extractedSample = extractColumns(sampleData, columns);
  const estimatedSize = estimateFileSize(extractedSample, "csv") * (totalCount / Math.max(sampleData.length, 1));
  const warnings = validateAndWarn(filters, columns, totalCount);

  return {
    success: true,
    data: extractedSample,
    totalCount,
    estimatedSize: Math.round(estimatedSize),
    warnings,
    sampleRows: extractedSample.slice(0, 5),
  };
}

/**
 * Main export preview function
 */
export async function previewExport(
  template: string,
  filters: ExportFilter[],
  columns: ExportColumn[],
  format: string = "csv"
): Promise<ExportPreviewResult> {
  try {
    let result: ExportPreviewResult;

    switch (template) {
      case "candidates":
        result = await previewCandidatesExport(filters, columns);
        break;
      case "interviews":
        result = await previewInterviewsExport(filters, columns);
        break;
      case "feedback":
        result = await previewFeedbackExport(filters, columns);
        break;
      case "campaigns":
        result = await previewCampaignsExport(filters, columns);
        break;
      default:
        throw new Error(`Unsupported export template: ${template}`);
    }

    // Adjust size estimate based on format
    result.estimatedSize = estimateFileSize(result.data, format);

    return result;
  } catch (error) {
    console.error("Export preview error:", error);
    return {
      success: false,
      data: [],
      totalCount: 0,
      estimatedSize: 0,
      warnings: [`Error generating preview: ${error instanceof Error ? error.message : "Unknown error"}`],
      sampleRows: [],
    };
  }
}
