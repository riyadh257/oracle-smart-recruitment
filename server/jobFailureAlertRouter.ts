import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  checkJobFailure,
  getPendingRetries,
  updateRetryStatus,
  getFailureHistory,
  upsertAlertRule,
  getAllAlertRules,
  AlertRule,
} from "./jobFailureAlertService";

const alertRuleSchema = z.object({
  id: z.number().optional(),
  jobName: z.string(),
  enabled: z.boolean(),
  failureThreshold: z.number().min(1).max(10),
  alertCooldown: z.number().min(5).max(1440), // 5 minutes to 24 hours
  retryEnabled: z.boolean(),
  maxRetries: z.number().min(0).max(10),
  retryBackoffMultiplier: z.number().min(1).max(5),
  escalationEnabled: z.boolean(),
  escalationThreshold: z.number().min(1).max(20),
});

export const jobFailureAlertRouter = router({
  /**
   * Get all configured alert rules
   */
  getAllRules: protectedProcedure.query(async () => {
    const rules = await getAllAlertRules();
    return rules;
  }),

  /**
   * Create or update an alert rule
   */
  upsertRule: protectedProcedure
    .input(alertRuleSchema)
    .mutation(async ({ input }) => {
      const ruleId = await upsertAlertRule(input as AlertRule);
      return { success: true, ruleId };
    }),

  /**
   * Get failure history for a specific job
   */
  getFailureHistory: protectedProcedure
    .input(
      z.object({
        jobName: z.string(),
        limit: z.number().min(1).max(200).default(50),
      })
    )
    .query(async ({ input }) => {
      const history = await getFailureHistory(input.jobName, input.limit);
      return history;
    }),

  /**
   * Get pending retry attempts
   */
  getPendingRetries: protectedProcedure.query(async () => {
    const retries = await getPendingRetries();
    return retries;
  }),

  /**
   * Manually trigger failure check for a job execution
   */
  checkFailure: protectedProcedure
    .input(
      z.object({
        jobName: z.string(),
        executionId: z.number(),
        status: z.enum(["pending", "running", "completed", "failed", "cancelled", "timeout"]),
        errorMessage: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const alerted = await checkJobFailure(
        input.jobName,
        input.executionId,
        input.status,
        input.errorMessage
      );
      return { success: true, alerted };
    }),

  /**
   * Update retry attempt status
   */
  updateRetryStatus: protectedProcedure
    .input(
      z.object({
        retryId: z.number(),
        status: z.enum(["running", "completed", "failed"]),
        errorMessage: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await updateRetryStatus(input.retryId, input.status, input.errorMessage);
      return { success: true };
    }),

  /**
   * Get alert statistics
   */
  getAlertStats: protectedProcedure.query(async () => {
    const rules = await getAllAlertRules();
    
    const stats = {
      totalRules: rules.length,
      enabledRules: rules.filter(r => r.enabled).length,
      rulesWithRetry: rules.filter(r => r.retryEnabled).length,
      rulesWithEscalation: rules.filter(r => r.escalationEnabled).length,
    };

    return stats;
  }),

  /**
   * Disable alert rule
   */
  disableRule: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const rules = await getAllAlertRules();
      const rule = rules.find(r => r.id === input.id);
      
      if (!rule) {
        throw new Error("Alert rule not found");
      }

      await upsertAlertRule({ ...rule, enabled: false });
      return { success: true };
    }),

  /**
   * Enable alert rule
   */
  enableRule: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const rules = await getAllAlertRules();
      const rule = rules.find(r => r.id === input.id);
      
      if (!rule) {
        throw new Error("Alert rule not found");
      }

      await upsertAlertRule({ ...rule, enabled: true });
      return { success: true };
    }),
});
