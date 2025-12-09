import { getDb } from "./db";
import { applications, jobs, candidates, employers, billingRecords } from "../drizzle/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { storagePut } from "../storage";

/**
 * Custom Report Builder & Historical Archive System
 * Allows employers to create custom reports and stores them for historical access
 */

export interface ReportConfig {
  name: string;
  description?: string;
  reportType: "hiring_funnel" | "time_to_hire" | "source_effectiveness" | "billing" | "custom";
  dateRange: {
    start: Date;
    end: Date;
  };
  metrics: string[];
  filters?: Record<string, any>;
  groupBy?: string[];
}

export interface ReportData {
  config: ReportConfig;
  data: any[];
  summary: Record<string, any>;
  generatedAt: Date;
}

/**
 * Generate hiring funnel report
 */
async function generateHiringFunnelReport(
  employerId: number,
  startDate: Date,
  endDate: Date
): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all applications in date range
  const apps = await db
    .select()
    .from(applications)
    .where(
      and(
        eq(applications.employerId, employerId),
        gte(applications.createdAt, startDate),
        lte(applications.createdAt, endDate)
      )
    );

  // Calculate funnel stages
  const funnel = {
    total_applications: apps.length,
    screening: apps.filter((a) => a.status === "screening").length,
    interviewing: apps.filter((a) => a.status === "interviewing").length,
    offered: apps.filter((a) => a.status === "offered").length,
    rejected: apps.filter((a) => a.status === "rejected").length,
    conversion_rate: {
      screening_to_interview:
        apps.length > 0
          ? ((apps.filter((a) => a.status === "interviewing" || a.status === "offered").length / apps.length) * 100).toFixed(2)
          : "0.00",
      interview_to_offer:
        apps.filter((a) => a.status === "interviewing").length > 0
          ? (
              (apps.filter((a) => a.status === "offered").length /
                apps.filter((a) => a.status === "interviewing" || a.status === "offered").length) *
              100
            ).toFixed(2)
          : "0.00",
    },
  };

  return funnel;
}

/**
 * Generate time-to-hire report
 */
