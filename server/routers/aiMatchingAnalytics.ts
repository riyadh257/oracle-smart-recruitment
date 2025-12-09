/**
 * AI Matching Analytics Router
 * Phase 15 Continuation: Match history, success analysis, and predictive insights
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { matchHistory, matchAnalytics, applications, candidates, jobs } from "../../drizzle/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

// Helper to calculate time range
function getTimeRangeDate(range: "7d" | "30d" | "90d" | "1y"): Date {
  const now = new Date();
  switch (range) {
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case "1y":
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  }
}

export const aiMatchingAnalyticsRouter = router({
  /**
   * Get match analytics for a time period
   */
  getMatchAnalytics: protectedProcedure
    .input(z.object({
      timeRange: z.enum(["7d", "30d", "90d", "1y"]).default("30d")
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const startDate = getTimeRangeDate(input.timeRange);

      // Get all matches in time range
      const matches = await db.select()
        .from(matchHistory)
        .where(and(
          eq(matchHistory.userId, ctx.user.id),
          gte(matchHistory.createdAt, startDate.toISOString())
        ));

      // Calculate metrics
      const totalMatches = matches.length;
      const totalHires = matches.filter(m => m.outcome === "hired").length;
      const successRate = totalMatches > 0 ? Math.round((totalHires / totalMatches) * 100) : 0;

      // Calculate average time to hire
      const hiredMatches = matches.filter(m => m.outcome === "hired" && m.outcomeDate);
      const timeToHireValues = hiredMatches.map(m => {
        if (!m.outcomeDate || !m.createdAt) return 0;
        const created = new Date(m.createdAt).getTime();
        const outcome = new Date(m.outcomeDate).getTime();
        return Math.round((outcome - created) / (1000 * 60 * 60 * 24)); // Days
      });
      const averageTimeToHire = timeToHireValues.length > 0
        ? Math.round(timeToHireValues.reduce((a, b) => a + b, 0) / timeToHireValues.length)
        : null;

      // Calculate score accuracy (correlation between high scores and hires)
      const highScoreMatches = matches.filter(m => m.overallScore >= 80);
      const highScoreHires = highScoreMatches.filter(m => m.outcome === "hired").length;
      const scoreAccuracy = highScoreMatches.length > 0
        ? Math.round((highScoreHires / highScoreMatches.length) * 100)
        : 0;

      // Calculate average scores by outcome
      const hiredScores = matches.filter(m => m.outcome === "hired").map(m => m.overallScore);
      const rejectedScores = matches.filter(m => m.outcome === "rejected").map(m => m.overallScore);
      const averageHiredScore = hiredScores.length > 0
        ? Math.round(hiredScores.reduce((a, b) => a + b, 0) / hiredScores.length)
        : null;
      const averageRejectedScore = rejectedScores.length > 0
        ? Math.round(rejectedScores.reduce((a, b) => a + b, 0) / rejectedScores.length)
        : null;
      const averageMatchScore = matches.length > 0
        ? Math.round(matches.reduce((sum, m) => sum + m.overallScore, 0) / matches.length)
        : null;

      // Calculate component importance (based on correlation with hires)
      const cultureScores = matches.filter(m => m.cultureFitScore !== null).map(m => m.cultureFitScore!);
      const wellbeingScores = matches.filter(m => m.wellbeingScore !== null).map(m => m.wellbeingScore!);
      const technicalScores = matches.filter(m => m.technicalScore !== null).map(m => m.technicalScore!);

      // Simple importance calculation: higher average for hired candidates = more important
      const hiredCultureAvg = matches.filter(m => m.outcome === "hired" && m.cultureFitScore).reduce((sum, m) => sum + (m.cultureFitScore || 0), 0) / (matches.filter(m => m.outcome === "hired" && m.cultureFitScore).length || 1);
      const hiredWellbeingAvg = matches.filter(m => m.outcome === "hired" && m.wellbeingScore).reduce((sum, m) => sum + (m.wellbeingScore || 0), 0) / (matches.filter(m => m.outcome === "hired" && m.wellbeingScore).length || 1);
      const hiredTechnicalAvg = matches.filter(m => m.outcome === "hired" && m.technicalScore).reduce((sum, m) => sum + (m.technicalScore || 0), 0) / (matches.filter(m => m.outcome === "hired" && m.technicalScore).length || 1);

      const totalImportance = hiredCultureAvg + hiredWellbeingAvg + hiredTechnicalAvg;
      const cultureFitImportance = totalImportance > 0 ? Math.round((hiredCultureAvg / totalImportance) * 100) : 33;
      const wellbeingImportance = totalImportance > 0 ? Math.round((hiredWellbeingAvg / totalImportance) * 100) : 33;
      const technicalImportance = totalImportance > 0 ? Math.round((hiredTechnicalAvg / totalImportance) * 100) : 34;

      return {
        totalMatches,
        totalHires,
        successRate,
        averageTimeToHire,
        scoreAccuracy,
        averageMatchScore,
        averageHiredScore,
        averageRejectedScore,
        cultureFitImportance,
        wellbeingImportance,
        technicalImportance
      };
    }),

  /**
   * Get match history with outcomes
   */
  getMatchHistory: protectedProcedure
    .input(z.object({
      limit: z.number().default(100),
      includeOutcomes: z.boolean().default(true)
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const history = await db.select()
        .from(matchHistory)
        .where(eq(matchHistory.userId, ctx.user.id))
        .orderBy(desc(matchHistory.createdAt))
        .limit(input.limit);

      return history;
    }),

  /**
   * Get attribute correlation analysis
   */
  getAttributeCorrelation: protectedProcedure
    .input(z.object({
      timeRange: z.enum(["7d", "30d", "90d", "1y"]).default("30d")
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const startDate = getTimeRangeDate(input.timeRange);

      // Get matches with outcomes
      const matches = await db.select()
        .from(matchHistory)
        .where(and(
          eq(matchHistory.userId, ctx.user.id),
          gte(matchHistory.createdAt, startDate.toISOString())
        ));

      // Extract top attributes from match breakdowns
      const attributeStats: Record<string, { total: number; hired: number; correlation: number }> = {};

      matches.forEach(match => {
        if (!match.topAttributes) return;
        
        const attrs = match.topAttributes as any[];
        attrs.forEach((attr: any) => {
          if (!attributeStats[attr.name]) {
            attributeStats[attr.name] = { total: 0, hired: 0, correlation: 0 };
          }
          attributeStats[attr.name].total++;
          if (match.outcome === "hired") {
            attributeStats[attr.name].hired++;
          }
        });
      });

      // Calculate correlation scores
      const topAttributes = Object.entries(attributeStats)
        .map(([name, stats]) => ({
          name,
          total: stats.total,
          hired: stats.hired,
          correlation: stats.total > 0 ? stats.hired / stats.total : 0,
          insight: stats.total >= 5
            ? `${stats.hired} out of ${stats.total} candidates with this attribute were hired`
            : "Insufficient data for reliable correlation"
        }))
        .sort((a, b) => b.correlation - a.correlation)
        .slice(0, 20);

      return {
        topAttributes
      };
    }),

  /**
   * Record match outcome (hired/rejected/withdrawn)
   */
  recordMatchOutcome: protectedProcedure
    .input(z.object({
      matchId: z.number(),
      outcome: z.enum(["hired", "rejected", "withdrawn", "pending"]),
      notes: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Update match history
      await db.update(matchHistory)
        .set({
          outcome: input.outcome,
          outcomeDate: new Date().toISOString(),
          outcomeNotes: input.notes || null,
          updatedAt: new Date().toISOString()
        })
        .where(and(
          eq(matchHistory.id, input.matchId),
          eq(matchHistory.userId, ctx.user.id)
        ));

      return { success: true };
    }),

  /**
   * Get match success trends over time
   */
  getMatchTrends: protectedProcedure
    .input(z.object({
      timeRange: z.enum(["7d", "30d", "90d", "1y"]).default("30d"),
      groupBy: z.enum(["day", "week", "month"]).default("day")
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const startDate = getTimeRangeDate(input.timeRange);

      // Get all matches in range
      const matches = await db.select()
        .from(matchHistory)
        .where(and(
          eq(matchHistory.userId, ctx.user.id),
          gte(matchHistory.createdAt, startDate.toISOString())
        ))
        .orderBy(matchHistory.createdAt);

      // Group by time period
      const trends: Record<string, { date: string; totalMatches: number; hires: number; avgScore: number }> = {};

      matches.forEach(match => {
        if (!match.createdAt) return;
        
        const date = new Date(match.createdAt);
        let key: string;

        if (input.groupBy === "day") {
          key = date.toISOString().split("T")[0];
        } else if (input.groupBy === "week") {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split("T")[0];
        } else {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        }

        if (!trends[key]) {
          trends[key] = { date: key, totalMatches: 0, hires: 0, avgScore: 0 };
        }

        trends[key].totalMatches++;
        if (match.outcome === "hired") {
          trends[key].hires++;
        }
        trends[key].avgScore += match.overallScore;
      });

      // Calculate averages
      const trendData = Object.values(trends).map(t => ({
        ...t,
        avgScore: Math.round(t.avgScore / t.totalMatches),
        successRate: t.totalMatches > 0 ? Math.round((t.hires / t.totalMatches) * 100) : 0
      }));

      return trendData;
    })
});
