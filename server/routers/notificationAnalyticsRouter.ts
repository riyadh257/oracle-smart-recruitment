import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  notificationHistory,
  notificationAnalytics,
  userNotificationPreferences,
} from "../../drizzle/schema";
import { eq, and, gte, lte, count, sql, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Notification Analytics Router
 * Provides metrics and insights on notification delivery and engagement
 */
export const notificationAnalyticsRouter = router({
  /**
   * Get overall notification statistics
   */
  getOverallStats: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const startDate = input.startDate ? new Date(input.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = input.endDate ? new Date(input.endDate) : new Date();

      // Total notifications sent
      const totalSent = await db
        .select({ count: count() })
        .from(notificationHistory)
        .where(
          and(
            eq(notificationHistory.userId, ctx.user.id),
            gte(notificationHistory.createdAt, startDate),
            lte(notificationHistory.createdAt, endDate)
          )
        );

      // Push notifications sent
      const pushSent = await db
        .select({ count: count() })
        .from(notificationHistory)
        .where(
          and(
            eq(notificationHistory.userId, ctx.user.id),
            eq(notificationHistory.pushSent, true),
            gte(notificationHistory.createdAt, startDate),
            lte(notificationHistory.createdAt, endDate)
          )
        );

      // Email notifications sent
      const emailSent = await db
        .select({ count: count() })
        .from(notificationHistory)
        .where(
          and(
            eq(notificationHistory.userId, ctx.user.id),
            eq(notificationHistory.emailSent, true),
            gte(notificationHistory.createdAt, startDate),
            lte(notificationHistory.createdAt, endDate)
          )
        );

      // Notifications opened
      const opened = await db
        .select({ count: count() })
        .from(notificationHistory)
        .innerJoin(
          notificationAnalytics,
          eq(notificationHistory.id, notificationAnalytics.notificationId)
        )
        .where(
          and(
            eq(notificationHistory.userId, ctx.user.id),
            sql`${notificationAnalytics.openedAt} IS NOT NULL`,
            gte(notificationHistory.createdAt, startDate),
            lte(notificationHistory.createdAt, endDate)
          )
        );

      // Notifications clicked
      const clicked = await db
        .select({ count: count() })
        .from(notificationHistory)
        .innerJoin(
          notificationAnalytics,
          eq(notificationHistory.id, notificationAnalytics.notificationId)
        )
        .where(
          and(
            eq(notificationHistory.userId, ctx.user.id),
            sql`${notificationAnalytics.clickedAt} IS NOT NULL`,
            gte(notificationHistory.createdAt, startDate),
            lte(notificationHistory.createdAt, endDate)
          )
        );

      const totalCount = totalSent[0]?.count || 0;
      const openedCount = opened[0]?.count || 0;
      const clickedCount = clicked[0]?.count || 0;

      return {
        totalSent: totalCount,
        pushSent: pushSent[0]?.count || 0,
        emailSent: emailSent[0]?.count || 0,
        opened: openedCount,
        clicked: clickedCount,
        openRate: totalCount > 0 ? (openedCount / totalCount) * 100 : 0,
        clickRate: totalCount > 0 ? (clickedCount / totalCount) * 100 : 0,
        clickThroughRate: openedCount > 0 ? (clickedCount / openedCount) * 100 : 0,
      };
    }),

  /**
   * Get notification stats by type
   */
  getStatsByType: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const startDate = input.startDate ? new Date(input.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = input.endDate ? new Date(input.endDate) : new Date();

      // Get counts by notification type
      const statsByType = await db
        .select({
          type: notificationHistory.type,
          totalSent: count(notificationHistory.id),
          opened: sql<number>`SUM(CASE WHEN ${notificationAnalytics.openedAt} IS NOT NULL THEN 1 ELSE 0 END)`,
          clicked: sql<number>`SUM(CASE WHEN ${notificationAnalytics.clickedAt} IS NOT NULL THEN 1 ELSE 0 END)`,
        })
        .from(notificationHistory)
        .leftJoin(
          notificationAnalytics,
          eq(notificationHistory.id, notificationAnalytics.notificationId)
        )
        .where(
          and(
            eq(notificationHistory.userId, ctx.user.id),
            gte(notificationHistory.createdAt, startDate),
            lte(notificationHistory.createdAt, endDate)
          )
        )
        .groupBy(notificationHistory.type);

      return statsByType.map((stat) => ({
        type: stat.type,
        totalSent: stat.totalSent,
        opened: Number(stat.opened) || 0,
        clicked: Number(stat.clicked) || 0,
        openRate: stat.totalSent > 0 ? (Number(stat.opened) / stat.totalSent) * 100 : 0,
        clickRate: stat.totalSent > 0 ? (Number(stat.clicked) / stat.totalSent) * 100 : 0,
      }));
    }),

  /**
   * Get notification delivery timeline
   */
  getDeliveryTimeline: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        groupBy: z.enum(["hour", "day", "week"]).default("day"),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const startDate = input.startDate ? new Date(input.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = input.endDate ? new Date(input.endDate) : new Date();

      // Determine date format based on groupBy
      let dateFormat: string;
      switch (input.groupBy) {
        case "hour":
          dateFormat = "%Y-%m-%d %H:00:00";
          break;
        case "week":
          dateFormat = "%Y-%W";
          break;
        case "day":
        default:
          dateFormat = "%Y-%m-%d";
          break;
      }

      const timeline = await db
        .select({
          period: sql<string>`DATE_FORMAT(${notificationHistory.createdAt}, ${dateFormat})`,
          totalSent: count(notificationHistory.id),
          opened: sql<number>`SUM(CASE WHEN ${notificationAnalytics.openedAt} IS NOT NULL THEN 1 ELSE 0 END)`,
          clicked: sql<number>`SUM(CASE WHEN ${notificationAnalytics.clickedAt} IS NOT NULL THEN 1 ELSE 0 END)`,
        })
        .from(notificationHistory)
        .leftJoin(
          notificationAnalytics,
          eq(notificationHistory.id, notificationAnalytics.notificationId)
        )
        .where(
          and(
            eq(notificationHistory.userId, ctx.user.id),
            gte(notificationHistory.createdAt, startDate),
            lte(notificationHistory.createdAt, endDate)
          )
        )
        .groupBy(sql`DATE_FORMAT(${notificationHistory.createdAt}, ${dateFormat})`)
        .orderBy(sql`DATE_FORMAT(${notificationHistory.createdAt}, ${dateFormat})`);

      return timeline.map((item) => ({
        period: item.period,
        totalSent: item.totalSent,
        opened: Number(item.opened) || 0,
        clicked: Number(item.clicked) || 0,
        openRate: item.totalSent > 0 ? (Number(item.opened) / item.totalSent) * 100 : 0,
      }));
    }),

  /**
   * Get top performing notifications
   */
  getTopPerforming: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        sortBy: z.enum(["opens", "clicks", "openRate", "clickRate"]).default("opens"),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const notifications = await db
        .select({
          id: notificationHistory.id,
          type: notificationHistory.type,
          title: notificationHistory.title,
          message: notificationHistory.message,
          createdAt: notificationHistory.createdAt,
          opened: sql<number>`COUNT(CASE WHEN ${notificationAnalytics.openedAt} IS NOT NULL THEN 1 END)`,
          clicked: sql<number>`COUNT(CASE WHEN ${notificationAnalytics.clickedAt} IS NOT NULL THEN 1 END)`,
        })
        .from(notificationHistory)
        .leftJoin(
          notificationAnalytics,
          eq(notificationHistory.id, notificationAnalytics.notificationId)
        )
        .where(eq(notificationHistory.userId, ctx.user.id))
        .groupBy(notificationHistory.id)
        .orderBy(
          input.sortBy === "opens"
            ? desc(sql`COUNT(CASE WHEN ${notificationAnalytics.openedAt} IS NOT NULL THEN 1 END)`)
            : input.sortBy === "clicks"
            ? desc(sql`COUNT(CASE WHEN ${notificationAnalytics.clickedAt} IS NOT NULL THEN 1 END)`)
            : desc(notificationHistory.createdAt)
        )
        .limit(input.limit);

      return notifications.map((notif) => ({
        id: notif.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        createdAt: notif.createdAt,
        opened: Number(notif.opened) || 0,
        clicked: Number(notif.clicked) || 0,
      }));
    }),

  /**
   * Record notification open event
   */
  recordOpen: protectedProcedure
    .input(
      z.object({
        notificationId: z.number(),
        deviceType: z.string().optional(),
        browserType: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Check if analytics record exists
      const existing = await db
        .select()
        .from(notificationAnalytics)
        .where(
          and(
            eq(notificationAnalytics.notificationId, input.notificationId),
            eq(notificationAnalytics.userId, ctx.user.id)
          )
        )
        .limit(1);

      const now = new Date();

      if (existing.length === 0) {
        // Create new analytics record
        await db.insert(notificationAnalytics).values({
          notificationId: input.notificationId,
          userId: ctx.user.id,
          openedAt: now,
          deliveredAt: now,
          deliveryStatus: "delivered",
          deviceType: input.deviceType,
          browserType: input.browserType,
        });
      } else if (!existing[0]!.openedAt) {
        // Update existing record with open time
        await db
          .update(notificationAnalytics)
          .set({
            openedAt: now,
            deviceType: input.deviceType || existing[0]!.deviceType,
            browserType: input.browserType || existing[0]!.browserType,
            updatedAt: now,
          })
          .where(eq(notificationAnalytics.id, existing[0]!.id));
      }

      return { success: true };
    }),

  /**
   * Record notification click event
   */
  recordClick: protectedProcedure
    .input(
      z.object({
        notificationId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Check if analytics record exists
      const existing = await db
        .select()
        .from(notificationAnalytics)
        .where(
          and(
            eq(notificationAnalytics.notificationId, input.notificationId),
            eq(notificationAnalytics.userId, ctx.user.id)
          )
        )
        .limit(1);

      const now = new Date();

      if (existing.length === 0) {
        // Create new analytics record with click
        await db.insert(notificationAnalytics).values({
          notificationId: input.notificationId,
          userId: ctx.user.id,
          clickedAt: now,
          openedAt: now, // Clicking implies opening
          deliveredAt: now,
          deliveryStatus: "delivered",
        });
      } else if (!existing[0]!.clickedAt) {
        // Update existing record with click time
        await db
          .update(notificationAnalytics)
          .set({
            clickedAt: now,
            openedAt: existing[0]!.openedAt || now, // Set opened if not already set
            updatedAt: now,
          })
          .where(eq(notificationAnalytics.id, existing[0]!.id));
      }

      return { success: true };
    }),
});
