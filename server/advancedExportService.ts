import { getDb } from "./db";
import { scheduledExports, scheduledExportRuns } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Advanced Export Service
 * Provides custom filter builders and scheduled export management
 */

export interface ExportFilter {
  field: string;
  operator: "equals" | "contains" | "greaterThan" | "lessThan" | "between" | "in";
  value: any;
}

export interface ExportColumn {
  field: string;
  label: string;
  format?: string; // e.g., "date", "currency", "percentage"
}

export interface ScheduledExportConfig {
  name: string;
  description?: string;
  exportTemplate:
    | "candidates"
    | "interviews"
    | "feedback"
    | "analytics"
    | "campaigns"
    | "jobs"
    | "applications"
    | "custom";
  exportFormat: "csv" | "pdf" | "excel";
  schedule: "daily" | "weekly" | "monthly" | "custom";
  cronExpression?: string;
  timezone?: string;
  filters: ExportFilter[];
  columns: ExportColumn[];
  emailRecipients: string[];
  emailSubject?: string;
  emailBody?: string;
}

/**
 * Validate export filters
 */
export function validateFilters(filters: ExportFilter[]): boolean {
  for (const filter of filters) {
    if (!filter.field || !filter.operator) {
      return false;
    }

    // Validate value based on operator
    if (filter.operator === "between" && !Array.isArray(filter.value)) {
      return false;
    }

    if (filter.operator === "in" && !Array.isArray(filter.value)) {
      return false;
    }
  }

  return true;
}

/**
 * Build SQL WHERE clause from filters
 */
export function buildWhereClause(
  filters: ExportFilter[],
  tableAlias: string = ""
): string {
  if (filters.length === 0) return "1=1";

  const conditions = filters.map((filter) => {
    const field = tableAlias ? `${tableAlias}.${filter.field}` : filter.field;

    switch (filter.operator) {
      case "equals":
        return `${field} = ${JSON.stringify(filter.value)}`;
      case "contains":
        return `${field} LIKE ${JSON.stringify(`%${filter.value}%`)}`;
      case "greaterThan":
        return `${field} > ${JSON.stringify(filter.value)}`;
      case "lessThan":
        return `${field} < ${JSON.stringify(filter.value)}`;
      case "between":
        return `${field} BETWEEN ${JSON.stringify(filter.value[0])} AND ${JSON.stringify(filter.value[1])}`;
      case "in":
        return `${field} IN (${filter.value.map((v: any) => JSON.stringify(v)).join(", ")})`;
      default:
        return "1=1";
    }
  });

  return conditions.join(" AND ");
}

/**
 * Get available filter fields for a template
 */
export function getAvailableFilterFields(
  template: string
): Array<{ field: string; label: string; type: string }> {
  const fieldMaps: Record<
    string,
    Array<{ field: string; label: string; type: string }>
  > = {
    candidates: [
      { field: "name", label: "Name", type: "string" },
      { field: "email", label: "Email", type: "string" },
      { field: "phone", label: "Phone", type: "string" },
      { field: "location", label: "Location", type: "string" },
      { field: "status", label: "Status", type: "enum" },
      { field: "createdAt", label: "Created Date", type: "date" },
      { field: "aiScreeningScore", label: "AI Screening Score", type: "number" },
    ],
    interviews: [
      { field: "candidateName", label: "Candidate Name", type: "string" },
      { field: "interviewerName", label: "Interviewer Name", type: "string" },
      { field: "scheduledAt", label: "Scheduled Date", type: "date" },
      { field: "status", label: "Status", type: "enum" },
      { field: "type", label: "Interview Type", type: "enum" },
    ],
    feedback: [
      { field: "candidateName", label: "Candidate Name", type: "string" },
      { field: "interviewerName", label: "Interviewer Name", type: "string" },
      { field: "recommendation", label: "Recommendation", type: "enum" },
      { field: "overallScore", label: "Overall Score", type: "number" },
      { field: "submittedAt", label: "Submitted Date", type: "date" },
    ],
    campaigns: [
      { field: "name", label: "Campaign Name", type: "string" },
      { field: "status", label: "Status", type: "enum" },
      { field: "sentAt", label: "Sent Date", type: "date" },
      { field: "openRate", label: "Open Rate", type: "number" },
      { field: "clickRate", label: "Click Rate", type: "number" },
    ],
    jobs: [
      { field: "title", label: "Job Title", type: "string" },
      { field: "department", label: "Department", type: "string" },
      { field: "location", label: "Location", type: "string" },
      { field: "status", label: "Status", type: "enum" },
      { field: "postedAt", label: "Posted Date", type: "date" },
    ],
    applications: [
      { field: "candidateName", label: "Candidate Name", type: "string" },
      { field: "jobTitle", label: "Job Title", type: "string" },
      { field: "status", label: "Status", type: "enum" },
      { field: "appliedAt", label: "Applied Date", type: "date" },
      { field: "matchScore", label: "Match Score", type: "number" },
    ],
  };

  return fieldMaps[template] || [];
}

