import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { candidates, applications, jobs } from "../../drizzle/schema";
import { eq, and, or, like, gte, lte, inArray, sql, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Candidates Router
 * Provides candidate profile and application data access
 */
export const candidatesRouter = router({
  /**
   * Get candidate by ID
   */
  getById: protectedProcedure
    .input(z.object({ candidateId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const candidate = await db
        .select()
        .from(candidates)
        .where(eq(candidates.id, input.candidateId))
        .limit(1);

      if (!candidate[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Candidate not found",
        });
      }

      return candidate[0];
    }),

  /**
   * List candidates with advanced filtering
   */
  list: protectedProcedure
    .input(
      z.object({
        // Pagination
        limit: z.number().min(1).max(100).optional().default(20),
        offset: z.number().min(0).optional().default(0),
        
        // Search
        searchQuery: z.string().optional(),
        
        // Filters
        skills: z.array(z.string()).optional(),
        location: z.string().optional(),
        minExperience: z.number().optional(),
        maxExperience: z.number().optional(),
        isAvailable: z.boolean().optional(),
        profileStatus: z.enum(["incomplete", "active", "inactive"]).optional(),
        preferredWorkSetting: z.enum(["remote", "hybrid", "onsite", "flexible"]).optional(),
        
        // Sorting
        sortBy: z.enum(["createdAt", "updatedAt", "aiProfileScore", "yearsOfExperience"]).optional().default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return { candidates: [], total: 0 };
      }

      // Build WHERE conditions
      const conditions = [];

      // Search query (name or email)
      if (input.searchQuery) {
        const searchPattern = `%${input.searchQuery}%`;
        conditions.push(
          or(
            like(candidates.fullName, searchPattern),
            like(candidates.email, searchPattern),
            like(candidates.headline, searchPattern)
          )
        );
      }

      // Location filter
      if (input.location) {
        conditions.push(like(candidates.location, `%${input.location}%`));
      }

      // Experience range
      if (input.minExperience !== undefined) {
        conditions.push(gte(candidates.yearsOfExperience, input.minExperience));
      }
      if (input.maxExperience !== undefined) {
        conditions.push(lte(candidates.yearsOfExperience, input.maxExperience));
      }

      // Availability
      if (input.isAvailable !== undefined) {
        conditions.push(eq(candidates.isAvailable, input.isAvailable));
      }

      // Profile status
      if (input.profileStatus) {
        conditions.push(eq(candidates.profileStatus, input.profileStatus));
      }

      // Preferred work setting
      if (input.preferredWorkSetting) {
        conditions.push(eq(candidates.preferredWorkSetting, input.preferredWorkSetting));
      }

      // Skills filter (JSON array contains)
      if (input.skills && input.skills.length > 0) {
        // For MySQL JSON arrays, we need to check if any skill matches
        const skillConditions = input.skills.map((skill) =>
          sql`JSON_CONTAINS(${candidates.technicalSkills}, JSON_QUOTE(${skill}))`
        );
        conditions.push(or(...skillConditions));
      }

      // Build the WHERE clause
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(candidates)
        .where(whereClause);
      const total = countResult[0]?.count || 0;

      // Get candidates with sorting
      let query = db.select().from(candidates).where(whereClause);

      // Apply sorting
      const sortColumn = candidates[input.sortBy];
      if (input.sortOrder === "desc") {
        query = query.orderBy(desc(sortColumn)) as any;
      } else {
        query = query.orderBy(sortColumn) as any;
      }

      // Apply pagination
      const results = await query.limit(input.limit).offset(input.offset);

      return {
        candidates: results,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),
});

/**
 * Applications Router
 * Provides application data access
 */
export const applicationsRouter = router({
  /**
   * Get applications by candidate ID
   */
  getByCandidateId: protectedProcedure
    .input(z.object({ candidateId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return [];
      }

      const candidateApplications = await db
        .select()
        .from(applications)
        .where(eq(applications.candidateId, input.candidateId))
        .orderBy(applications.createdAt);

      // Enrich with job details
      const enriched = await Promise.all(
        candidateApplications.map(async (application) => {
          const job = await db
            .select()
            .from(jobs)
            .where(eq(jobs.id, application.jobId))
            .limit(1);

          return {
            ...application,
            job: job[0] || null,
          };
        })
      );

      return enriched;
    }),
});
