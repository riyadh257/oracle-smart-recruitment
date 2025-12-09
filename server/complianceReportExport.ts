/**
 * Compliance Report Export Service
 * Generate PDF and Excel reports for regulatory submissions
 */

import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { getDb } from "./db";
import { workPermits, employers, complianceAlerts } from "../drizzle/schema";
import { eq, and, lte, gte, desc } from "drizzle-orm";
import { validateIqamaStatus } from "./ksaCompliance";
import { calculateNitaqatBand } from "./saudization";

const execAsync = promisify(exec);

export interface ComplianceReportData {
  employerId: number;
  employerName: string;
  reportDate: Date;
  totalPermits: number;
  activePermits: number;
  expiredPermits: number;
  expiringWithin30Days: number;
  expiringWithin60Days: number;
  expiringWithin90Days: number;
  nitaqatBand: string;
  saudiEmployees: number;
  totalEmployees: number;
  saudizationRate: number;
  permits: Array<{
    permitNumber: string;
    employeeName: string;
    nationality: string;
    jobTitle: string;
    issueDate: Date;
    expiryDate: Date;
    status: string;
    daysUntilExpiry: number;
  }>;
  alerts: Array<{
    alertType: string;
    severity: string;
    message: string;
    createdAt: Date;
  }>;
}

/**
 * Generate compliance report data for an employer
 */
export async function generateComplianceReportData(
  employerId: number
): Promise<ComplianceReportData> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get employer info
  const [employer] = await db
    .select()
    .from(employers)
    .where(eq(employers.id, employerId))
    .limit(1);

  if (!employer) {
    throw new Error(`Employer ${employerId} not found`);
  }

  // Get all permits
  const permits = await db
    .select()
    .from(workPermits)
    .where(eq(workPermits.employerId, employerId));

  // Get recent alerts (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const alerts = await db
    .select()
    .from(complianceAlerts)
    .where(
      and(
        eq(complianceAlerts.employerId, employerId),
        gte(complianceAlerts.createdAt, thirtyDaysAgo)
      )
    )
    .orderBy(desc(complianceAlerts.createdAt));

  // Calculate statistics
  const now = new Date();
  let expiredCount = 0;
  let expiring30 = 0;
  let expiring60 = 0;
  let expiring90 = 0;

  const permitDetails = permits.map((permit) => {
    const validation = validateIqamaStatus(permit.permitNumber || "", permit.expiryDate);
    
    if (validation.daysUntilExpiry < 0) {
      expiredCount++;
    } else if (validation.daysUntilExpiry <= 30) {
      expiring30++;
    } else if (validation.daysUntilExpiry <= 60) {
      expiring60++;
    } else if (validation.daysUntilExpiry <= 90) {
      expiring90++;
    }

    return {
      permitNumber: permit.permitNumber || "",
      employeeName: permit.employeeName || "",
      nationality: permit.nationality || "",
      jobTitle: permit.jobTitle || "",
      issueDate: permit.issueDate,
      expiryDate: permit.expiryDate,
      status: validation.status,
      daysUntilExpiry: validation.daysUntilExpiry,
    };
  });

  // Calculate Nitaqat
  const saudiEmployees = employer.saudiEmployees || 0;
  const totalEmployees = employer.totalEmployees || 0;
  const saudizationRate = totalEmployees > 0 ? (saudiEmployees / totalEmployees) * 100 : 0;
  const nitaqatBand = calculateNitaqatBand(
    employer.sector || "other",
    totalEmployees,
    saudiEmployees
  );

  return {
    employerId,
    employerName: employer.companyName || "Unknown",
    reportDate: new Date(),
    totalPermits: permits.length,
    activePermits: permits.length - expiredCount,
    expiredPermits: expiredCount,
    expiringWithin30Days: expiring30,
    expiringWithin60Days: expiring60,
    expiringWithin90Days: expiring90,
    nitaqatBand,
    saudiEmployees,
    totalEmployees,
    saudizationRate,
    permits: permitDetails,
    alerts: alerts.map((alert) => ({
      alertType: alert.alertType,
      severity: alert.severity,
      message: alert.message,
      createdAt: alert.createdAt,
    })),
  };
}