/**
 * Get available columns for a template
 */
export function getAvailableColumns(
  template: string
): Array<{ field: string; label: string; format?: string }> {
  const columnMaps: Record<
    string,
    Array<{ field: string; label: string; format?: string }>
  > = {
    candidates: [
      { field: "id", label: "ID" },
      { field: "name", label: "Name" },
      { field: "email", label: "Email" },
      { field: "phone", label: "Phone" },
      { field: "location", label: "Location" },
      { field: "status", label: "Status" },
      { field: "aiScreeningScore", label: "AI Score", format: "percentage" },
      { field: "createdAt", label: "Created Date", format: "date" },
    ],
    interviews: [
      { field: "id", label: "ID" },
      { field: "candidateName", label: "Candidate" },
      { field: "interviewerName", label: "Interviewer" },
      { field: "scheduledAt", label: "Scheduled", format: "date" },
      { field: "status", label: "Status" },
      { field: "type", label: "Type" },
      { field: "location", label: "Location" },
    ],
    feedback: [
      { field: "id", label: "ID" },
      { field: "candidateName", label: "Candidate" },
      { field: "interviewerName", label: "Interviewer" },
      { field: "recommendation", label: "Recommendation" },
      { field: "overallScore", label: "Score", format: "percentage" },
      { field: "submittedAt", label: "Submitted", format: "date" },
    ],
    campaigns: [
      { field: "id", label: "ID" },
      { field: "name", label: "Campaign Name" },
      { field: "status", label: "Status" },
      { field: "sentAt", label: "Sent Date", format: "date" },
      { field: "recipientCount", label: "Recipients" },
      { field: "openRate", label: "Open Rate", format: "percentage" },
      { field: "clickRate", label: "Click Rate", format: "percentage" },
    ],
  };

  return columnMaps[template] || [];
}

/**
 * Create scheduled export
 */
export async function createScheduledExport(
  config: ScheduledExportConfig,
  createdBy: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Validate filters
  if (!validateFilters(config.filters)) {
    throw new Error("Invalid filters provided");
  }

  // Calculate next run time based on schedule
  const nextRunAt = calculateNextRunTime(
    config.schedule,
    config.cronExpression,
    config.timezone
  );

  const result = await db.insert(scheduledExports).values({
    name: config.name,
    description: config.description || null,
    exportTemplate: config.exportTemplate,
    exportFormat: config.exportFormat,
    schedule: config.schedule,
    cronExpression: config.cronExpression || null,
    timezone: config.timezone || "Asia/Riyadh",
    filters: JSON.stringify(config.filters),
    columns: JSON.stringify(config.columns),
    emailRecipients: JSON.stringify(config.emailRecipients),
    emailSubject: config.emailSubject || null,
    emailBody: config.emailBody || null,
    includeAttachment: 1,
    nextRunAt: nextRunAt?.toISOString() || null,
    isActive: 1,
    createdBy,
  });

  return { id: Number(result.insertId), success: true };
}

/**
 * Calculate next run time based on schedule
 */
function calculateNextRunTime(
  schedule: string,
  cronExpression?: string,
  timezone?: string
): Date | null {
  const now = new Date();

  switch (schedule) {
    case "daily":
      // Run at 9 AM next day
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow;

    case "weekly":
      // Run next Monday at 9 AM
      const nextMonday = new Date(now);
      const daysUntilMonday = (8 - nextMonday.getDay()) % 7 || 7;
      nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
      nextMonday.setHours(9, 0, 0, 0);
      return nextMonday;

    case "monthly":
      // Run first day of next month at 9 AM
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);
      nextMonth.setHours(9, 0, 0, 0);
      return nextMonth;

    case "custom":
      // Parse cron expression (simplified - would use a library in production)
      return null;

    default:
      return null;
  }
}

/**
 * Get scheduled exports
 */
export async function getScheduledExports(userId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const exports = await db
    .select()
    .from(scheduledExports)
    .where(userId ? eq(scheduledExports.createdBy, userId) : undefined)
    .orderBy(desc(scheduledExports.createdAt));

  return exports.map((exp) => ({
    ...exp,
    filters: exp.filters ? JSON.parse(exp.filters as string) : [],
    columns: exp.columns ? JSON.parse(exp.columns as string) : [],
    emailRecipients: exp.emailRecipients
      ? JSON.parse(exp.emailRecipients as string)
      : [],
  }));
}

/**
 * Get export run history
 */
export async function getExportRunHistory(scheduledExportId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const runs = await db
    .select()
    .from(scheduledExportRuns)
    .where(eq(scheduledExportRuns.scheduledExportId, scheduledExportId))
    .orderBy(desc(scheduledExportRuns.createdAt))
    .limit(50);

  return runs;
}
