import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { 
  matchHistory, 
  applications, 
  interviews, 
  jobs,
  candidates,
  interviewFeedback,
  matchAnalytics
} from "../../drizzle/schema";
import { eq, and, desc, gte, lte, sql, between } from "drizzle-orm";

/**
 * Match Dashboard Analytics Router
 * Provides comprehensive analytics for match quality trends, hiring funnel metrics,
 * and culture fit patterns across departments
 */

export const matchDashboardAnalyticsRouter = router({
  /**
   * Get match quality trends over time
   * Shows how match scores have evolved over a specified period
   */
  getMatchQualityTrends: protectedProcedure
    .input(
      z.object({
        startDate: z.string(), // ISO date
        endDate: z.string(),
        groupBy: z.enum(["day", "week", "month"]).default("week"),
        departmentId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Determine SQL date grouping based on groupBy parameter
      let dateGroup;
      switch (input.groupBy) {
        case "day":
          dateGroup = sql`DATE(${matchHistory.createdAt})`;
          break;
        case "week":
          dateGroup = sql`DATE_FORMAT(${matchHistory.createdAt}, '%Y-%U')`;
          break;
        case "month":
          dateGroup = sql`DATE_FORMAT(${matchHistory.createdAt}, '%Y-%m')`;
          break;
      }

      const conditions = [
        gte(matchHistory.createdAt, input.startDate),
        lte(matchHistory.createdAt, input.endDate),
      ];

      if (input.departmentId) {
        conditions.push(eq(jobs.departmentId, input.departmentId));
      }

      const trends = await db
        .select({
          period: dateGroup.as("period"),
          avgOverallScore: sql<number>`AVG(${matchHistory.overallScore})`.as("avgOverallScore"),
          avgSkillScore: sql<number>`AVG(${matchHistory.skillScore})`.as("avgSkillScore"),
          avgCultureScore: sql<number>`AVG(${matchHistory.cultureFitScore})`.as("avgCultureScore"),
          avgWellbeingScore: sql<number>`AVG(${matchHistory.wellbeingScore})`.as("avgWellbeingScore"),
          totalMatches: sql<number>`COUNT(*)`.as("totalMatches"),
          highQualityMatches: sql<number>`SUM(CASE WHEN ${matchHistory.overallScore} >= 85 THEN 1 ELSE 0 END)`.as("highQualityMatches"),
        })
        .from(matchHistory)
        .leftJoin(jobs, eq(matchHistory.jobId, jobs.id))
        .where(and(...conditions))
        .groupBy(dateGroup)
        .orderBy(dateGroup);

      return trends;
    }),

  /**
   * Get hiring funnel conversion rates
   * Tracks candidates through: Match → Application → Interview → Offer → Hire
   */
  getHiringFunnelMetrics: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        jobId: z.number().optional(),
        departmentId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const dateConditions = [
        gte(matchHistory.createdAt, input.startDate),
        lte(matchHistory.createdAt, input.endDate),
      ];

      if (input.jobId) {
        dateConditions.push(eq(matchHistory.jobId, input.jobId));
      }

      if (input.departmentId) {
        dateConditions.push(eq(jobs.departmentId, input.departmentId));
      }

      // Get funnel metrics
      const funnelData = await db
        .select({
          totalMatches: sql<number>`COUNT(DISTINCT ${matchHistory.id})`,
          matchesViewed: sql<number>`SUM(CASE WHEN ${matchHistory.wasViewed} = 1 THEN 1 ELSE 0 END)`,
          applicationsCreated: sql<number>`COUNT(DISTINCT ${applications.id})`,
          interviewsScheduled: sql<number>`COUNT(DISTINCT ${interviews.id})`,
          interviewsCompleted: sql<number>`SUM(CASE WHEN ${interviews.status} = 'completed' THEN 1 ELSE 0 END)`,
          offersExtended: sql<number>`SUM(CASE WHEN ${applications.status} = 'offered' THEN 1 ELSE 0 END)`,
          candidatesHired: sql<number>`SUM(CASE WHEN ${applications.status} = 'hired' THEN 1 ELSE 0 END)`,
        })
        .from(matchHistory)
        .leftJoin(jobs, eq(matchHistory.jobId, jobs.id))
        .leftJoin(
          applications,
          and(
            eq(matchHistory.candidateId, applications.candidateId),
            eq(matchHistory.jobId, applications.jobId)
          )
        )
        .leftJoin(interviews, eq(applications.id, interviews.applicationId))
        .where(and(...dateConditions));

      const metrics = funnelData[0] || {
        totalMatches: 0,
        matchesViewed: 0,
        applicationsCreated: 0,
        interviewsScheduled: 0,
        interviewsCompleted: 0,
        offersExtended: 0,
        candidatesHired: 0,
      };

      // Calculate conversion rates
      const conversionRates = {
        matchToView: metrics.totalMatches > 0 
          ? (metrics.matchesViewed / metrics.totalMatches) * 100 
          : 0,
        viewToApplication: metrics.matchesViewed > 0
          ? (metrics.applicationsCreated / metrics.matchesViewed) * 100
          : 0,
        applicationToInterview: metrics.applicationsCreated > 0
          ? (metrics.interviewsScheduled / metrics.applicationsCreated) * 100
          : 0,
        interviewToOffer: metrics.interviewsCompleted > 0
          ? (metrics.offersExtended / metrics.interviewsCompleted) * 100
          : 0,
        offerToHire: metrics.offersExtended > 0
          ? (metrics.candidatesHired / metrics.offersExtended) * 100
          : 0,
        overallConversion: metrics.totalMatches > 0
          ? (metrics.candidatesHired / metrics.totalMatches) * 100
          : 0,
      };

      return {
        metrics,
        conversionRates,
      };
    }),

  /**
   * Get culture fit patterns across departments
   * Analyzes which culture dimensions correlate with successful hires
   */
  getCultureFitPatterns: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get culture fit scores by department
      const departmentPatterns = await db
        .select({
          department: jobs.department,
          departmentId: jobs.departmentId,
          avgCultureScore: sql<number>`AVG(${matchHistory.cultureFitScore})`,
          avgOverallScore: sql<number>`AVG(${matchHistory.overallScore})`,
          totalMatches: sql<number>`COUNT(*)`,
          successfulHires: sql<number>`SUM(CASE WHEN ${applications.status} = 'hired' THEN 1 ELSE 0 END)`,
          hireRate: sql<number>`
            CASE 
              WHEN COUNT(*) > 0 
              THEN (SUM(CASE WHEN ${applications.status} = 'hired' THEN 1 ELSE 0 END) / COUNT(*)) * 100 
              ELSE 0 
            END
          `,
        })
        .from(matchHistory)
        .innerJoin(jobs, eq(matchHistory.jobId, jobs.id))
        .leftJoin(
          applications,
          and(
            eq(matchHistory.candidateId, applications.candidateId),
            eq(matchHistory.jobId, applications.jobId)
          )
        )
        .where(
          and(
            gte(matchHistory.createdAt, input.startDate),
            lte(matchHistory.createdAt, input.endDate)
          )
        )
        .groupBy(jobs.department, jobs.departmentId)
        .orderBy(desc(sql`avgCultureScore`));

      // Get culture score distribution for hired vs not hired
      const cultureScoreDistribution = await db
        .select({
          scoreRange: sql<string>`
            CASE 
              WHEN ${matchHistory.cultureFitScore} >= 90 THEN '90-100'
              WHEN ${matchHistory.cultureFitScore} >= 80 THEN '80-89'
              WHEN ${matchHistory.cultureFitScore} >= 70 THEN '70-79'
              WHEN ${matchHistory.cultureFitScore} >= 60 THEN '60-69'
              ELSE 'Below 60'
            END
          `,
          totalCandidates: sql<number>`COUNT(*)`,
          hiredCandidates: sql<number>`SUM(CASE WHEN ${applications.status} = 'hired' THEN 1 ELSE 0 END)`,
          hireRate: sql<number>`
            CASE 
              WHEN COUNT(*) > 0 
              THEN (SUM(CASE WHEN ${applications.status} = 'hired' THEN 1 ELSE 0 END) / COUNT(*)) * 100 
              ELSE 0 
            END
          `,
        })
        .from(matchHistory)
        .leftJoin(
          applications,
          and(
            eq(matchHistory.candidateId, applications.candidateId),
            eq(matchHistory.jobId, applications.jobId)
          )
        )
        .where(
          and(
            gte(matchHistory.createdAt, input.startDate),
            lte(matchHistory.createdAt, input.endDate)
          )
        )
        .groupBy(sql`scoreRange`)
        .orderBy(desc(sql`scoreRange`));

      return {
        departmentPatterns,
        cultureScoreDistribution,
      };
    }),

  /**
   * Get time-to-hire metrics by match quality
   * Analyzes how match scores correlate with hiring speed
   */
  getTimeToHireByMatchQuality: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const timeToHireData = await db
        .select({
          scoreRange: sql<string>`
            CASE 
              WHEN ${matchHistory.overallScore} >= 90 THEN '90-100'
              WHEN ${matchHistory.overallScore} >= 80 THEN '80-89'
              WHEN ${matchHistory.overallScore} >= 70 THEN '70-79'
              ELSE 'Below 70'
            END
          `,
          avgDaysToHire: sql<number>`
            AVG(DATEDIFF(${applications.updatedAt}, ${matchHistory.createdAt}))
          `,
          totalHires: sql<number>`COUNT(*)`,
          avgMatchScore: sql<number>`AVG(${matchHistory.overallScore})`,
        })
        .from(matchHistory)
        .innerJoin(
          applications,
          and(
            eq(matchHistory.candidateId, applications.candidateId),
            eq(matchHistory.jobId, applications.jobId),
            eq(applications.status, "hired")
          )
        )
        .where(
          and(
            gte(matchHistory.createdAt, input.startDate),
            lte(matchHistory.createdAt, input.endDate)
          )
        )
        .groupBy(sql`scoreRange`)
        .orderBy(desc(sql`scoreRange`));

      return timeToHireData;
    }),

  /**
   * Get match performance summary dashboard
   * Provides key metrics and insights for the analytics dashboard
   */
  getMatchPerformanceSummary: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        compareWithPreviousPeriod: z.boolean().default(true),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Current period metrics
      const currentMetrics = await db
        .select({
          totalMatches: sql<number>`COUNT(*)`,
          avgMatchScore: sql<number>`AVG(${matchHistory.overallScore})`,
          avgCultureScore: sql<number>`AVG(${matchHistory.cultureFitScore})`,
          avgWellbeingScore: sql<number>`AVG(${matchHistory.wellbeingScore})`,
          highQualityMatches: sql<number>`SUM(CASE WHEN ${matchHistory.overallScore} >= 85 THEN 1 ELSE 0 END)`,
          matchesViewed: sql<number>`SUM(CASE WHEN ${matchHistory.wasViewed} = 1 THEN 1 ELSE 0 END)`,
          matchesRecommended: sql<number>`SUM(CASE WHEN ${matchHistory.wasRecommended} = 1 THEN 1 ELSE 0 END)`,
        })
        .from(matchHistory)
        .where(
          and(
            gte(matchHistory.createdAt, input.startDate),
            lte(matchHistory.createdAt, input.endDate)
          )
        );

      const current = currentMetrics[0] || {
        totalMatches: 0,
        avgMatchScore: 0,
        avgCultureScore: 0,
        avgWellbeingScore: 0,
        highQualityMatches: 0,
        matchesViewed: 0,
        matchesRecommended: 0,
      };

      let comparison = null;

      if (input.compareWithPreviousPeriod) {
        // Calculate previous period dates
        const startDate = new Date(input.startDate);
        const endDate = new Date(input.endDate);
        const periodLength = endDate.getTime() - startDate.getTime();
        const prevStartDate = new Date(startDate.getTime() - periodLength);
        const prevEndDate = new Date(startDate.getTime() - 1);

        const previousMetrics = await db
          .select({
            totalMatches: sql<number>`COUNT(*)`,
            avgMatchScore: sql<number>`AVG(${matchHistory.overallScore})`,
            avgCultureScore: sql<number>`AVG(${matchHistory.cultureFitScore})`,
            avgWellbeingScore: sql<number>`AVG(${matchHistory.wellbeingScore})`,
            highQualityMatches: sql<number>`SUM(CASE WHEN ${matchHistory.overallScore} >= 85 THEN 1 ELSE 0 END)`,
          })
          .from(matchHistory)
          .where(
            and(
              gte(matchHistory.createdAt, prevStartDate.toISOString()),
              lte(matchHistory.createdAt, prevEndDate.toISOString())
            )
          );

        const previous = previousMetrics[0];

        if (previous) {
          comparison = {
            matchesChange: previous.totalMatches > 0
              ? ((current.totalMatches - previous.totalMatches) / previous.totalMatches) * 100
              : 0,
            scoreChange: previous.avgMatchScore > 0
              ? ((current.avgMatchScore - previous.avgMatchScore) / previous.avgMatchScore) * 100
              : 0,
            cultureScoreChange: previous.avgCultureScore > 0
              ? ((current.avgCultureScore - previous.avgCultureScore) / previous.avgCultureScore) * 100
              : 0,
            wellbeingScoreChange: previous.avgWellbeingScore > 0
              ? ((current.avgWellbeingScore - previous.avgWellbeingScore) / previous.avgWellbeingScore) * 100
              : 0,
          };
        }
      }

      // Get top performing departments
      const topDepartments = await db
        .select({
          department: jobs.department,
          avgMatchScore: sql<number>`AVG(${matchHistory.overallScore})`,
          totalMatches: sql<number>`COUNT(*)`,
        })
        .from(matchHistory)
        .innerJoin(jobs, eq(matchHistory.jobId, jobs.id))
        .where(
          and(
            gte(matchHistory.createdAt, input.startDate),
            lte(matchHistory.createdAt, input.endDate)
          )
        )
        .groupBy(jobs.department)
        .orderBy(desc(sql`avgMatchScore`))
        .limit(5);

      return {
        current,
        comparison,
        topDepartments,
      };
    }),

  /**
   * Get burnout risk analysis across matches
   * Identifies patterns in wellbeing scores and burnout indicators
   */
  getBurnoutRiskAnalysis: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const burnoutData = await db
        .select({
          riskLevel: sql<string>`
            CASE 
              WHEN ${matchHistory.burnoutRisk} >= 70 THEN 'High Risk'
              WHEN ${matchHistory.burnoutRisk} >= 40 THEN 'Medium Risk'
              ELSE 'Low Risk'
            END
          `,
          totalCandidates: sql<number>`COUNT(*)`,
          avgWellbeingScore: sql<number>`AVG(${matchHistory.wellbeingScore})`,
          avgBurnoutRisk: sql<number>`AVG(${matchHistory.burnoutRisk})`,
          hiredCount: sql<number>`SUM(CASE WHEN ${applications.status} = 'hired' THEN 1 ELSE 0 END)`,
        })
        .from(matchHistory)
        .leftJoin(
          applications,
          and(
            eq(matchHistory.candidateId, applications.candidateId),
            eq(matchHistory.jobId, applications.jobId)
          )
        )
        .where(
          and(
            gte(matchHistory.createdAt, input.startDate),
            lte(matchHistory.createdAt, input.endDate)
          )
        )
        .groupBy(sql`riskLevel`)
        .orderBy(desc(sql`avgBurnoutRisk`));

      return burnoutData;
    }),
});