/**
 * Generate PDF compliance report
 */
export async function generatePdfComplianceReport(
  employerId: number
): Promise<{ filePath: string; fileName: string }> {
  const reportData = await generateComplianceReportData(employerId);

  // Create markdown report
  const markdown = generateMarkdownReport(reportData);

  // Ensure reports directory exists
  const reportsDir = join(process.cwd(), "reports");
  await mkdir(reportsDir, { recursive: true });

  // Write markdown file
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const mdFileName = `compliance-report-${employerId}-${timestamp}.md`;
  const mdFilePath = join(reportsDir, mdFileName);
  await writeFile(mdFilePath, markdown, "utf-8");

  // Convert to PDF using manus-md-to-pdf
  const pdfFileName = mdFileName.replace(".md", ".pdf");
  const pdfFilePath = join(reportsDir, pdfFileName);

  try {
    await execAsync(`manus-md-to-pdf "${mdFilePath}" "${pdfFilePath}"`);
    console.log(`[Compliance Report] PDF generated: ${pdfFilePath}`);
  } catch (error) {
    console.error("[Compliance Report] PDF generation failed:", error);
    throw new Error("Failed to generate PDF report");
  }

  return {
    filePath: pdfFilePath,
    fileName: pdfFileName,
  };
}

/**
 * Generate Excel compliance report
 */
export async function generateExcelComplianceReport(
  employerId: number
): Promise<{ filePath: string; fileName: string }> {
  const reportData = await generateComplianceReportData(employerId);

  // Create CSV format (Excel-compatible)
  const csv = generateCsvReport(reportData);

  // Ensure reports directory exists
  const reportsDir = join(process.cwd(), "reports");
  await mkdir(reportsDir, { recursive: true });

  // Write CSV file
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const csvFileName = `compliance-report-${employerId}-${timestamp}.csv`;
  const csvFilePath = join(reportsDir, csvFileName);
  await writeFile(csvFilePath, csv, "utf-8");

  console.log(`[Compliance Report] Excel/CSV generated: ${csvFilePath}`);

  return {
    filePath: csvFilePath,
    fileName: csvFileName,
  };
}

/**
 * Generate markdown report content
 */
