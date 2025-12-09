import { z } from "zod";
import { eq, desc, and, gte } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  budgetThresholds,
  budgetAlerts,
  type InsertBudgetThreshold,
} from "../../drizzle/schema";
import {
  checkBudgetThresholds,
  monitorBudgets,
  getBudgetForecast,
} from "../services/budgetMonitoring";

export const budgetManagementRouter = router({
  // Get all budget thresholds
  getThresholds: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    return await db
      .select()
      .from(budgetThresholds)
      .orderBy(desc(budgetThresholds.createdAt));
  }),

  // Get a single threshold by ID
  getThreshold: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const [threshold] = await db
        .select()
        .from(budgetThresholds)
        .where(eq(budgetThresholds.id, input.id))
        .limit(1);

      if (!threshold) {
        throw new Error("Threshold not found");
      }

      return threshold;
    }),

  // Create a new budget threshold
  createThreshold: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        thresholdType: z.enum([
          "monthly",
          "weekly",
          "daily",
          "per_campaign",
          "total",
        ]),
        thresholdAmount: z.number().positive(),
        currency: z.string().default("SAR"),
        warningPercentage: z.number().min(0).max(100).default(80),
        criticalPercentage: z.number().min(0).max(100).default(95),
        alertChannels: z.array(z.enum(["email", "push", "sms"])).default([]),
        alertRecipients: z.array(z.number()).default([]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const thresholdData: InsertBudgetThreshold = {
        ...input,
        alertChannels: JSON.stringify(input.alertChannels),
        alertRecipients: JSON.stringify(input.alertRecipients),
        createdBy: ctx.user.id,
      };

      const result = await db.insert(budgetThresholds).values(thresholdData);

      return { id: result[0].insertId, success: true };
    }),

  // Update a budget threshold
  updateThreshold: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        thresholdType: z
          .enum(["monthly", "weekly", "daily", "per_campaign", "total"])
          .optional(),
        thresholdAmount: z.number().positive().optional(),
        currency: z.string().optional(),
        warningPercentage: z.number().min(0).max(100).optional(),
        criticalPercentage: z.number().min(0).max(100).optional(),
        alertChannels: z.array(z.enum(["email", "push", "sms"])).optional(),
        alertRecipients: z.array(z.number()).optional(),
        isActive: z.number().min(0).max(1).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const { id, ...updates } = input;

      const updateData: any = { ...updates };
      if (updates.alertChannels) {
        updateData.alertChannels = JSON.stringify(updates.alertChannels);
      }
      if (updates.alertRecipients) {
        updateData.alertRecipients = JSON.stringify(updates.alertRecipients);
      }

      await db
        .update(budgetThresholds)
        .set(updateData)
        .where(eq(budgetThresholds.id, id));

      return { success: true };
    }),

  // Delete a budget threshold
  deleteThreshold: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      await db
        .delete(budgetThresholds)
        .where(eq(budgetThresholds.id, input.id));

      return { success: true };
    }),

  // Get all budget alerts
  getAlerts: protectedProcedure
    .input(
      z
        .object({
          thresholdId: z.number().optional(),
          limit: z.number().default(50),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      let query = db.select().from(budgetAlerts);

      if (input?.thresholdId) {
        query = query.where(eq(budgetAlerts.thresholdId, input.thresholdId)) as any;
      }

      return await query
        .orderBy(desc(budgetAlerts.createdAt))
        .limit(input?.limit || 50);
    }),

  // Acknowledge a budget alert
  acknowledgeAlert: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      await db
        .update(budgetAlerts)
        .set({
          acknowledged: 1,
          acknowledgedBy: ctx.user.id,
          acknowledgedAt: new Date().toISOString(),
          notes: input.notes,
        })
        .where(eq(budgetAlerts.id, input.id));

      return { success: true };
    }),

  // Get current budget status for all thresholds
  getCurrentStatus: protectedProcedure.query(async () => {
    return await checkBudgetThresholds();
  }),

  // Get budget forecast for a specific threshold
  getForecast: protectedProcedure
    .input(z.object({ thresholdId: z.number() }))
    .query(async ({ input }) => {
      return await getBudgetForecast(input.thresholdId);
    }),

  // Manually trigger budget monitoring (admin only)
  triggerMonitoring: protectedProcedure.mutation(async ({ ctx }) => {
    // Only allow admin users to manually trigger monitoring
    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized");
    }

    await monitorBudgets();
    return { success: true, message: "Budget monitoring completed" };
  }),

  // Get alert statistics
  getAlertStats: protectedProcedure
    .input(
      z.object({
        thresholdId: z.number().optional(),
        days: z.number().default(30),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      let query = db
        .select()
        .from(budgetAlerts)
        .where(gte(budgetAlerts.createdAt, startDate.toISOString()));

      if (input.thresholdId) {
        query = query.where(
          and(
            eq(budgetAlerts.thresholdId, input.thresholdId),
            gte(budgetAlerts.createdAt, startDate.toISOString())
          )
        ) as any;
      }

      const alerts = await query;

      const stats = {
        total: alerts.length,
        warning: alerts.filter((a) => a.alertLevel === "warning").length,
        critical: alerts.filter((a) => a.alertLevel === "critical").length,
        exceeded: alerts.filter((a) => a.alertLevel === "exceeded").length,
        acknowledged: alerts.filter((a) => a.acknowledged === 1).length,
        unacknowledged: alerts.filter((a) => a.acknowledged === 0).length,
      };

      return stats;
    }),
});
