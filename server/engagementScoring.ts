import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  candidateEngagementScores,
  engagementScoreHistory,
  candidates,
} from "../drizzle/schema";
import { eq, desc, and, gte } from "drizzle-orm";

/**
 * Engagement Scoring Algorithm
 * 
 * Overall Score (0-100) = Weighted average of:
 * - Email Engagement (40%): Opens + Clicks / Emails Sent
 * - Application Engagement (30%): Applications / Profile Views
 * - Interview Engagement (30%): Interview Responses / Interviews Scheduled
 */

interface EngagementMetrics {
  totalEmailsSent: number;
  totalEmailsOpened: number;
  totalEmailsClicked: number;
  totalSmsReceived: number;
  totalApplications: number;
  totalInterviewResponses: number;
  totalProfileViews: number;
}

function calculateEngagementScores(metrics: EngagementMetrics) {
  // Email engagement score (0-100)
  const emailEngagementScore =
    metrics.totalEmailsSent > 0
      ? Math.min(
          100,
          Math.round(
            ((metrics.totalEmailsOpened * 0.5 + metrics.totalEmailsClicked * 0.5) /
              metrics.totalEmailsSent) *
              100
          )
        )
      : 0;

  // Application engagement score (0-100)
  const applicationEngagementScore =
    metrics.totalProfileViews > 0
      ? Math.min(100, Math.round((metrics.totalApplications / metrics.totalProfileViews) * 100))
      : 0;

  // Interview engagement score (0-100)
  const interviewEngagementScore =
    metrics.totalApplications > 0
      ? Math.min(
          100,
          Math.round((metrics.totalInterviewResponses / metrics.totalApplications) * 100)
        )
      : 0;

  // Overall score (weighted average)
  const overallScore = Math.round(
    emailEngagementScore * 0.4 +
      applicationEngagementScore * 0.3 +
      interviewEngagementScore * 0.3
  );

  // Determine engagement level
  let engagementLevel: "very_high" | "high" | "medium" | "low" | "very_low";
  if (overallScore >= 80) engagementLevel = "very_high";
  else if (overallScore >= 60) engagementLevel = "high";
  else if (overallScore >= 40) engagementLevel = "medium";
  else if (overallScore >= 20) engagementLevel = "low";
  else engagementLevel = "very_low";

  return {
    overallScore,
    emailEngagementScore,
    applicationEngagementScore,
    interviewEngagementScore,
    engagementLevel,
  };
}

export const engagementScoringRouter = router({
  // Get engagement score for a candidate
  getCandidateScore: protectedProcedure
    .input(z.object({ candidateId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const scores = await db
        .select()
        .from(candidateEngagementScores)
        .where(eq(candidateEngagementScores.candidateId, input.candidateId))
        .limit(1);

      return scores[0] || null;
    }),

  // Update engagement metrics and recalculate score
  updateEngagementMetrics: protectedProcedure
    .input(
      z.object({
        candidateId: z.number(),
        emailsSent: z.number().optional(),
        emailsOpened: z.number().optional(),
        emailsClicked: z.number().optional(),
        smsReceived: z.number().optional(),
        applications: z.number().optional(),
        interviewResponses: z.number().optional(),
        profileViews: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Get current metrics
      const existing = await db
        .select()
        .from(candidateEngagementScores)
        .where(eq(candidateEngagementScores.candidateId, input.candidateId))
        .limit(1);

      const currentMetrics: EngagementMetrics = existing[0] || {
        totalEmailsSent: 0,
        totalEmailsOpened: 0,
        totalEmailsClicked: 0,
        totalSmsReceived: 0,
        totalApplications: 0,
        totalInterviewResponses: 0,
        totalProfileViews: 0,
      };

      // Update metrics
      const updatedMetrics: EngagementMetrics = {
        totalEmailsSent: currentMetrics.totalEmailsSent + (input.emailsSent || 0),
        totalEmailsOpened: currentMetrics.totalEmailsOpened + (input.emailsOpened || 0),
        totalEmailsClicked: currentMetrics.totalEmailsClicked + (input.emailsClicked || 0),
        totalSmsReceived: currentMetrics.totalSmsReceived + (input.smsReceived || 0),
        totalApplications: currentMetrics.totalApplications + (input.applications || 0),
        totalInterviewResponses:
          currentMetrics.totalInterviewResponses + (input.interviewResponses || 0),
        totalProfileViews: currentMetrics.totalProfileViews + (input.profileViews || 0),
      };

      // Calculate new scores
      const scores = calculateEngagementScores(updatedMetrics);

      // Upsert engagement score
      if (existing[0]) {
        await db
          .update(candidateEngagementScores)
          .set({
            ...updatedMetrics,
            ...scores,
            lastEngagementAt: new Date(),
            scoreCalculatedAt: new Date(),
          })
          .where(eq(candidateEngagementScores.candidateId, input.candidateId));
      } else {
        await db.insert(candidateEngagementScores).values({
          candidateId: input.candidateId,
          ...updatedMetrics,
          ...scores,
          firstEngagementAt: new Date(),
          lastEngagementAt: new Date(),
          scoreCalculatedAt: new Date(),
        });
      }

      // Record in history
      await db.insert(engagementScoreHistory).values({
        candidateId: input.candidateId,
        score: scores.overallScore,
        engagementLevel: scores.engagementLevel,
      });

      return { success: true, ...scores };
    }),

  // Get top engaged candidates
  getTopEngagedCandidates: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        minScore: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      let query = db
        .select({
          candidate: candidates,
          engagementScore: candidateEngagementScores,
        })
        .from(candidateEngagementScores)
        .innerJoin(candidates, eq(candidates.id, candidateEngagementScores.candidateId))
        .orderBy(desc(candidateEngagementScores.overallScore))
        .limit(input.limit);

      if (input.minScore) {
        query = query.where(gte(candidateEngagementScores.overallScore, input.minScore)) as any;
      }

      return await query;
    }),

  // Get engagement score history for a candidate
  getScoreHistory: protectedProcedure
    .input(
      z.object({
        candidateId: z.number(),
        limit: z.number().default(30),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      return await db
        .select()
        .from(engagementScoreHistory)
        .where(eq(engagementScoreHistory.candidateId, input.candidateId))
        .orderBy(desc(engagementScoreHistory.recordedAt))
        .limit(input.limit);
    }),

  // Get engagement level distribution
  getEngagementDistribution: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const allScores = await db.select().from(candidateEngagementScores);

    const distribution = {
      very_high: 0,
      high: 0,
      medium: 0,
      low: 0,
      very_low: 0,
    };

    allScores.forEach((score) => {
      distribution[score.engagementLevel]++;
    });

    return distribution;
  }),

  // Recalculate all engagement scores
  recalculateAllScores: protectedProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const allScores = await db.select().from(candidateEngagementScores);

    let updated = 0;
    for (const score of allScores) {
      const metrics: EngagementMetrics = {
        totalEmailsSent: score.totalEmailsSent,
        totalEmailsOpened: score.totalEmailsOpened,
        totalEmailsClicked: score.totalEmailsClicked,
        totalSmsReceived: score.totalSmsReceived,
        totalApplications: score.totalApplications,
        totalInterviewResponses: score.totalInterviewResponses,
        totalProfileViews: score.totalProfileViews,
      };

      const newScores = calculateEngagementScores(metrics);

      await db
        .update(candidateEngagementScores)
        .set({
          ...newScores,
          scoreCalculatedAt: new Date(),
        })
        .where(eq(candidateEngagementScores.id, score.id));

      updated++;
    }

    return { success: true, updated };
  }),
});