function generateMarkdownReport(data: ComplianceReportData): string {
  let md = `# Compliance Report\n\n`;
  md += `**Company:** ${data.employerName}  \n`;
  md += `**Report Date:** ${data.reportDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })}  \n`;
  md += `**Report ID:** ${data.employerId}-${Date.now()}\n\n`;

  md += `---\n\n`;

  md += `## Executive Summary\n\n`;
  md += `### Work Permit Status\n\n`;
  md += `| Metric | Count |\n`;
  md += `|--------|-------|\n`;
  md += `| Total Permits | ${data.totalPermits} |\n`;
  md += `| Active Permits | ${data.activePermits} |\n`;
  md += `| Expired Permits | ${data.expiredPermits} |\n`;
  md += `| Expiring within 30 days | ${data.expiringWithin30Days} |\n`;
  md += `| Expiring within 60 days | ${data.expiringWithin60Days} |\n`;
  md += `| Expiring within 90 days | ${data.expiringWithin90Days} |\n\n`;

  md += `### Nitaqat Compliance\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Nitaqat Band | **${data.nitaqatBand}** |\n`;
  md += `| Saudi Employees | ${data.saudiEmployees} |\n`;
  md += `| Total Employees | ${data.totalEmployees} |\n`;
  md += `| Saudization Rate | ${data.saudizationRate.toFixed(2)}% |\n\n`;

  md += `---\n\n`;

  md += `## Work Permit Details\n\n`;
  md += `| Permit Number | Employee Name | Nationality | Job Title | Expiry Date | Status | Days Until Expiry |\n`;
  md += `|---------------|---------------|-------------|-----------|-------------|--------|-------------------|\n`;

  for (const permit of data.permits) {
    md += `| ${permit.permitNumber} | ${permit.employeeName} | ${permit.nationality} | ${permit.jobTitle} | `;
    md += `${permit.expiryDate.toLocaleDateString()} | ${permit.status} | ${permit.daysUntilExpiry} |\n`;
  }

  md += `\n---\n\n`;

  md += `## Recent Compliance Alerts (Last 30 Days)\n\n`;
  
  if (data.alerts.length === 0) {
    md += `*No alerts in the last 30 days.*\n\n`;
  } else {
    md += `| Date | Type | Severity | Message |\n`;
    md += `|------|------|----------|----------|\n`;

    for (const alert of data.alerts) {
      md += `| ${alert.createdAt.toLocaleDateString()} | ${alert.alertType} | ${alert.severity} | ${alert.message} |\n`;
    }
    md += `\n`;
  }

  md += `---\n\n`;
  md += `## Recommendations\n\n`;

  if (data.expiredPermits > 0) {
    md += `- **URGENT:** ${data.expiredPermits} permit(s) have expired. Immediate renewal required to avoid penalties.\n`;
  }

  if (data.expiringWithin30Days > 0) {
    md += `- **HIGH PRIORITY:** ${data.expiringWithin30Days} permit(s) expiring within 30 days. Begin renewal process immediately.\n`;
  }

  if (data.expiringWithin60Days > 0) {
    md += `- **MEDIUM PRIORITY:** ${data.expiringWithin60Days} permit(s) expiring within 60 days. Prepare renewal documentation.\n`;
  }

  if (data.nitaqatBand === "Red") {
    md += `- **CRITICAL:** Your organization is in the Red Nitaqat band. Immediate action required to improve Saudization rate.\n`;
  } else if (data.nitaqatBand === "Yellow") {
    md += `- **WARNING:** Your organization is in the Yellow Nitaqat band. Consider hiring more Saudi nationals.\n`;
  }

  md += `\n---\n\n`;
  md += `*This report was generated automatically by Oracle Smart Recruitment System.*  \n`;
  md += `*For questions or support, contact your system administrator.*\n`;

  return md;
}

/**
 * Generate CSV report content
 */
function generateCsvReport(data: ComplianceReportData): string {
  let csv = `Compliance Report - ${data.employerName}\n`;
  csv += `Report Date,${data.reportDate.toISOString()}\n\n`;

  csv += `Summary Statistics\n`;
  csv += `Metric,Value\n`;
  csv += `Total Permits,${data.totalPermits}\n`;
  csv += `Active Permits,${data.activePermits}\n`;
  csv += `Expired Permits,${data.expiredPermits}\n`;
  csv += `Expiring within 30 days,${data.expiringWithin30Days}\n`;
  csv += `Expiring within 60 days,${data.expiringWithin60Days}\n`;
  csv += `Expiring within 90 days,${data.expiringWithin90Days}\n`;
  csv += `Nitaqat Band,${data.nitaqatBand}\n`;
  csv += `Saudi Employees,${data.saudiEmployees}\n`;
  csv += `Total Employees,${data.totalEmployees}\n`;
  csv += `Saudization Rate,${data.saudizationRate.toFixed(2)}%\n\n`;

  csv += `Work Permit Details\n`;
  csv += `Permit Number,Employee Name,Nationality,Job Title,Issue Date,Expiry Date,Status,Days Until Expiry\n`;

  for (const permit of data.permits) {
    csv += `${permit.permitNumber},`;
    csv += `"${permit.employeeName}",`;
    csv += `${permit.nationality},`;
    csv += `"${permit.jobTitle}",`;
    csv += `${permit.issueDate.toISOString().split("T")[0]},`;
    csv += `${permit.expiryDate.toISOString().split("T")[0]},`;
    csv += `${permit.status},`;
    csv += `${permit.daysUntilExpiry}\n`;
  }

  csv += `\nRecent Compliance Alerts\n`;
  csv += `Date,Type,Severity,Message\n`;

  for (const alert of data.alerts) {
    csv += `${alert.createdAt.toISOString().split("T")[0]},`;
    csv += `${alert.alertType},`;
    csv += `${alert.severity},`;
    csv += `"${alert.message}"\n`;
  }

  return csv;
}
