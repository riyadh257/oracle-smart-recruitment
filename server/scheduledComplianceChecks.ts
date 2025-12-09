/**
 * Scheduled Compliance Checks
 * Automated daily/weekly cron jobs to scan for expiring permits and send alerts
 */

import cron from "node-cron";
import { getDb } from "./db";
import { workPermits, employers } from "../drizzle/schema";
import { and, eq, lte, gte } from "drizzle-orm";
import { validateIqamaStatus } from "./ksaCompliance";
import { sendComplianceAlertEmail, sendBulkComplianceAlerts } from "./gmailComplianceService";
import type { ComplianceEmailAlert } from "./gmailComplianceService";

/**
 * Daily compliance check - runs every day at 9:00 AM
 * Checks for permits expiring within 30 days (critical)
 */
export function scheduleDailyComplianceCheck() {
  // Run every day at 9:00 AM
  cron.schedule("0 9 * * *", async () => {
    console.log("[Scheduled Compliance] Running daily compliance check...");
    
    try {
      const alerts = await checkCriticalExpiringPermits();
      
      if (alerts.length > 0) {
        console.log(`[Scheduled Compliance] Found ${alerts.length} critical alerts`);
        const result = await sendBulkComplianceAlerts(alerts);
        console.log(`[Scheduled Compliance] Sent ${result.successful} emails, ${result.failed} failed`);
      } else {
        console.log("[Scheduled Compliance] No critical alerts found");
      }
    } catch (error) {
      console.error("[Scheduled Compliance] Daily check failed:", error);
    }
  });

  console.log("[Scheduled Compliance] Daily check scheduled (9:00 AM)");
}

/**
 * Weekly compliance check - runs every Monday at 8:00 AM
 * Checks for permits expiring within 90 days (all severities)
 */
export function scheduleWeeklyComplianceCheck() {
  // Run every Monday at 8:00 AM
  cron.schedule("0 8 * * 1", async () => {
    console.log("[Scheduled Compliance] Running weekly compliance check...");
    
    try {
      const alerts = await checkAllExpiringPermits();
      
      if (alerts.length > 0) {
        console.log(`[Scheduled Compliance] Found ${alerts.length} total alerts`);
        const result = await sendBulkComplianceAlerts(alerts);
        console.log(`[Scheduled Compliance] Sent ${result.successful} emails, ${result.failed} failed`);
      } else {
        console.log("[Scheduled Compliance] No alerts found");
      }
    } catch (error) {
      console.error("[Scheduled Compliance] Weekly check failed:", error);
    }
  });

  console.log("[Scheduled Compliance] Weekly check scheduled (Monday 8:00 AM)");
}

/**
 * Check for critical expiring permits (≤30 days)
 */
async function checkCriticalExpiringPermits(): Promise<ComplianceEmailAlert[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Scheduled Compliance] Database not available");
    return [];
  }

  const now = new Date();
  const criticalDate = new Date();
  criticalDate.setDate(criticalDate.getDate() + 30);

  // Get all permits expiring within 30 days
  const permits = await db
    .select()
    .from(workPermits)
    .where(
      and(
        lte(workPermits.expiryDate, criticalDate),
        gte(workPermits.expiryDate, now)
      )
    );

  // Group permits by employer
  const permitsByEmployer = new Map<number, typeof permits>();
  
  for (const permit of permits) {
    const employerPermits = permitsByEmployer.get(permit.employerId) || [];
    employerPermits.push(permit);
    permitsByEmployer.set(permit.employerId, employerPermits);
  }

  // Create alerts for each employer
  const alerts: ComplianceEmailAlert[] = [];

  for (const [employerId, employerPermits] of permitsByEmployer) {
    // Get employer email
    const [employer] = await db
      .select()
      .from(employers)
      .where(eq(employers.id, employerId))
      .limit(1);

    if (!employer || !employer.contactEmail) {
      console.warn(`[Scheduled Compliance] No email found for employer ${employerId}`);
      continue;
    }

    // Validate permits and create alert details
    const permitDetails = employerPermits.map((permit) => {
      const validation = validateIqamaStatus(permit.permitNumber || "", permit.expiryDate);
      return {
        permitNumber: permit.permitNumber || "",
        employeeName: permit.employeeName || "Unknown",
        expiryDate: permit.expiryDate,
        daysUntilExpiry: validation.daysUntilExpiry,
      };
    });

    // Determine severity
    const hasExpired = permitDetails.some((p) => p.daysUntilExpiry < 0);
    const hasCritical = permitDetails.some((p) => p.daysUntilExpiry >= 0 && p.daysUntilExpiry <= 30);

    const severity = hasExpired ? "critical" : hasCritical ? "critical" : "high";

    alerts.push({
      recipientEmail: employer.contactEmail,
      subject: `🚨 URGENT: ${permitDetails.length} Work Permit${permitDetails.length > 1 ? "s" : ""} Expiring Soon`,
      content: `Critical compliance alert for ${employer.companyName || "your organization"}`,
      severity,
      permitDetails,
    });
  }

  return alerts;
}