async function generateTimeToHireReport(
  employerId: number,
  startDate: Date,
  endDate: Date
): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get hired applications
  const hiredApps = await db
    .select()
    .from(applications)
    .where(
      and(
        eq(applications.employerId, employerId),
        eq(applications.status, "offered"),
        gte(applications.createdAt, startDate),
        lte(applications.createdAt, endDate)
      )
    );

  // Calculate time to hire (days from application to offer)
  const timesToHire = hiredApps.map((app) => {
    const days = Math.floor(
      (new Date(app.updatedAt).getTime() - new Date(app.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  });

  const avgTimeToHire =
    timesToHire.length > 0 ? (timesToHire.reduce((sum: any, t: any) => sum + t, 0) / timesToHire.length).toFixed(1) : "0";

  return {
    total_hires: hiredApps.length,
    average_time_to_hire_days: avgTimeToHire,
    fastest_hire_days: timesToHire.length > 0 ? Math.min(...timesToHire) : 0,
    slowest_hire_days: timesToHire.length > 0 ? Math.max(...timesToHire) : 0,
    time_distribution: {
      under_7_days: timesToHire.filter((t) => t < 7).length,
      "7_to_14_days": timesToHire.filter((t) => t >= 7 && t < 14).length,
      "14_to_30_days": timesToHire.filter((t) => t >= 14 && t < 30).length,
      over_30_days: timesToHire.filter((t) => t >= 30).length,
    },
  };
}

/**
 * Generate billing report
 */
async function generateBillingReport(employerId: number, startDate: Date, endDate: Date): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const records = await db
    .select()
    .from(billingRecords)
    .where(
      and(
        eq(billingRecords.employerId, employerId),
        gte(billingRecords.periodStart, startDate),
        lte(billingRecords.periodEnd, endDate)
      )
    )
    .orderBy(desc(billingRecords.periodStart));

  const totalBilled = records.reduce((sum: any, r: any) => sum + r.totalAmount, 0);
  const totalPaid = records.filter((r) => r.status === "paid").reduce((sum: any, r: any) => sum + r.totalAmount, 0);
  const totalPending = records.filter((r) => r.status === "pending").reduce((sum: any, r: any) => sum + r.totalAmount, 0);

  return {
    total_billed: totalBilled,
    total_paid: totalPaid,
    total_pending: totalPending,
    billing_records: records.map((r) => ({
      period: `${r.periodStart.toISOString().split("T")[0]} to ${r.periodEnd.toISOString().split("T")[0]}`,
      qualified_applications: r.qualifiedApplications,
      scheduled_interviews: r.scheduledInterviews,
      amount: r.totalAmount,
      status: r.status,
    })),
  };
}

/**
 * Generate custom report based on configuration
 */
export async function generateCustomReport(employerId: number, config: ReportConfig): Promise<ReportData> {
  let data: any = {};
  let summary: any = {};

  switch (config.reportType) {
    case "hiring_funnel":
      data = await generateHiringFunnelReport(employerId, config.dateRange.start, config.dateRange.end);
      summary = {
        total_applications: data.total_applications,
        conversion_rate: data.conversion_rate.screening_to_interview + "%",
      };
      break;

    case "time_to_hire":
      data = await generateTimeToHireReport(employerId, config.dateRange.start, config.dateRange.end);
      summary = {
        total_hires: data.total_hires,
        average_days: data.average_time_to_hire_days,
      };
      break;

    case "billing":
      data = await generateBillingReport(employerId, config.dateRange.start, config.dateRange.end);
      summary = {
        total_billed: data.total_billed,
        total_paid: data.total_paid,
      };
      break;

    default:
      throw new Error(`Unsupported report type: ${config.reportType}`);
  }

  return {
    config,
    data: Array.isArray(data) ? data : [data],
    summary,
    generatedAt: new Date(),
  };
}

/**
 * Export report to PDF format
 */
export async function exportReportToPDF(reportData: ReportData): Promise<Buffer> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      margin: 40px;
      color: #333;
    }
    .header {
      border-bottom: 3px solid #3B82F6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    h1 {
      color: #1E40AF;
      margin: 0;
    }
    .meta {
      color: #666;
      font-size: 14px;
      margin-top: 10px;
    }
    .summary {
      background-color: #F0F9FF;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .summary h2 {
      margin-top: 0;
      color: #1E40AF;
    }
    .metric {
      display: inline-block;
      margin-right: 30px;
      margin-bottom: 10px;
    }
    .metric-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
    }
    .metric-value {
      font-size: 24px;
      font-weight: bold;
      color: #3B82F6;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th {
      background-color: #3B82F6;
      color: white;
      padding: 12px;
      text-align: left;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #ddd;
    }
    tr:hover {
      background-color: #f5f5f5;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${reportData.config.name}</h1>
    <div class="meta">
      ${reportData.config.description || ""}
      <br>
      Generated: ${reportData.generatedAt.toLocaleString()}
      <br>
      Period: ${reportData.config.dateRange.start.toISOString().split("T")[0]} to ${reportData.config.dateRange.end.toISOString().split("T")[0]}
    </div>
  </div>

  <div class="summary">
    <h2>Summary</h2>
    ${Object.entries(reportData.summary)
      .map(
        ([key, value]) => `
      <div class="metric">
        <div class="metric-label">${key.replace(/_/g, " ")}</div>
        <div class="metric-value">${value}</div>
      </div>
    `
      )
      .join("")}
  </div>

  <h2>Detailed Data</h2>
  ${JSON.stringify(reportData.data, null, 2)
    .split("\n")
    .map((line) => `<div>${line}</div>`)
    .join("")}

  <div class="footer">
    <p>Oracle Smart Recruitment System - Custom Report</p>
    <p>This report is confidential and intended for internal use only.</p>
  </div>
</body>
</html>
  `;

  // Use WeasyPrint to convert HTML to PDF
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const execAsync = promisify(exec);
  const fs = await import("fs");
  const path = await import("path");
  const os = await import("os");

  const tempDir = os.tmpdir();
  const htmlPath = path.join(tempDir, `report-${Date.now()}.html`);
  const pdfPath = path.join(tempDir, `report-${Date.now()}.pdf`);

  fs.writeFileSync(htmlPath, html);

  try {
    await execAsync(`weasyprint ${htmlPath} ${pdfPath}`);
    const pdfBuffer = fs.readFileSync(pdfPath);

    fs.unlinkSync(htmlPath);
    fs.unlinkSync(pdfPath);

    return pdfBuffer;
  } catch (error) {
    console.error("PDF generation error:", error);
    throw new Error("Failed to generate report PDF");
  }
}

/**
 * Export report to CSV format
 */
export function exportReportToCSV(reportData: ReportData): string {
  const data = reportData.data;

  if (!Array.isArray(data) || data.length === 0) {
    return "No data available";
  }

  // Get all unique keys from all objects
  const keys = Array.from(new Set(data.flatMap((obj) => Object.keys(obj))));

  // Create CSV header
  const header = keys.join(",");

  // Create CSV rows
  const rows = data.map((obj) => {
    return keys
      .map((key) => {
        const value = obj[key];
        // Handle nested objects and arrays
        if (typeof value === "object") {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        // Escape commas and quotes
        return `"${String(value).replace(/"/g, '""')}"`;
      })
      .join(",");
  });

  return [header, ...rows].join("\n");
}

/**
 * Save report to historical archive
 */
export async function archiveReport(
  employerId: number,
  reportData: ReportData,
  format: "pdf" | "csv"
): Promise<{ url: string; fileKey: string }> {
  let fileBuffer: Buffer;
  let mimeType: string;
  let extension: string;

  if (format === "pdf") {
    fileBuffer = await exportReportToPDF(reportData);
    mimeType = "application/pdf";
    extension = "pdf";
  } else {
    const csvContent = exportReportToCSV(reportData);
    fileBuffer = Buffer.from(csvContent, "utf-8");
    mimeType = "text/csv";
    extension = "csv";
  }

  // Generate filename
  const timestamp = Date.now();
  const reportName = reportData.config.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const fileKey = `reports/${employerId}/${reportName}_${timestamp}.${extension}`;

  // Upload to S3
  const { url } = await storagePut(fileKey, fileBuffer, mimeType);

  return { url, fileKey };
}

/**
 * List archived reports for an employer
 * In production, this would query a reports table
 * For now, we'll return a simple structure
 */
export interface ArchivedReport {
  id: string;
  name: string;
  reportType: string;
  generatedAt: Date;
  format: string;
  url: string;
  fileKey: string;
}

// In-memory store for demo (in production, use database table)
const reportArchive: Map<number, ArchivedReport[]> = new Map();

export function addToArchive(employerId: number, report: ArchivedReport): void {
  const existing = reportArchive.get(employerId) || [];
  existing.push(report);
  reportArchive.set(employerId, existing);
}

export function getArchivedReports(employerId: number): ArchivedReport[] {
  return reportArchive.get(employerId) || [];
}
