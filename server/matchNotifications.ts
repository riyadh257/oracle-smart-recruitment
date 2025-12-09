import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { matchHistory, notificationHistory, matchDigestPreferences, jobs, candidates } from "../drizzle/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import { observable } from "@trpc/server/observable";
import { EventEmitter } from "events";

/**
 * Match Notifications Router
 * Handles real-time notifications for high-score matches (>85%) and email digests
 */

// Event emitter for real-time match notifications
export const matchNotificationEmitter = new EventEmitter();

export const matchNotificationsRouter = router({
  /**
   * Subscribe to real-time match notifications
   * Emits when a new high-score match (>85%) is created
   */
  subscribeToMatches: protectedProcedure.subscription(({ ctx }) => {
    return observable<{
      matchId: number;
      jobId: number;
      jobTitle: string;
      candidateName: string;
      overallScore: number;
      cultureFitScore: number | null;
      wellbeingScore: number | null;
      timestamp: Date;
    }>((emit) => {
      const onMatch = (data: any) => {
        // Only send to the relevant user
        if (data.userId === ctx.user.id) {
          emit.next(data);
        }
      };

      matchNotificationEmitter.on("newHighScoreMatch", onMatch);

      return () => {
        matchNotificationEmitter.off("newHighScoreMatch", onMatch);
      };
    });
  }),

  /**
   * Get recent match notifications for the current user
   */
  getRecentMatchNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        unreadOnly: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const notifications = await db
        .select({
          id: notificationHistory.id,
          type: notificationHistory.type,
          title: notificationHistory.title,
          message: notificationHistory.message,
          metadata: notificationHistory.metadata,
          isRead: notificationHistory.isRead,
          createdAt: notificationHistory.createdAt,
        })
        .from(notificationHistory)
        .where(
          and(
            eq(notificationHistory.userId, ctx.user.id),
            eq(notificationHistory.type, "match_alert"),
            input.unreadOnly ? eq(notificationHistory.isRead, 0) : undefined
          )
        )
        .orderBy(desc(notificationHistory.createdAt))
        .limit(input.limit);

      return notifications;
    }),

  /**
   * Mark match notification as read
   */
  markNotificationAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(notificationHistory)
        .set({ isRead: 1 })
        .where(
          and(
            eq(notificationHistory.id, input.notificationId),
            eq(notificationHistory.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  /**
   * Get or create match digest preferences for current user
   */
  getDigestPreferences: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    let prefs = await db
      .select()
      .from(matchDigestPreferences)
      .where(eq(matchDigestPreferences.userId, ctx.user.id))
      .limit(1);

    // Create default preferences if none exist
    if (prefs.length === 0) {
      await db.insert(matchDigestPreferences).values({
        userId: ctx.user.id,
        enabled: 1,
        frequency: "daily",
        deliveryTime: "08:00",
        minMatchScore: 70,
        maxMatchesPerDigest: 10,
        includeNewCandidates: 1,
        includeScoreChanges: 1,
        includeSavedMatches: 1,
      });

      prefs = await db
        .select()
        .from(matchDigestPreferences)
        .where(eq(matchDigestPreferences.userId, ctx.user.id))
        .limit(1);
    }

    return prefs[0];
  }),

  /**
   * Update match digest preferences
   */
  updateDigestPreferences: protectedProcedure
    .input(
      z.object({
        enabled: z.boolean().optional(),
        frequency: z.enum(["daily", "weekly", "biweekly"]).optional(),
        deliveryTime: z.string().optional(),
        minMatchScore: z.number().min(0).max(100).optional(),
        maxMatchesPerDigest: z.number().min(1).max(50).optional(),
        includeNewCandidates: z.boolean().optional(),
        includeScoreChanges: z.boolean().optional(),
        includeSavedMatches: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updateData: any = {};
      if (input.enabled !== undefined) updateData.enabled = input.enabled ? 1 : 0;
      if (input.frequency) updateData.frequency = input.frequency;
      if (input.deliveryTime) updateData.deliveryTime = input.deliveryTime;
      if (input.minMatchScore !== undefined) updateData.minMatchScore = input.minMatchScore;
      if (input.maxMatchesPerDigest !== undefined) updateData.maxMatchesPerDigest = input.maxMatchesPerDigest;
      if (input.includeNewCandidates !== undefined) updateData.includeNewCandidates = input.includeNewCandidates ? 1 : 0;
      if (input.includeScoreChanges !== undefined) updateData.includeScoreChanges = input.includeScoreChanges ? 1 : 0;
      if (input.includeSavedMatches !== undefined) updateData.includeSavedMatches = input.includeSavedMatches ? 1 : 0;

      await db
        .update(matchDigestPreferences)
        .set(updateData)
        .where(eq(matchDigestPreferences.userId, ctx.user.id));

      return { success: true };
    }),

  /**
   * Get matches for daily digest email
   * Used by scheduled job to generate email content
   */
  getMatchesForDigest: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get user's digest preferences
      const prefs = await db
        .select()
        .from(matchDigestPreferences)
        .where(eq(matchDigestPreferences.userId, input.userId))
        .limit(1);

      if (!prefs[0] || !prefs[0].enabled) {
        return [];
      }

      const preferences = prefs[0];

      // Calculate time window based on frequency
      const now = new Date();
      const windowStart = new Date();
      if (preferences.frequency === "daily") {
        windowStart.setDate(now.getDate() - 1);
      } else if (preferences.frequency === "weekly") {
        windowStart.setDate(now.getDate() - 7);
      } else if (preferences.frequency === "biweekly") {
        windowStart.setDate(now.getDate() - 14);
      }

      // Get matches within time window
      const matches = await db
        .select({
          matchId: matchHistory.id,
          jobId: matchHistory.jobId,
          jobTitle: jobs.title,
          candidateId: matchHistory.candidateId,
          candidateName: candidates.name,
          candidateEmail: candidates.email,
          overallScore: matchHistory.overallScore,
          cultureFitScore: matchHistory.cultureFitScore,
          wellbeingScore: matchHistory.wellbeingScore,
          matchExplanation: matchHistory.matchExplanation,
          createdAt: matchHistory.createdAt,
        })
        .from(matchHistory)
        .innerJoin(jobs, eq(matchHistory.jobId, jobs.id))
        .innerJoin(candidates, eq(matchHistory.candidateId, candidates.id))
        .where(
          and(
            eq(matchHistory.userId, input.userId),
            gte(matchHistory.overallScore, preferences.minMatchScore),
            sql`${matchHistory.createdAt} >= ${windowStart.toISOString()}`
          )
        )
        .orderBy(desc(matchHistory.overallScore))
        .limit(preferences.maxMatchesPerDigest);

      return matches;
    }),

  /**
   * Trigger a high-score match notification
   * Called when a new match with score > 85% is created
   */
  triggerHighScoreMatchNotification: protectedProcedure
    .input(
      z.object({
        matchId: z.number(),
        userId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get match details
      const match = await db
        .select({
          matchId: matchHistory.id,
          jobId: matchHistory.jobId,
          jobTitle: jobs.title,
          candidateId: matchHistory.candidateId,
          candidateName: candidates.name,
          overallScore: matchHistory.overallScore,
          cultureFitScore: matchHistory.cultureFitScore,
          wellbeingScore: matchHistory.wellbeingScore,
        })
        .from(matchHistory)
        .innerJoin(jobs, eq(matchHistory.jobId, jobs.id))
        .innerJoin(candidates, eq(matchHistory.candidateId, candidates.id))
        .where(eq(matchHistory.id, input.matchId))
        .limit(1);

      if (!match[0]) {
        throw new Error("Match not found");
      }

      const matchData = match[0];

      // Create notification in database
      await db.insert(notificationHistory).values({
        userId: input.userId,
        type: "match_alert",
        title: `High-Score Match Found: ${matchData.overallScore}%`,
        message: `${matchData.candidateName} is an excellent match for ${matchData.jobTitle}`,
        metadata: JSON.stringify({
          matchId: matchData.matchId,
          jobId: matchData.jobId,
          candidateId: matchData.candidateId,
          overallScore: matchData.overallScore,
        }),
        isRead: 0,
      });

      // Emit real-time notification via WebSocket
      matchNotificationEmitter.emit("newHighScoreMatch", {
        userId: input.userId,
        matchId: matchData.matchId,
        jobId: matchData.jobId,
        jobTitle: matchData.jobTitle,
        candidateName: matchData.candidateName,
        overallScore: matchData.overallScore,
        cultureFitScore: matchData.cultureFitScore,
        wellbeingScore: matchData.wellbeingScore,
        timestamp: new Date(),
      });

      return { success: true };
    }),
});