/**
 * Check for all expiring permits (≤90 days)
 */
async function checkAllExpiringPermits(): Promise<ComplianceEmailAlert[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Scheduled Compliance] Database not available");
    return [];
  }

  const now = new Date();
  const future90Days = new Date();
  future90Days.setDate(future90Days.getDate() + 90);

  // Get all permits expiring within 90 days
  const permits = await db
    .select()
    .from(workPermits)
    .where(
      and(
        lte(workPermits.expiryDate, future90Days),
        gte(workPermits.expiryDate, now)
      )
    );

  // Group permits by employer
  const permitsByEmployer = new Map<number, typeof permits>();
  
  for (const permit of permits) {
    const employerPermits = permitsByEmployer.get(permit.employerId) || [];
    employerPermits.push(permit);
    permitsByEmployer.set(permit.employerId, employerPermits);
  }

  // Create alerts for each employer
  const alerts: ComplianceEmailAlert[] = [];

  for (const [employerId, employerPermits] of permitsByEmployer) {
    // Get employer email
    const [employer] = await db
      .select()
      .from(employers)
      .where(eq(employers.id, employerId))
      .limit(1);

    if (!employer || !employer.contactEmail) {
      console.warn(`[Scheduled Compliance] No email found for employer ${employerId}`);
      continue;
    }

    // Validate permits and create alert details
    const permitDetails = employerPermits.map((permit) => {
      const validation = validateIqamaStatus(permit.permitNumber || "", permit.expiryDate);
      return {
        permitNumber: permit.permitNumber || "",
        employeeName: permit.employeeName || "Unknown",
        expiryDate: permit.expiryDate,
        daysUntilExpiry: validation.daysUntilExpiry,
      };
    });

    // Sort by days until expiry (most urgent first)
    permitDetails.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

    // Determine severity based on most urgent permit
    const mostUrgent = permitDetails[0];
    const severity = !mostUrgent
      ? "medium"
      : mostUrgent.daysUntilExpiry < 0
      ? "critical"
      : mostUrgent.daysUntilExpiry <= 30
      ? "critical"
      : mostUrgent.daysUntilExpiry <= 60
      ? "high"
      : "medium";

    const criticalCount = permitDetails.filter((p) => p.daysUntilExpiry <= 30).length;
    const highCount = permitDetails.filter((p) => p.daysUntilExpiry > 30 && p.daysUntilExpiry <= 60).length;

    let subject = "";
    if (criticalCount > 0) {
      subject = `🚨 URGENT: ${criticalCount} Critical Work Permit Alert${criticalCount > 1 ? "s" : ""}`;
    } else if (highCount > 0) {
      subject = `⚠️ ${highCount} Work Permit${highCount > 1 ? "s" : ""} Expiring Soon`;
    } else {
      subject = `ℹ️ Weekly Compliance Report: ${permitDetails.length} Upcoming Renewal${permitDetails.length > 1 ? "s" : ""}`;
    }

    alerts.push({
      recipientEmail: employer.contactEmail,
      subject,
      content: `Weekly compliance report for ${employer.companyName || "your organization"}`,
      severity,
      permitDetails,
    });
  }

  return alerts;
}

/**
 * Manual trigger for compliance check (for testing)
 */
export async function runManualComplianceCheck(
  checkType: "daily" | "weekly" = "daily"
): Promise<{
  alertsFound: number;
  emailsSent: number;
  emailsFailed: number;
}> {
  console.log(`[Manual Compliance Check] Running ${checkType} check...`);

  try {
    const alerts =
      checkType === "daily"
        ? await checkCriticalExpiringPermits()
        : await checkAllExpiringPermits();

    if (alerts.length === 0) {
      return {
        alertsFound: 0,
        emailsSent: 0,
        emailsFailed: 0,
      };
    }

    const result = await sendBulkComplianceAlerts(alerts);

    return {
      alertsFound: alerts.length,
      emailsSent: result.successful,
      emailsFailed: result.failed,
    };
  } catch (error) {
    console.error("[Manual Compliance Check] Failed:", error);
    throw error;
  }
}

/**
 * Initialize all scheduled compliance checks
 */
export function initializeScheduledComplianceChecks() {
  scheduleDailyComplianceCheck();
  scheduleWeeklyComplianceCheck();
  console.log("[Scheduled Compliance] All compliance checks initialized");
}
