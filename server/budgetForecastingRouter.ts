import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  generateBudgetForecast,
  getBudgetAnalytics,
  checkBudgetThresholds,
  getRecentBudgetAlerts,
} from "./budgetForecastingService";
import { getDb } from "./db";
import { budgetThresholds, budgetAlerts } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const budgetForecastingRouter = router({
  /**
   * Generate budget forecast for a period
   */
  generateForecast: protectedProcedure
    .input(
      z.object({
        periodStart: z.string(),
        periodEnd: z.string(),
      })
    )
    .query(async ({ input }) => {
      const periodStart = new Date(input.periodStart);
      const periodEnd = new Date(input.periodEnd);

      const forecast = await generateBudgetForecast(periodStart, periodEnd);
      return forecast;
    }),

  /**
   * Get current budget analytics
   */
  getAnalytics: protectedProcedure
    .input(
      z.object({
        periodStart: z.string(),
        periodEnd: z.string(),
      })
    )
    .query(async ({ input }) => {
      const periodStart = new Date(input.periodStart);
      const periodEnd = new Date(input.periodEnd);

      const analytics = await getBudgetAnalytics(periodStart, periodEnd);
      return analytics;
    }),

  /**
   * Check budget thresholds and create alerts
   */
  checkThresholds: protectedProcedure
    .input(
      z.object({
        periodStart: z.string(),
        periodEnd: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const periodStart = new Date(input.periodStart);
      const periodEnd = new Date(input.periodEnd);

      await checkBudgetThresholds(periodStart, periodEnd);
      return { success: true };
    }),

  /**
   * Get recent budget alerts
   */
  getRecentAlerts: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional().default(10),
      })
    )
    .query(async ({ input }) => {
      const alerts = await getRecentBudgetAlerts(input.limit);
      return alerts;
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

    return thresholds;
  }),

  /**
   * Create budget threshold
   */
  createThreshold: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        thresholdType: z.enum([
          "monthly",
          "weekly",
          "daily",
          "per_campaign",
          "total",
        ]),
        thresholdAmount: z.number(),
        currency: z.string().optional().default("SAR"),
        warningPercentage: z.number().optional().default(80),
        criticalPercentage: z.number().optional().default(95),
        alertChannels: z.array(z.string()).optional(),
        alertRecipients: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(budgetThresholds).values({
        name: input.name,
        thresholdType: input.thresholdType,
        thresholdAmount: input.thresholdAmount,
        currency: input.currency,
        warningPercentage: input.warningPercentage,
        criticalPercentage: input.criticalPercentage,
        alertChannels: input.alertChannels
          ? JSON.stringify(input.alertChannels)
          : null,
        alertRecipients: input.alertRecipients
          ? JSON.stringify(input.alertRecipients)
          : null,
        isActive: 1,
        createdBy: ctx.user.id,
      });

      return { id: Number(result.insertId), success: true };
    }),

  /**
   * Update budget threshold
   */
  updateThreshold: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        thresholdAmount: z.number().optional(),
        warningPercentage: z.number().optional(),
        criticalPercentage: z.number().optional(),
        isActive: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.thresholdAmount !== undefined)
        updateData.thresholdAmount = input.thresholdAmount;
      if (input.warningPercentage !== undefined)
        updateData.warningPercentage = input.warningPercentage;
      if (input.criticalPercentage !== undefined)
        updateData.criticalPercentage = input.criticalPercentage;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;

      await db
        .update(budgetThresholds)
        .set(updateData)
        .where(eq(budgetThresholds.id, input.id));

      return { success: true };
    }),

  /**
   * Acknowledge budget alert
   */
  acknowledgeAlert: protectedProcedure
    .input(
      z.object({
        alertId: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(budgetAlerts)
        .set({
          acknowledged: 1,
          acknowledgedBy: ctx.user.id,
          acknowledgedAt: new Date().toISOString(),
          notes: input.notes || null,
        })
        .where(eq(budgetAlerts.id, input.alertId));

      return { success: true };
    }),
});
