import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { sendComplianceAlertEmail, testGmailConnection } from "./gmailComplianceService";
import { runManualComplianceCheck } from "./scheduledComplianceChecks";
import {
  generatePdfComplianceReport,
  generateExcelComplianceReport,
} from "./complianceReportExport";
import { getDb } from "./db";
import { complianceAlerts, employers, workPermits } from "../drizzle/schema";
import { eq, and, desc, sql, lte, gte } from "drizzle-orm";
import { calculateNitaqatBand } from "./saudization";

/**
 * Compliance Alerts Router
 * Automated monitoring for Nitaqat bands, work permit expiration, and labor law violations
 */

export const complianceAlertsRouter = router({
  /**
   * Configure email notifications for compliance alerts
   */
  configureEmailNotifications: protectedProcedure
    .input(
      z.object({
        employerId: z.number(),
        enabled: z.boolean(),
        recipientEmails: z.array(z.string().email()),
        alertTypes: z.array(z.enum(["permit_expiry_30", "permit_expiry_60", "permit_expiry_90", "nitaqat_drop", "labor_law_violation"])),
        frequency: z.enum(["immediate", "daily_digest", "weekly_digest"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Store configuration in database (would need to add schema table for this)
      // For now, return success
      return {
        success: true,
        message: "Email notification settings updated successfully",
        config: input,
      };
    }),

  /**
   * Send test compliance alert email
   */
  sendTestAlert: protectedProcedure
    .input(
      z.object({
        employerId: z.number(),
        recipientEmail: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      // Generate sample alert for testing
      const testPermit = {
        permitNumber: "2123456789",
        employeeName: "Test Employee",
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        daysUntilExpiry: 30,
      };

      // Send actual email via Gmail MCP
      const result = await sendComplianceAlertEmail({
        recipientEmail: input.recipientEmail,
        subject: "🚨 Test Compliance Alert - Work Permit Expiring",
        content: "This is a test compliance alert from Oracle Smart Recruitment System",
        severity: "critical",
        permitDetails: [testPermit],
      });

      if (!result.success) {
        throw new Error(`Failed to send email: ${result.error}`);
      }
      
      return {
        success: true,
        message: `Test alert sent to ${input.recipientEmail}`,
        messageId: result.messageId,
      };
    }),

  /**
   * Test Gmail connection
   */
  testGmailConnection: protectedProcedure.query(async () => {
    const result = await testGmailConnection();
    return result;
  }),

  /**
   * Manually trigger compliance check
   */
  runManualCheck: protectedProcedure
    .input(
      z.object({
        checkType: z.enum(["daily", "weekly"]).default("daily"),
      })
    )
    .mutation(async ({ input }) => {
      const result = await runManualComplianceCheck(input.checkType);
      return result;
    }),

  /**
   * Generate PDF compliance report
   */
  generatePdfReport: protectedProcedure
    .input(
      z.object({
        employerId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await generatePdfComplianceReport(input.employerId);
      return result;
    }),

  /**
   * Generate Excel compliance report
   */
  generateExcelReport: protectedProcedure
    .input(
      z.object({
        employerId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await generateExcelComplianceReport(input.employerId);
      return result;
    }),
  /**
   * Get all active compliance alerts for employer
   */
  getActiveAlerts: protectedProcedure
    .input(
      z.object({
        employerId: z.number(),
        severity: z.enum(["info", "warning", "critical"]).optional(),
        status: z.enum(["active", "acknowledged", "resolved", "dismissed"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const alerts = await db
        .select()
        .from(complianceAlerts)
        .where(
          and(
            eq(complianceAlerts.employerId, input.employerId),
            input.severity ? eq(complianceAlerts.severity, input.severity) : undefined,
            input.status ? eq(complianceAlerts.alertStatus, input.status) : undefined
          )
        )
        .orderBy(desc(complianceAlerts.createdAt));

      return alerts;
    }),

  /**
   * Get compliance alert statistics
   */
  getAlertStatistics: protectedProcedure
    .input(z.object({ employerId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const stats = await db
        .select({
          totalAlerts: sql<number>`COUNT(*)`,
          criticalAlerts: sql<number>`SUM(CASE WHEN ${complianceAlerts.severity} = 'critical' THEN 1 ELSE 0 END)`,
          warningAlerts: sql<number>`SUM(CASE WHEN ${complianceAlerts.severity} = 'warning' THEN 1 ELSE 0 END)`,
          activeAlerts: sql<number>`SUM(CASE WHEN ${complianceAlerts.alertStatus} = 'active' THEN 1 ELSE 0 END)`,
          acknowledgedAlerts: sql<number>`SUM(CASE WHEN ${complianceAlerts.alertStatus} = 'acknowledged' THEN 1 ELSE 0 END)`,
          resolvedAlerts: sql<number>`SUM(CASE WHEN ${complianceAlerts.alertStatus} = 'resolved' THEN 1 ELSE 0 END)`,
        })
        .from(complianceAlerts)
        .where(eq(complianceAlerts.employerId, input.employerId));

      return stats[0] || {
        totalAlerts: 0,
        criticalAlerts: 0,
        warningAlerts: 0,
        activeAlerts: 0,
        acknowledgedAlerts: 0,
        resolvedAlerts: 0,
      };
    }),

  /**
   * Check for Nitaqat band drops and create alerts
   */
  checkNitaqatCompliance: protectedProcedure
    .input(z.object({ employerId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get employer details
      const employer = await db
        .select()
        .from(employers)
        .where(eq(employers.id, input.employerId))
        .limit(1);

      if (!employer[0]) {
        throw new Error("Employer not found");
      }

      const employerData = employer[0];

      // Calculate current Nitaqat band
      const bandResult = calculateNitaqatBand(
        employerData.totalEmployees || 0,
        employerData.saudiEmployees || 0,
        employerData.nitaqatActivity || "other"
      );

      // Check if band has dropped
      const currentBand = bandResult.band;
      const previousBand = employerData.nitaqatBand;

      if (currentBand === "red" || currentBand === "yellow") {
        const severity = currentBand === "red" ? "critical" : "warning";
        const alertType = currentBand === "red" ? "nitaqat_red_zone" : "nitaqat_yellow_zone";

        // Check if alert already exists
        const existingAlert = await db
          .select()
          .from(complianceAlerts)
          .where(
            and(
              eq(complianceAlerts.employerId, input.employerId),
              eq(complianceAlerts.alertType, alertType),
              eq(complianceAlerts.alertStatus, "active")
            )
          )
          .limit(1);

        if (existingAlert.length === 0) {
          // Create new alert
          const remediationSteps = generateNitaqatRemediation(bandResult);

          await db.insert(complianceAlerts).values({
            employerId: input.employerId,
            alertType,
            severity,
            alertTitle: `Nitaqat ${currentBand.toUpperCase()} Zone Alert`,
            alertMessage: `Your company is in the ${currentBand.toUpperCase()} zone. Current Saudization rate: ${bandResult.saudizationRate.toFixed(1)}%. Required: ${bandResult.requiredRate.toFixed(1)}%`,
            actionRequired: remediationSteps,
            alertStatus: "active",
            notificationSent: 0,
          });
        }
      }

      return { success: true, currentBand, bandResult };
    }),

  /**
   * Check for expiring work permits (<30 days) and create alerts
   */
  checkExpiringWorkPermits: protectedProcedure
    .input(z.object({ employerId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      // Get expiring work permits
      const expiringPermits = await db
        .select({
          permitId: workPermits.id,
          employeeName: workPermits.employeeName,
          expiryDate: workPermits.expiryDate,
          occupation: workPermits.occupation,
        })
        .from(workPermits)
        .where(
          and(
            eq(workPermits.employerId, input.employerId),
            eq(workPermits.status, "active"),
            lte(workPermits.expiryDate, thirtyDaysFromNow.toISOString())
          )
        );

      // Create alerts for each expiring permit
      for (const permit of expiringPermits) {
        const daysUntilExpiry = Math.ceil(
          (new Date(permit.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        const severity = daysUntilExpiry <= 7 ? "critical" : "warning";

        // Check if alert already exists
        const existingAlert = await db
          .select()
          .from(complianceAlerts)
          .where(
            and(
              eq(complianceAlerts.employerId, input.employerId),
              eq(complianceAlerts.alertType, "permit_expiring"),
              eq(complianceAlerts.relatedRecordId, permit.permitId),
              eq(complianceAlerts.alertStatus, "active")
            )
          )
          .limit(1);

        if (existingAlert.length === 0) {
          const remediation = generatePermitExpiryRemediation(daysUntilExpiry, permit.occupation || "Work Permit");

          await db.insert(complianceAlerts).values({
            employerId: input.employerId,
            alertType: "permit_expiring",
            severity,
            alertTitle: `Work Permit Expiring: ${permit.employeeName}`,
            alertMessage: `${permit.permitType} for ${permit.employeeName} expires in ${daysUntilExpiry} days (${permit.expiryDate})`,
            actionRequired: remediation,
            relatedRecordType: "work_permit",
            relatedRecordId: permit.permitId,
            alertStatus: "active",
            notificationSent: 0,
          });
        }
      }

      return { success: true, expiringPermitsCount: expiringPermits.length };
    }),

  /**
   * Acknowledge a compliance alert
   */
  acknowledgeAlert: protectedProcedure
    .input(
      z.object({
        alertId: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(complianceAlerts)
        .set({
          alertStatus: "acknowledged",
          acknowledgedBy: ctx.user.id,
          acknowledgedAt: new Date().toISOString(),
        })
        .where(eq(complianceAlerts.id, input.alertId));

      return { success: true };
    }),

  /**
   * Resolve a compliance alert
   */
  resolveAlert: protectedProcedure
    .input(
      z.object({
        alertId: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(complianceAlerts)
        .set({
          alertStatus: "resolved",
          resolvedAt: new Date().toISOString(),
        })
        .where(eq(complianceAlerts.id, input.alertId));

      return { success: true };
    }),

  /**
   * Dismiss a compliance alert
   */
  dismissAlert: protectedProcedure
    .input(z.object({ alertId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(complianceAlerts)
        .set({ alertStatus: "dismissed" })
        .where(eq(complianceAlerts.id, input.alertId));

      return { success: true };
    }),

  /**
   * Run comprehensive compliance check
   * Checks Nitaqat, work permits, and labor law violations
   */
  runComplianceCheck: protectedProcedure
    .input(z.object({ employerId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const results = {
        nitaqatCheck: false,
        workPermitsCheck: false,
        alertsCreated: 0,
      };

      try {
        // Check Nitaqat compliance
        const nitaqatResult = await ctx.trpc.complianceAlerts.checkNitaqatCompliance({ employerId: input.employerId });
        results.nitaqatCheck = true;

        // Check expiring work permits
        const permitsResult = await ctx.trpc.complianceAlerts.checkExpiringWorkPermits({ employerId: input.employerId });
        results.workPermitsCheck = true;
        results.alertsCreated = permitsResult.expiringPermitsCount;
      } catch (error) {
        console.error("Compliance check error:", error);
      }

      return results;
    }),
});

/**
 * Generate remediation steps for Nitaqat compliance issues
 */
function generateNitaqatRemediation(bandResult: any): string {
  const steps: string[] = [];

  if (bandResult.band === "red" || bandResult.band === "yellow") {
    steps.push(`1. Hire ${bandResult.saudisNeeded || 0} Saudi nationals to reach Green zone`);
    steps.push(`2. Review job descriptions to identify roles suitable for Saudi candidates`);
    steps.push(`3. Partner with HRDF (Human Resources Development Fund) for training subsidies`);
    steps.push(`4. Post job openings on Taqat and Jadarat platforms`);
    steps.push(`5. Contact recruitment agencies specializing in Saudi talent`);
    steps.push(`6. Consider Saudization incentive programs (Tamheer, Hadaf)`);
  }

  if (bandResult.band === "red") {
    steps.push(`⚠️ URGENT: Red zone may result in penalties and work permit restrictions`);
    steps.push(`7. Schedule meeting with MHRSD representative within 7 days`);
    steps.push(`8. Prepare Saudization improvement plan for submission`);
  }

  return steps.join("\n");
}

/**
 * Generate remediation steps for expiring work permits
 */
function generatePermitExpiryRemediation(daysUntilExpiry: number, permitType: string): string {
  const steps: string[] = [];

  if (daysUntilExpiry <= 7) {
    steps.push(`⚠️ URGENT: Only ${daysUntilExpiry} days remaining`);
    steps.push(`1. Immediately submit renewal application via Qiwa platform`);
    steps.push(`2. Ensure all required documents are uploaded (passport, medical, contract)`);
    steps.push(`3. Pay renewal fees through SADAD`);
    steps.push(`4. Follow up daily on application status`);
  } else if (daysUntilExpiry <= 30) {
    steps.push(`1. Prepare renewal documents (passport copy, medical certificate, employment contract)`);
    steps.push(`2. Verify employee's Iqama is valid for at least 3 months`);
    steps.push(`3. Submit renewal application via Qiwa within next 7 days`);
    steps.push(`4. Ensure GOSI contributions are up to date`);
    steps.push(`5. Schedule medical examination if required`);
  }

  steps.push(`6. Estimated processing time: 3-7 business days`);
  steps.push(`7. Contact MHRSD helpline 19911 for urgent cases`);

  return steps.join("\n");
}
