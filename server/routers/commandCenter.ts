import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { 
  jobFailureAlerts, 
  jobExecutions, 
  exportHistory, 
  budgetScenarios,
  scenarioCampaigns,
  budgetAlerts,
  budgetThresholds,
  jobs,
  candidates,
  applications
} from "../../drizzle/schema";
import { eq, desc, and, gte, lte, sql, count } from "drizzle-orm";

/**
 * Command Center Router
 * Unified admin dashboard for job failure alerts, export controls, and budget management
 */

export const commandCenterRouter = router({
  // ==========================================
  // DASHBOARD OVERVIEW
  // ==========================================
  
  /**
   * Get comprehensive dashboard overview with key metrics
   */
  getDashboardOverview: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get active jobs count
    const activeJobsResult = await db
      .select({ count: count() })
      .from(jobs)
      .where(eq(jobs.status, "open"));
    
    // Get total candidates count
    const totalCandidatesResult = await db
      .select({ count: count() })
      .from(candidates);
    
    // Get pending applications count
    const pendingApplicationsResult = await db
      .select({ count: count() })
      .from(applications)
      .where(eq(applications.status, "submitted"));
    
    // Get unresolved job failures count
    const unresolvedFailuresResult = await db
      .select({ count: count() })
      .from(jobExecutions)
      .where(eq(jobExecutions.status, "failed"));
    
    // Get pending exports count
    const pendingExportsResult = await db
      .select({ count: count() })
      .from(exportHistory)
      .where(eq(exportHistory.status, "pending"));
    
    // Get active budget alerts count
    const activeBudgetAlertsResult = await db
      .select({ count: count() })
      .from(budgetAlerts)
      .where(eq(budgetAlerts.acknowledged, 0));

    return {
      activeJobs: activeJobsResult[0]?.count || 0,
      totalCandidates: totalCandidatesResult[0]?.count || 0,
      pendingApplications: pendingApplicationsResult[0]?.count || 0,
      unresolvedFailures: unresolvedFailuresResult[0]?.count || 0,
      pendingExports: pendingExportsResult[0]?.count || 0,
      activeBudgetAlerts: activeBudgetAlertsResult[0]?.count || 0,
    };
  }),

  // ==========================================
  // JOB FAILURE ALERTS
  // ==========================================

  /**
   * Get recent job failures with alert configuration
   */
  getJobFailures: protectedProcedure
    .input(z.object({
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const failures = await db
        .select()
        .from(jobExecutions)
        .where(eq(jobExecutions.status, "failed"))
        .orderBy(desc(jobExecutions.executedAt))
        .limit(input.limit)
        .offset(input.offset);

      return failures;
    }),

  /**
   * Get job failure alert configuration
   */
  getJobAlertConfig: protectedProcedure
    .input(z.object({
      jobName: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const config = await db
        .select()
        .from(jobFailureAlerts)
        .where(eq(jobFailureAlerts.jobName, input.jobName))
        .limit(1);

      return config[0] || null;
    }),

  /**
   * Update job failure alert configuration
   */
  updateJobAlertConfig: protectedProcedure
    .input(z.object({
      jobName: z.string(),
      enabled: z.boolean().optional(),
      failureThreshold: z.number().optional(),
      alertCooldown: z.number().optional(),
      retryEnabled: z.boolean().optional(),
      maxRetries: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { jobName, ...updates } = input;
      
      // Convert boolean to tinyint
      const dbUpdates: Record<string, unknown> = {};
      if (updates.enabled !== undefined) dbUpdates.enabled = updates.enabled ? 1 : 0;
      if (updates.retryEnabled !== undefined) dbUpdates.retryEnabled = updates.retryEnabled ? 1 : 0;
      if (updates.failureThreshold !== undefined) dbUpdates.failureThreshold = updates.failureThreshold;
      if (updates.alertCooldown !== undefined) dbUpdates.alertCooldown = updates.alertCooldown;
      if (updates.maxRetries !== undefined) dbUpdates.maxRetries = updates.maxRetries;

      await db
        .update(jobFailureAlerts)
        .set(dbUpdates)
        .where(eq(jobFailureAlerts.jobName, jobName));

      return { success: true };
    }),

  // ==========================================
  // EXPORT PREVIEW CONTROLS
  // ==========================================

  /**
   * Get recent export history with status
   */
  getExportHistory: protectedProcedure
    .input(z.object({
      limit: z.number().default(20),
      offset: z.number().default(0),
      status: z.enum(['pending', 'processing', 'completed', 'failed', 'expired']).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db
        .select()
        .from(exportHistory)
        .orderBy(desc(exportHistory.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      if (input.status) {
        query = query.where(eq(exportHistory.status, input.status)) as typeof query;
      }

      const exports = await query;
      return exports;
    }),

  /**
   * Get failed exports for retry
   */
  getFailedExports: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const failedExports = await db
      .select()
      .from(exportHistory)
      .where(eq(exportHistory.status, "failed"))
      .orderBy(desc(exportHistory.createdAt))
      .limit(50);

    return failedExports;
  }),

  /**
   * Retry failed export
   */
  retryExport: protectedProcedure
    .input(z.object({
      exportId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(exportHistory)
        .set({ 
          status: "pending",
          errorMessage: null,
        })
        .where(eq(exportHistory.id, input.exportId));

      return { success: true };
    }),

  // ==========================================
  // BUDGET SCENARIO MANAGEMENT
  // ==========================================

  /**
   * Get all budget scenarios
   */
  getBudgetScenarios: protectedProcedure
    .input(z.object({
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const scenarios = await db
        .select()
        .from(budgetScenarios)
        .orderBy(desc(budgetScenarios.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return scenarios;
    }),

  /**
   * Get scenario details with campaigns
   */
  getScenarioDetails: protectedProcedure
    .input(z.object({
      scenarioId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const scenario = await db
        .select()
        .from(budgetScenarios)
        .where(eq(budgetScenarios.id, input.scenarioId))
        .limit(1);

      if (!scenario[0]) {
        throw new Error("Scenario not found");
      }

      const campaigns = await db
        .select()
        .from(scenarioCampaigns)
        .where(eq(scenarioCampaigns.scenarioId, input.scenarioId));

      return {
        scenario: scenario[0],
        campaigns,
      };
    }),

  /**
   * Create new budget scenario
   */
  createBudgetScenario: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      campaigns: z.array(z.object({
        name: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        estimatedRecipients: z.number(),
        costPerRecipient: z.number(),
        expectedResponseRate: z.number().default(5),
        expectedConversionRate: z.number().default(20),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Calculate totals
      let totalCost = 0;
      let totalRecipients = 0;
      let expectedConversions = 0;

      input.campaigns.forEach(campaign => {
        const campaignCost = campaign.estimatedRecipients * campaign.costPerRecipient;
        totalCost += campaignCost;
        totalRecipients += campaign.estimatedRecipients;
        
        const responses = campaign.estimatedRecipients * (campaign.expectedResponseRate / 10000);
        const conversions = responses * (campaign.expectedConversionRate / 10000);
        expectedConversions += conversions;
      });

      const costPerConversion = expectedConversions > 0 ? Math.round(totalCost / expectedConversions) : 0;
      const roi = expectedConversions > 0 ? Math.round((expectedConversions * 100000 - totalCost) / totalCost * 100) : 0;

      // Create scenario
      const scenarioResult = await db.insert(budgetScenarios).values({
        name: input.name,
        description: input.description,
        createdBy: ctx.user.id,
        totalCost,
        totalRecipients,
        expectedConversions: Math.round(expectedConversions),
        costPerConversion,
        roi,
        timeline: null,
      });

      const scenarioId = Number(scenarioResult.insertId);

      // Create campaigns
      for (const campaign of input.campaigns) {
        await db.insert(scenarioCampaigns).values({
          scenarioId,
          name: campaign.name,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          estimatedRecipients: campaign.estimatedRecipients,
          costPerRecipient: campaign.costPerRecipient,
          expectedResponseRate: campaign.expectedResponseRate,
          expectedConversionRate: campaign.expectedConversionRate,
        });
      }

      return { scenarioId, success: true };
    }),

  /**
   * Get budget alerts
   */
  getBudgetAlerts: protectedProcedure
    .input(z.object({
      acknowledged: z.boolean().optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db
        .select()
        .from(budgetAlerts)
        .orderBy(desc(budgetAlerts.createdAt))
        .limit(input.limit);

      if (input.acknowledged !== undefined) {
        query = query.where(eq(budgetAlerts.acknowledged, input.acknowledged ? 1 : 0)) as typeof query;
      }

      const alerts = await query;
      return alerts;
    }),

  /**
   * Acknowledge budget alert
   */
  acknowledgeBudgetAlert: protectedProcedure
    .input(z.object({
      alertId: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(budgetAlerts)
        .set({
          acknowledged: 1,
          acknowledgedBy: ctx.user.id,
          acknowledgedAt: new Date().toISOString(),
          notes: input.notes,
        })
        .where(eq(budgetAlerts.id, input.alertId));

      return { success: true };
    }),

  /**
   * Get budget thresholds configuration
   */
  getBudgetThresholds: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const thresholds = await db
      .select()
      .from(budgetThresholds)
      .where(eq(budgetThresholds.isActive, 1));

    return thresholds;
  }),

  /**
   * Update budget threshold
   */
  updateBudgetThreshold: protectedProcedure
    .input(z.object({
      thresholdId: z.number(),
      thresholdAmount: z.number().optional(),
      warningPercentage: z.number().optional(),
      criticalPercentage: z.number().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { thresholdId, ...updates } = input;
      
      const dbUpdates: Record<string, unknown> = {};
      if (updates.thresholdAmount !== undefined) dbUpdates.thresholdAmount = updates.thresholdAmount;
      if (updates.warningPercentage !== undefined) dbUpdates.warningPercentage = updates.warningPercentage;
      if (updates.criticalPercentage !== undefined) dbUpdates.criticalPercentage = updates.criticalPercentage;
      if (updates.isActive !== undefined) dbUpdates.isActive = updates.isActive ? 1 : 0;

      await db
        .update(budgetThresholds)
        .set(dbUpdates)
        .where(eq(budgetThresholds.id, thresholdId));

      return { success: true };
    }),
});
