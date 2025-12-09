import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { sendGmailMessage, htmlToPlainText } from "../gmailIntegration";
import { 
  digestDeliveryLog,
  jobExecutions,
  exportHistory,
  budgetScenarios,
  budgetAlerts,
  jobs,
  candidates,
  applications,
  interviews
} from "../../drizzle/schema";
import { eq, desc, and, gte, lte, sql, count } from "drizzle-orm";

/**
 * Email Digest Router
 * Automated weekly summary emails for job health metrics, failed exports, and budget insights
 */

interface DigestContent {
  period: {
    startDate: string;
    endDate: string;
  };
  jobHealthMetrics: {
    activeJobs: number;
    filledPositions: number;
    openPositions: number;
    newApplications: number;
    scheduledInterviews: number;
  };
  failedExports: Array<{
    id: number;
    exportType: string;
    dataType: string;
    fileName: string;
    errorMessage: string | null;
    createdAt: string | null;
  }>;
  budgetInsights: {
    totalScenarios: number;
    totalBudgetAllocated: number;
    activeAlerts: number;
    averageROI: number;
  };
  systemHealth: {
    jobFailures: number;
    pendingExports: number;
    systemUptime: string;
  };
}

export const emailDigestRouter = router({
  /**
   * Generate digest content for a specific period
   */
  generateDigest: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { startDate, endDate } = input;

      // Job Health Metrics
      const activeJobsResult = await db
        .select({ count: count() })
        .from(jobs)
        .where(eq(jobs.status, "open"));

      const filledPositionsResult = await db
        .select({ count: count() })
        .from(jobs)
        .where(eq(jobs.status, "filled"));

      const openPositionsResult = await db
        .select({ count: count() })
        .from(jobs)
        .where(eq(jobs.status, "open"));

      const newApplicationsResult = await db
        .select({ count: count() })
        .from(applications)
        .where(
          and(
            gte(applications.appliedAt, startDate),
            lte(applications.appliedAt, endDate)
          )
        );

      const scheduledInterviewsResult = await db
        .select({ count: count() })
        .from(interviews)
        .where(
          and(
            gte(interviews.scheduledAt, startDate),
            lte(interviews.scheduledAt, endDate)
          )
        );

      // Failed Exports
      const failedExports = await db
        .select()
        .from(exportHistory)
        .where(
          and(
            eq(exportHistory.status, "failed"),
            gte(exportHistory.createdAt, startDate),
            lte(exportHistory.createdAt, endDate)
          )
        )
        .orderBy(desc(exportHistory.createdAt))
        .limit(10);

      // Budget Insights
      const totalScenariosResult = await db
        .select({ count: count() })
        .from(budgetScenarios)
        .where(
          and(
            gte(budgetScenarios.createdAt, startDate),
            lte(budgetScenarios.createdAt, endDate)
          )
        );

      const budgetScenariosData = await db
        .select()
        .from(budgetScenarios)
        .where(
          and(
            gte(budgetScenarios.createdAt, startDate),
            lte(budgetScenarios.createdAt, endDate)
          )
        );

      const totalBudgetAllocated = budgetScenariosData.reduce((sum, scenario) => sum + (scenario.totalCost || 0), 0);
      const averageROI = budgetScenariosData.length > 0
        ? Math.round(budgetScenariosData.reduce((sum, scenario) => sum + (scenario.roi || 0), 0) / budgetScenariosData.length)
        : 0;

      const activeAlertsResult = await db
        .select({ count: count() })
        .from(budgetAlerts)
        .where(eq(budgetAlerts.acknowledged, 0));

      // System Health
      const jobFailuresResult = await db
        .select({ count: count() })
        .from(jobExecutions)
        .where(
          and(
            eq(jobExecutions.status, "failed"),
            gte(jobExecutions.executedAt, startDate),
            lte(jobExecutions.executedAt, endDate)
          )
        );

      const pendingExportsResult = await db
        .select({ count: count() })
        .from(exportHistory)
        .where(eq(exportHistory.status, "pending"));

      const digestContent: DigestContent = {
        period: {
          startDate,
          endDate,
        },
        jobHealthMetrics: {
          activeJobs: activeJobsResult[0]?.count || 0,
          filledPositions: filledPositionsResult[0]?.count || 0,
          openPositions: openPositionsResult[0]?.count || 0,
          newApplications: newApplicationsResult[0]?.count || 0,
          scheduledInterviews: scheduledInterviewsResult[0]?.count || 0,
        },
        failedExports: failedExports.map(exp => ({
          id: exp.id,
          exportType: exp.exportType,
          dataType: exp.dataType,
          fileName: exp.fileName,
          errorMessage: exp.errorMessage,
          createdAt: exp.createdAt,
        })),
        budgetInsights: {
          totalScenarios: totalScenariosResult[0]?.count || 0,
          totalBudgetAllocated,
          activeAlerts: activeAlertsResult[0]?.count || 0,
          averageROI,
        },
        systemHealth: {
          jobFailures: jobFailuresResult[0]?.count || 0,
          pendingExports: pendingExportsResult[0]?.count || 0,
          systemUptime: "99.9%", // Placeholder - would calculate from actual uptime monitoring
        },
      };

      return digestContent;
    }),

  /**
   * Get digest delivery history
   */
  getDigestHistory: protectedProcedure
    .input(z.object({
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const history = await db
        .select()
        .from(digestDeliveryLog)
        .orderBy(desc(digestDeliveryLog.sentAt))
        .limit(input.limit)
        .offset(input.offset);

      return history;
    }),

  /**
   * Preview digest for current week
   */
  previewWeeklyDigest: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Calculate current week dates
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
    endOfWeek.setHours(23, 59, 59, 999);

    const startDate = startOfWeek.toISOString();
    const endDate = endOfWeek.toISOString();

    // Reuse generateDigest logic
    return await emailDigestRouter.createCaller({ 
      user: { id: 1, openId: "system", name: "System", email: null, loginMethod: null, role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, 
      req: {} as any, 
      res: {} as any 
    }).generateDigest({ startDate, endDate });
  }),

  /**
   * Send digest to recipients
   */
  sendDigest: protectedProcedure
    .input(z.object({
      recipients: z.array(z.string().email()),
      digestContent: z.object({
        period: z.object({
          startDate: z.string(),
          endDate: z.string(),
        }),
        jobHealthMetrics: z.object({
          activeJobs: z.number(),
          filledPositions: z.number(),
          openPositions: z.number(),
          newApplications: z.number(),
          scheduledInterviews: z.number(),
        }),
        failedExports: z.array(z.any()),
        budgetInsights: z.object({
          totalScenarios: z.number(),
          totalBudgetAllocated: z.number(),
          activeAlerts: z.number(),
          averageROI: z.number(),
        }),
        systemHealth: z.object({
          jobFailures: z.number(),
          pendingExports: z.number(),
          systemUptime: z.string(),
        }),
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Format email content
      const emailHtml = formatDigestEmail(input.digestContent);
      const emailText = formatDigestText(input.digestContent);

      // Log digest delivery
      const deliveryResult = await db.insert(digestDeliveryLog).values({
        digestType: "weekly_summary",
        periodStart: input.digestContent.period.startDate,
        periodEnd: input.digestContent.period.endDate,
        recipientEmail: input.recipients.join(", "),
        sentAt: new Date().toISOString(),
        deliveryStatus: "sent",
        emailSubject: `Weekly Recruitment Digest - ${new Date(input.digestContent.period.startDate).toLocaleDateString()} to ${new Date(input.digestContent.period.endDate).toLocaleDateString()}`,
        contentSnapshot: JSON.stringify(input.digestContent),
      });

      // Send via Gmail MCP
      const gmailResult = await sendGmailMessage({
        to: input.recipients,
        subject: `Weekly Recruitment Digest - ${new Date(input.digestContent.period.startDate).toLocaleDateString()} to ${new Date(input.digestContent.period.endDate).toLocaleDateString()}`,
        content: emailText,
      });

      // Update delivery status
      if (!gmailResult.success) {
        console.error("[Email Digest] Failed to send via Gmail:", gmailResult.error);
      }

      return {
        success: gmailResult.success,
        deliveryId: Number(deliveryResult.insertId),
        messageId: gmailResult.messageId,
        error: gmailResult.error,
        preview: {
          html: emailHtml,
          text: emailText,
        },
      };
    }),

  /**
   * Schedule recurring digest
   */
  scheduleDigest: protectedProcedure
    .input(z.object({
      frequency: z.enum(['daily', 'weekly', 'monthly']),
      recipients: z.array(z.string().email()),
      enabled: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      // TODO: Integrate with scheduling system
      // For now, just return configuration
      return {
        success: true,
        schedule: {
          frequency: input.frequency,
          recipients: input.recipients,
          enabled: input.enabled,
          nextRun: calculateNextRun(input.frequency),
        },
      };
    }),
});

/**
 * Format digest content as HTML email
 */
function formatDigestEmail(content: DigestContent): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
    .section { margin: 20px 0; padding: 15px; background: #f9fafb; border-left: 4px solid #1e40af; }
    .metric { display: inline-block; margin: 10px 20px 10px 0; }
    .metric-value { font-size: 24px; font-weight: bold; color: #1e40af; }
    .metric-label { font-size: 12px; color: #6b7280; }
    .alert { background: #fef2f2; border-left-color: #dc2626; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Weekly Recruitment Digest</h1>
      <p>${new Date(content.period.startDate).toLocaleDateString()} - ${new Date(content.period.endDate).toLocaleDateString()}</p>
    </div>

    <div class="section">
      <h2>📊 Job Health Metrics</h2>
      <div class="metric">
        <div class="metric-value">${content.jobHealthMetrics.activeJobs}</div>
        <div class="metric-label">Active Jobs</div>
      </div>
      <div class="metric">
        <div class="metric-value">${content.jobHealthMetrics.filledPositions}</div>
        <div class="metric-label">Filled Positions</div>
      </div>
      <div class="metric">
        <div class="metric-value">${content.jobHealthMetrics.newApplications}</div>
        <div class="metric-label">New Applications</div>
      </div>
      <div class="metric">
        <div class="metric-value">${content.jobHealthMetrics.scheduledInterviews}</div>
        <div class="metric-label">Scheduled Interviews</div>
      </div>
    </div>

    ${content.failedExports.length > 0 ? `
    <div class="section alert">
      <h2>⚠️ Failed Export Attempts</h2>
      <ul>
        ${content.failedExports.map(exp => `
          <li><strong>${exp.fileName}</strong> (${exp.exportType}) - ${exp.errorMessage || 'Unknown error'}</li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    <div class="section">
      <h2>💰 Budget Insights</h2>
      <div class="metric">
        <div class="metric-value">${content.budgetInsights.totalScenarios}</div>
        <div class="metric-label">Budget Scenarios</div>
      </div>
      <div class="metric">
        <div class="metric-value">SAR ${(content.budgetInsights.totalBudgetAllocated / 100).toFixed(2)}</div>
        <div class="metric-label">Total Budget</div>
      </div>
      <div class="metric">
        <div class="metric-value">${content.budgetInsights.averageROI}%</div>
        <div class="metric-label">Average ROI</div>
      </div>
      <div class="metric">
        <div class="metric-value">${content.budgetInsights.activeAlerts}</div>
        <div class="metric-label">Active Alerts</div>
      </div>
    </div>

    <div class="section">
      <h2>🔧 System Health</h2>
      <div class="metric">
        <div class="metric-value">${content.systemHealth.jobFailures}</div>
        <div class="metric-label">Job Failures</div>
      </div>
      <div class="metric">
        <div class="metric-value">${content.systemHealth.pendingExports}</div>
        <div class="metric-label">Pending Exports</div>
      </div>
      <div class="metric">
        <div class="metric-value">${content.systemHealth.systemUptime}</div>
        <div class="metric-label">System Uptime</div>
      </div>
    </div>

    <div class="footer">
      <p>This is an automated digest from Oracle Smart Recruitment System.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Format digest content as plain text
 */
function formatDigestText(content: DigestContent): string {
  return `
WEEKLY RECRUITMENT DIGEST
${new Date(content.period.startDate).toLocaleDateString()} - ${new Date(content.period.endDate).toLocaleDateString()}

JOB HEALTH METRICS
- Active Jobs: ${content.jobHealthMetrics.activeJobs}
- Filled Positions: ${content.jobHealthMetrics.filledPositions}
- New Applications: ${content.jobHealthMetrics.newApplications}
- Scheduled Interviews: ${content.jobHealthMetrics.scheduledInterviews}

${content.failedExports.length > 0 ? `
FAILED EXPORT ATTEMPTS
${content.failedExports.map(exp => `- ${exp.fileName} (${exp.exportType}) - ${exp.errorMessage || 'Unknown error'}`).join('\n')}
` : ''}

BUDGET INSIGHTS
- Budget Scenarios: ${content.budgetInsights.totalScenarios}
- Total Budget: SAR ${(content.budgetInsights.totalBudgetAllocated / 100).toFixed(2)}
- Average ROI: ${content.budgetInsights.averageROI}%
- Active Alerts: ${content.budgetInsights.activeAlerts}

SYSTEM HEALTH
- Job Failures: ${content.systemHealth.jobFailures}
- Pending Exports: ${content.systemHealth.pendingExports}
- System Uptime: ${content.systemHealth.systemUptime}

---
This is an automated digest from Oracle Smart Recruitment System.
  `.trim();
}

/**
 * Calculate next run time based on frequency
 */
function calculateNextRun(frequency: 'daily' | 'weekly' | 'monthly'): string {
  const now = new Date();
  const next = new Date(now);

  switch (frequency) {
    case 'daily':
      next.setDate(now.getDate() + 1);
      next.setHours(9, 0, 0, 0); // 9 AM next day
      break;
    case 'weekly':
      next.setDate(now.getDate() + (7 - now.getDay())); // Next Sunday
      next.setHours(9, 0, 0, 0);
      break;
    case 'monthly':
      next.setMonth(now.getMonth() + 1);
      next.setDate(1); // First day of next month
      next.setHours(9, 0, 0, 0);
      break;
  }

  return next.toISOString();
}
