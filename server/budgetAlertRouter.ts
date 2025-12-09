import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { budgetThresholds, budgetAlerts } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import {
  checkBudgetThreshold,
  checkAllBudgetThresholds,
  getBudgetAlertHistory,
  acknowledgeBudgetAlert,
} from "./budgetAlertAutomation";

/**
 * Budget Alert Router
 * 
 * Provides tRPC procedures for budget threshold monitoring,
 * alert management, and automated notifications.
 */

export const budgetAlertRouter = router({
  /**
   * Create a new budget threshold
   */
  createThreshold: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        thresholdType: z.enum(["monthly", "weekly", "daily", "per_campaign", "total"]),
        thresholdAmount: z.number().min(0),
        currency: z.string().length(3).default("SAR"),
        warningPercentage: z.number().min(0).max(100).default(80),
        criticalPercentage: z.number().min(0).max(100).default(95),
        alertChannels: z.array(z.enum(["email", "push", "sms"])).default(["email"]),
        alertRecipients: z.array(z.string().email()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(budgetThresholds).values({
        name: input.name,
        thresholdType: input.thresholdType,
        thresholdAmount: input.thresholdAmount,
        currency: input.currency,
        warningPercentage: input.warningPercentage,
        criticalPercentage: input.criticalPercentage,
        alertChannels: JSON.stringify(input.alertChannels),
        alertRecipients: JSON.stringify(input.alertRecipients),
        isActive: 1,
        createdBy: ctx.user.id,
      });

      return {
        success: true,
        thresholdId: Number(result.insertId),
      };
    }),

  /**
   * Get all budget thresholds
   */
  getThresholds: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const thresholds = await db
      .select()
      .from(budgetThresholds)
      .orderBy(desc(budgetThresholds.createdAt));

    return thresholds.map((t) => ({
      ...t,
      alertChannels: typeof t.alertChannels === "string" 
        ? JSON.parse(t.alertChannels) 
        : t.alertChannels,
      alertRecipients: typeof t.alertRecipients === "string"
        ? JSON.parse(t.alertRecipients)
        : t.alertRecipients,
    }));
  }),

  /**
   * Update budget threshold
   */
  updateThreshold: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        thresholdAmount: z.number().min(0).optional(),
        warningPercentage: z.number().min(0).max(100).optional(),
        criticalPercentage: z.number().min(0).max(100).optional(),
        alertChannels: z.array(z.enum(["email", "push", "sms"])).optional(),
        alertRecipients: z.array(z.string().email()).optional(),
        isActive: z.number().min(0).max(1).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updates: any = {};
      
      if (input.name) updates.name = input.name;
      if (input.thresholdAmount !== undefined) updates.thresholdAmount = input.thresholdAmount;
      if (input.warningPercentage !== undefined) updates.warningPercentage = input.warningPercentage;
      if (input.criticalPercentage !== undefined) updates.criticalPercentage = input.criticalPercentage;
      if (input.alertChannels) updates.alertChannels = JSON.stringify(input.alertChannels);
      if (input.alertRecipients) updates.alertRecipients = JSON.stringify(input.alertRecipients);
      if (input.isActive !== undefined) updates.isActive = input.isActive;

      await db
        .update(budgetThresholds)
        .set(updates)
        .where(eq(budgetThresholds.id, input.id));

      return { success: true };
    }),

  /**
   * Delete budget threshold
   */
  deleteThreshold: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .delete(budgetThresholds)
        .where(eq(budgetThresholds.id, input.id));

      return { success: true };
    }),

  /**
   * Check a specific budget threshold manually
   */
  checkThreshold: protectedProcedure
    .input(z.object({ thresholdId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const result = await checkBudgetThreshold(input.thresholdId, ctx.user.id);
      return result;
    }),

  /**
   * Check all active budget thresholds
   */
  checkAllThresholds: protectedProcedure.mutation(async ({ ctx }) => {
    const results = await checkAllBudgetThresholds(ctx.user.id);
    return {
      success: true,
      results,
      totalChecked: results.length,
      alertsTriggered: results.filter((r) => r.alertTriggered).length,
    };
  }),

  /**
   * Get budget alert history
   */
  getAlertHistory: protectedProcedure
    .input(
      z.object({
        thresholdId: z.number().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const alerts = await getBudgetAlertHistory(input.thresholdId, input.limit);
      
      return alerts.map((alert) => ({
        ...alert,
        notificationsSent: typeof alert.notificationsSent === "string"
          ? JSON.parse(alert.notificationsSent)
          : alert.notificationsSent,
      }));
    }),

  /**
   * Get unacknowledged alerts
   */
  getUnacknowledgedAlerts: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const alerts = await db
      .select()
      .from(budgetAlerts)
      .where(eq(budgetAlerts.acknowledged, 0))
      .orderBy(desc(budgetAlerts.createdAt));

    return alerts.map((alert) => ({
      ...alert,
      notificationsSent: typeof alert.notificationsSent === "string"
        ? JSON.parse(alert.notificationsSent)
        : alert.notificationsSent,
    }));
  }),

  /**
   * Acknowledge a budget alert
   */
  acknowledgeAlert: protectedProcedure
    .input(
      z.object({
        alertId: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const success = await acknowledgeBudgetAlert(
        input.alertId,
        ctx.user.id,
        input.notes
      );

      return { success };
    }),

  /**
   * Get budget monitoring dashboard data
   */
  getDashboard: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get all active thresholds
    const thresholds = await db
      .select()
      .from(budgetThresholds)
      .where(eq(budgetThresholds.isActive, 1));

    // Check current status for each threshold
    const thresholdStatuses = await Promise.all(
      thresholds.map(async (threshold) => {
        const status = await checkBudgetThreshold(threshold.id, ctx.user.id);
        return {
          threshold,
          status,
        };
      })
    );

    // Get recent alerts
    const recentAlerts = await db
      .select()
      .from(budgetAlerts)
      .orderBy(desc(budgetAlerts.createdAt))
      .limit(10);

    // Get unacknowledged count
    const unacknowledgedCount = await db
      .select()
      .from(budgetAlerts)
      .where(eq(budgetAlerts.acknowledged, 0));

    return {
      thresholds: thresholdStatuses,
      recentAlerts: recentAlerts.map((alert) => ({
        ...alert,
        notificationsSent: typeof alert.notificationsSent === "string"
          ? JSON.parse(alert.notificationsSent)
          : alert.notificationsSent,
      })),
      unacknowledgedCount: unacknowledgedCount.length,
      summary: {
        totalThresholds: thresholds.length,
        activeThresholds: thresholds.filter((t) => t.isActive).length,
        atRisk: thresholdStatuses.filter(
          (ts) => ts.status && ts.status.percentUsed >= 80
        ).length,
      },
    };
  }),
});
