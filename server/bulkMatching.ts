import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { candidates, jobs, applications, matchHistory, users } from "../drizzle/schema";
import { eq, and, isNull, gte, sql } from "drizzle-orm";
import { findMatchesForCandidate, findMatchesForJob, runBatchMatching } from "./matchingService";

/**
 * Bulk Matching Service
 * Handles automated matching of candidates to jobs at scale
 */

export const bulkMatchingRouter = router({
  /**
   * Match all active candidates to all open jobs
   * This is a heavy operation, typically run overnight
   */
  matchAllCandidatesToJobs: adminProcedure
    .input(z.object({
      minScore: z.number().min(0).max(100).default(50),
      createApplications: z.boolean().default(false), // Whether to auto-create applications
      batchSize: z.number().min(10).max(500).default(100),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { minScore, createApplications, batchSize } = input;
      
      const startTime = Date.now();
      let totalMatches = 0;
      let totalCandidates = 0;
      let totalJobs = 0;
      let applicationsCreated = 0;

      try {
        // Get all active candidates
        const activeCandidates = await db
          .select()
          .from(candidates)
          .where(eq(candidates.isAvailable, 1));

        // Get all open jobs
        const openJobs = await db
          .select()
          .from(jobs)
          .where(eq(jobs.status, "open"));

        totalCandidates = activeCandidates.length;
        totalJobs = openJobs.length;

        // Process in batches to avoid memory issues
        for (let i = 0; i < activeCandidates.length; i += batchSize) {
          const candidateBatch = activeCandidates.slice(i, i + batchSize);

          for (const candidate of candidateBatch) {
            for (const job of openJobs) {
              // Check if application already exists
              const existingApp = await db
                .select()
                .from(applications)
                .where(
                  and(
                    eq(applications.candidateId, candidate.id),
                    eq(applications.jobId, job.id)
                  )
                )
                .limit(1);

              // Skip detailed matching for now - just count existing
              if (existingApp.length > 0) {
                totalMatches++;
              }
            }
          }
        }

        const duration = Date.now() - startTime;

        return {
          success: true,
          stats: {
            totalCandidates,
            totalJobs,
            totalMatches,
            applicationsCreated,
            durationMs: duration,
            durationMinutes: Math.round(duration / 60000),
          },
        };
      } catch (error) {
        console.error("[Bulk Matching] Error:", error);
        throw new Error(`Bulk matching failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  /**
   * Match new candidates (added in last N days) to all open jobs
   */
  matchNewCandidates: adminProcedure
    .input(z.object({
      daysBack: z.number().min(1).max(30).default(1),
      minScore: z.number().min(0).max(100).default(60),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { daysBack, minScore } = input;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      // Get new candidates
      const newCandidates = await db
        .select()
        .from(candidates)
        .where(
          and(
            eq(candidates.isAvailable, 1),
            gte(candidates.createdAt, cutoffDate)
          )
        );

      // Get all open jobs
      const openJobs = await db
        .select()
        .from(jobs)
        .where(eq(jobs.status, "open"));

      let matches = 0;

      // Use existing batch matching service
      for (const candidate of newCandidates) {
        const candidateMatches = await findMatchesForCandidate(candidate.id, openJobs.length);
        matches += candidateMatches.filter(m => m.matchScore >= minScore).length;
      }

      return {
        success: true,
        newCandidates: newCandidates.length,
        openJobs: openJobs.length,
        matchesCreated: matches,
      };
    }),

  /**
   * Match all candidates to new jobs (posted in last N days)
   */
  matchNewJobs: adminProcedure
    .input(z.object({
      daysBack: z.number().min(1).max(30).default(1),
      minScore: z.number().min(0).max(100).default(60),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { daysBack, minScore } = input;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      // Get new jobs
      const newJobs = await db
        .select()
        .from(jobs)
        .where(
          and(
            eq(jobs.status, "open"),
            gte(jobs.createdAt, cutoffDate)
          )
        );

      // Get all active candidates
      const activeCandidates = await db
        .select()
        .from(candidates)
        .where(eq(candidates.isAvailable, 1));

      let matches = 0;

      // Use existing batch matching service
      for (const job of newJobs) {
        const jobMatches = await findMatchesForJob(job.id, activeCandidates.length);
        matches += jobMatches.filter(m => m.matchScore >= minScore).length;
      }

      return {
        success: true,
        newJobs: newJobs.length,
        activeCandidates: activeCandidates.length,
        matchesCreated: matches,
      };
    }),

  /**
   * Get bulk matching status and history
   */
  getBulkMatchingStats: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get recent bulk-matched applications
    const recentMatches = await db
      .select({
        date: sql<string>`DATE(${applications.createdAt})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(applications)
      .where(
        and(
          sql`${applications.source} LIKE '%bulk%'`,
          gte(applications.createdAt, sql`DATE_SUB(NOW(), INTERVAL 30 DAY)`)
        )
      )
      .groupBy(sql`DATE(${applications.createdAt})`)
      .orderBy(sql`DATE(${applications.createdAt}) DESC`);

    // Get total stats
    const totalBulkMatches = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(applications)
      .where(sql`${applications.source} LIKE '%bulk%'`);

    return {
      recentMatches,
      totalBulkMatches: totalBulkMatches[0]?.count || 0,
    };
  }),
});
