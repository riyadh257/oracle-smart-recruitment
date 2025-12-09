import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { digestDeliveryLog, users, employers } from "../../drizzle/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";

/**
 * Digest Analytics Router
 * Provides analytics for digest email performance including open rates,
 * click patterns, and engagement trends
 */

export const digestAnalyticsRouter = router({
  /**
   * Get digest analytics overview for a date range
   */
  getDigestOverview: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const start = new Date(input.startDate);
      const end = new Date(input.endDate);

      // Get overall statistics
      const stats = await db
        .select({
          totalSent: sql<number>`COUNT(*)`,
          totalOpened: sql<number>`SUM(CASE WHEN ${digestDeliveryLog.emailOpenedAt} IS NOT NULL THEN 1 ELSE 0 END)`,
          totalClicked: sql<number>`SUM(CASE WHEN ${digestDeliveryLog.emailClickedAt} IS NOT NULL THEN 1 ELSE 0 END)`,
          avgMatchCount: sql<number>`AVG(${digestDeliveryLog.matchCount})`,
          avgHighQualityMatches: sql<number>`AVG(${digestDeliveryLog.highQualityMatchCount})`,
        })
        .from(digestDeliveryLog)
        .where(
          and(
            gte(digestDeliveryLog.createdAt, start),
            lte(digestDeliveryLog.createdAt, end),
            eq(digestDeliveryLog.emailSent, true)
          )
        );

      const result = stats[0];
      const totalSent = Number(result?.totalSent || 0);
      const totalOpened = Number(result?.totalOpened || 0);
      const totalClicked = Number(result?.totalClicked || 0);

      return {
        totalSent,
        totalOpened,
        totalClicked,
        openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
        clickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
        clickThroughRate: totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0,
        avgMatchCount: Number(result?.avgMatchCount || 0),
        avgHighQualityMatches: Number(result?.avgHighQualityMatches || 0),
      };
    }),

  /**
   * Get daily digest trends over time
   */
  getDigestTrends: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const start = new Date(input.startDate);
      const end = new Date(input.endDate);

      const trends = await db
        .select({
          date: sql<string>`DATE(${digestDeliveryLog.createdAt})`,
          sent: sql<number>`COUNT(*)`,
          opened: sql<number>`SUM(CASE WHEN ${digestDeliveryLog.emailOpenedAt} IS NOT NULL THEN 1 ELSE 0 END)`,
          clicked: sql<number>`SUM(CASE WHEN ${digestDeliveryLog.emailClickedAt} IS NOT NULL THEN 1 ELSE 0 END)`,
          avgMatches: sql<number>`AVG(${digestDeliveryLog.matchCount})`,
        })
        .from(digestDeliveryLog)
        .where(
          and(
            gte(digestDeliveryLog.createdAt, start),
            lte(digestDeliveryLog.createdAt, end),
            eq(digestDeliveryLog.emailSent, true)
          )
        )
        .groupBy(sql`DATE(${digestDeliveryLog.createdAt})`)
        .orderBy(sql`DATE(${digestDeliveryLog.createdAt})`);

      return trends.map(trend => ({
        date: trend.date,
        sent: Number(trend.sent),
        opened: Number(trend.opened),
        clicked: Number(trend.clicked),
        openRate: Number(trend.sent) > 0 ? (Number(trend.opened) / Number(trend.sent)) * 100 : 0,
        clickRate: Number(trend.sent) > 0 ? (Number(trend.clicked) / Number(trend.sent)) * 100 : 0,
        avgMatches: Number(trend.avgMatches || 0),
      }));
    }),

  /**
   * Get digest performance by type (daily, weekly, biweekly)
   */
  getDigestPerformanceByType: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const start = new Date(input.startDate);
      const end = new Date(input.endDate);

      const performance = await db
        .select({
          digestType: digestDeliveryLog.digestType,
          sent: sql<number>`COUNT(*)`,
          opened: sql<number>`SUM(CASE WHEN ${digestDeliveryLog.emailOpenedAt} IS NOT NULL THEN 1 ELSE 0 END)`,
          clicked: sql<number>`SUM(CASE WHEN ${digestDeliveryLog.emailClickedAt} IS NOT NULL THEN 1 ELSE 0 END)`,
          avgMatches: sql<number>`AVG(${digestDeliveryLog.matchCount})`,
        })
        .from(digestDeliveryLog)
        .where(
          and(
            gte(digestDeliveryLog.createdAt, start),
            lte(digestDeliveryLog.createdAt, end),
            eq(digestDeliveryLog.emailSent, true)
          )
        )
        .groupBy(digestDeliveryLog.digestType);

      return performance.map(perf => ({
        digestType: perf.digestType,
        sent: Number(perf.sent),
        opened: Number(perf.opened),
        clicked: Number(perf.clicked),
        openRate: Number(perf.sent) > 0 ? (Number(perf.opened) / Number(perf.sent)) * 100 : 0,
        clickRate: Number(perf.sent) > 0 ? (Number(perf.clicked) / Number(perf.sent)) * 100 : 0,
        avgMatches: Number(perf.avgMatches || 0),
      }));
    }),

  /**
   * Get top performing digests
   */
  getTopPerformingDigests: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      limit: z.number().default(10),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const start = new Date(input.startDate);
      const end = new Date(input.endDate);

      const topDigests = await db
        .select({
          id: digestDeliveryLog.id,
          userId: digestDeliveryLog.userId,
          userName: users.name,
          userEmail: users.email,
          digestType: digestDeliveryLog.digestType,
          matchCount: digestDeliveryLog.matchCount,
          highQualityMatchCount: digestDeliveryLog.highQualityMatchCount,
          emailOpenedAt: digestDeliveryLog.emailOpenedAt,
          emailClickedAt: digestDeliveryLog.emailClickedAt,
          createdAt: digestDeliveryLog.createdAt,
        })
        .from(digestDeliveryLog)
        .leftJoin(users, eq(digestDeliveryLog.userId, users.id))
        .where(
          and(
            gte(digestDeliveryLog.createdAt, start),
            lte(digestDeliveryLog.createdAt, end),
            eq(digestDeliveryLog.emailSent, true)
          )
        )
        .orderBy(desc(digestDeliveryLog.highQualityMatchCount))
        .limit(input.limit);

      return topDigests;
    }),

  /**
   * Get engagement patterns (time-based analysis)
   */
  getEngagementPatterns: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const start = new Date(input.startDate);
      const end = new Date(input.endDate);

      // Get hourly engagement patterns
      const hourlyPatterns = await db
        .select({
          hour: sql<number>`HOUR(${digestDeliveryLog.emailOpenedAt})`,
          openCount: sql<number>`COUNT(*)`,
        })
        .from(digestDeliveryLog)
        .where(
          and(
            gte(digestDeliveryLog.createdAt, start),
            lte(digestDeliveryLog.createdAt, end),
            sql`${digestDeliveryLog.emailOpenedAt} IS NOT NULL`
          )
        )
        .groupBy(sql`HOUR(${digestDeliveryLog.emailOpenedAt})`)
        .orderBy(sql`HOUR(${digestDeliveryLog.emailOpenedAt})`);

      // Get day of week patterns
      const dayPatterns = await db
        .select({
          dayOfWeek: sql<number>`DAYOFWEEK(${digestDeliveryLog.createdAt})`,
          sent: sql<number>`COUNT(*)`,
          opened: sql<number>`SUM(CASE WHEN ${digestDeliveryLog.emailOpenedAt} IS NOT NULL THEN 1 ELSE 0 END)`,
        })
        .from(digestDeliveryLog)
        .where(
          and(
            gte(digestDeliveryLog.createdAt, start),
            lte(digestDeliveryLog.createdAt, end),
            eq(digestDeliveryLog.emailSent, true)
          )
        )
        .groupBy(sql`DAYOFWEEK(${digestDeliveryLog.createdAt})`)
        .orderBy(sql`DAYOFWEEK(${digestDeliveryLog.createdAt})`);

      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

      return {
        hourlyPatterns: hourlyPatterns.map(p => ({
          hour: Number(p.hour),
          openCount: Number(p.openCount),
        })),
        dayPatterns: dayPatterns.map(p => ({
          dayOfWeek: Number(p.dayOfWeek),
          dayName: dayNames[Number(p.dayOfWeek) - 1] || "Unknown",
          sent: Number(p.sent),
          opened: Number(p.opened),
          openRate: Number(p.sent) > 0 ? (Number(p.opened) / Number(p.sent)) * 100 : 0,
        })),
      };
    }),

  /**
   * Get user-specific digest history
   */
  getUserDigestHistory: protectedProcedure
    .input(z.object({
      userId: z.number(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const history = await db
        .select()
        .from(digestDeliveryLog)
        .where(eq(digestDeliveryLog.userId, input.userId))
        .orderBy(desc(digestDeliveryLog.createdAt))
        .limit(input.limit);

      return history;
    }),
});
