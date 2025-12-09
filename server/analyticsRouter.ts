import { z } from "zod";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { 
  dailyAnalytics,
  profileEnrichmentJobs,
  enrichmentResults,
  bulkOperations,
  bulkOperationItems,
  notificationHistory,
  notificationAnalytics,
  campaignSends,
  emailAbTestsV2,
  abTestVariantResults,
  candidates,
  applications,
  interviews,
  jobs
} from "../drizzle/schema";

/**
 * Analytics Dashboard Router
 * 
 * Provides comprehensive analytics for:
 * - Notification engagement rates
 * - Profile enrichment completion rates
 * - Bulk operation success metrics
 * - Time-to-hire impact metrics
 * - Email campaign performance
 * - A/B test results
 */

export const analyticsRouter = router({
  // ============================================================================
  // DASHBOARD METRICS
  // ============================================================================

  /**
   * Get dashboard metrics for the main dashboard page
   */
  getDashboardMetrics: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Get total jobs count
      const totalJobsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(jobs)
        .where(eq(jobs.employerId, ctx.user.id));
      const totalJobs = totalJobsResult[0]?.count || 0;

      // Get active jobs count
      const activeJobsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(jobs)
        .where(and(
          eq(jobs.employerId, ctx.user.id),
          eq(jobs.status, 'open')
        ));
      const activeJobs = activeJobsResult[0]?.count || 0;

      // Get total candidates count
      const totalCandidatesResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(candidates);
      const totalCandidates = totalCandidatesResult[0]?.count || 0;

      // Get new candidates (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newCandidatesResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(candidates)
        .where(gte(candidates.createdAt, thirtyDaysAgo.toISOString()));
      const newCandidates = newCandidatesResult[0]?.count || 0;

      // Get total applications count
      const totalApplicationsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(applications)
        .where(sql`${applications.jobId} IN (SELECT id FROM ${jobs} WHERE ${jobs.employerId} = ${ctx.user.id})`);
      const totalApplications = totalApplicationsResult[0]?.count || 0;

      // Get scheduled interviews count
      const scheduledInterviewsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(interviews)
        .where(and(
          eq(interviews.employerId, ctx.user.id),
          sql`${interviews.status} IN ('scheduled', 'confirmed')`
        ));
      const scheduledInterviews = scheduledInterviewsResult[0]?.count || 0;

      return {
        totalJobs,
        activeJobs,
        totalCandidates,
        newCandidates,
        totalApplications,
        scheduledInterviews,
      };
    }),

  // ============================================================================
  // OVERVIEW METRICS
  // ============================================================================

  /**
   * Get dashboard overview metrics
   */
  getOverviewMetrics: protectedProcedure
    .input(z.object({
      periodStart: z.string(),
      periodEnd: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Get daily analytics for the period
      const analytics = await db
        .select()
        .from(dailyAnalytics)
        .where(
          and(
            eq(dailyAnalytics.userId, ctx.user.id),
            gte(dailyAnalytics.date, input.periodStart),
            lte(dailyAnalytics.date, input.periodEnd)
          )
        )
        .orderBy(dailyAnalytics.date);

      // Aggregate metrics
      const totalNotificationsSent = analytics.reduce((sum, a) => sum + (a.notificationsSent || 0), 0);
      const totalNotificationsRead = analytics.reduce((sum, a) => sum + (a.notificationsRead || 0), 0);
      const totalNotificationsClicked = analytics.reduce((sum, a) => sum + (a.notificationsClicked || 0), 0);

      const totalEnrichmentsStarted = analytics.reduce((sum, a) => sum + (a.enrichmentsStarted || 0), 0);
      const totalEnrichmentsCompleted = analytics.reduce((sum, a) => sum + (a.enrichmentsCompleted || 0), 0);
      const totalEnrichmentsFailed = analytics.reduce((sum, a) => sum + (a.enrichmentsFailed || 0), 0);

      const totalBulkOperationsStarted = analytics.reduce((sum, a) => sum + (a.bulkOperationsStarted || 0), 0);
      const totalBulkOperationsCompleted = analytics.reduce((sum, a) => sum + (a.bulkOperationsCompleted || 0), 0);
      const totalBulkOperationsFailed = analytics.reduce((sum, a) => sum + (a.bulkOperationsFailed || 0), 0);

      const totalEmailsSent = analytics.reduce((sum, a) => sum + (a.emailsSent || 0), 0);
      const totalEmailsOpened = analytics.reduce((sum, a) => sum + (a.emailsOpened || 0), 0);
      const totalEmailsClicked = analytics.reduce((sum, a) => sum + (a.emailsClicked || 0), 0);

      const totalCandidatesHired = analytics.reduce((sum, a) => sum + (a.candidatesHired || 0), 0);

      // Calculate rates
      const notificationReadRate = totalNotificationsSent > 0 
        ? (totalNotificationsRead / totalNotificationsSent) * 100 
        : 0;
      const notificationClickRate = totalNotificationsRead > 0 
        ? (totalNotificationsClicked / totalNotificationsRead) * 100 
        : 0;

      const enrichmentSuccessRate = totalEnrichmentsStarted > 0 
        ? (totalEnrichmentsCompleted / totalEnrichmentsStarted) * 100 
        : 0;

      const bulkOperationSuccessRate = totalBulkOperationsStarted > 0 
        ? (totalBulkOperationsCompleted / totalBulkOperationsStarted) * 100 
        : 0;

      const emailOpenRate = totalEmailsSent > 0 
        ? (totalEmailsOpened / totalEmailsSent) * 100 
        : 0;
      const emailClickRate = totalEmailsOpened > 0 
        ? (totalEmailsClicked / totalEmailsOpened) * 100 
        : 0;

      // Calculate average time-to-hire
      const avgTimeToHire = analytics.length > 0
        ? Math.round(analytics.reduce((sum, a) => sum + (a.avgTimeToHire || 0), 0) / analytics.length)
        : 0;

      const avgTimeToHireWithEnrichment = analytics.length > 0
        ? Math.round(analytics.reduce((sum, a) => sum + (a.avgTimeToHireWithEnrichment || 0), 0) / analytics.length)
        : 0;

      const avgTimeToHireWithoutEnrichment = analytics.length > 0
        ? Math.round(analytics.reduce((sum, a) => sum + (a.avgTimeToHireWithoutEnrichment || 0), 0) / analytics.length)
        : 0;

      return {
        notifications: {
          sent: totalNotificationsSent,
          read: totalNotificationsRead,
          clicked: totalNotificationsClicked,
          readRate: Math.round(notificationReadRate * 100) / 100,
          clickRate: Math.round(notificationClickRate * 100) / 100,
        },
        enrichment: {
          started: totalEnrichmentsStarted,
          completed: totalEnrichmentsCompleted,
          failed: totalEnrichmentsFailed,
          successRate: Math.round(enrichmentSuccessRate * 100) / 100,
        },
        bulkOperations: {
          started: totalBulkOperationsStarted,
          completed: totalBulkOperationsCompleted,
          failed: totalBulkOperationsFailed,
          successRate: Math.round(bulkOperationSuccessRate * 100) / 100,
        },
        emailCampaigns: {
          sent: totalEmailsSent,
          opened: totalEmailsOpened,
          clicked: totalEmailsClicked,
          openRate: Math.round(emailOpenRate * 100) / 100,
          clickRate: Math.round(emailClickRate * 100) / 100,
        },
        timeToHire: {
          overall: avgTimeToHire,
          withEnrichment: avgTimeToHireWithEnrichment,
          withoutEnrichment: avgTimeToHireWithoutEnrichment,
          improvement: avgTimeToHireWithoutEnrichment > 0 
            ? Math.round(((avgTimeToHireWithoutEnrichment - avgTimeToHireWithEnrichment) / avgTimeToHireWithoutEnrichment) * 100)
            : 0,
        },
        hires: {
          total: totalCandidatesHired,
        },
      };
    }),

  // ============================================================================
  // NOTIFICATION ANALYTICS
  // ============================================================================

  /**
   * Get notification engagement metrics
   */
  getNotificationMetrics: protectedProcedure
    .input(z.object({
      periodStart: z.string(),
      periodEnd: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const notifications = await db
        .select()
        .from(notificationHistory)
        .where(
          and(
            eq(notificationHistory.userId, ctx.user.id),
            gte(notificationHistory.createdAt, input.periodStart),
            lte(notificationHistory.createdAt, input.periodEnd)
          )
        );

      const totalSent = notifications.length;
      const read = notifications.filter(n => n.readAt).length;
      const clicked = notifications.filter(n => n.clickedAt).length;

      // Calculate average response time (time from sent to read)
      const responseTimes = notifications
        .filter(n => n.readAt)
        .map(n => {
          const sent = new Date(n.createdAt).getTime();
          const readTime = new Date(n.readAt!).getTime();
          return (readTime - sent) / 1000 / 60; // minutes
        });

      const avgResponseTime = responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0;

      // Group by notification type
      const byType: Record<string, any> = {};
      for (const notification of notifications) {
        const type = notification.notificationType || 'unknown';
        if (!byType[type]) {
          byType[type] = {
            sent: 0,
            read: 0,
            clicked: 0,
          };
        }
        byType[type].sent++;
        if (notification.readAt) byType[type].read++;
        if (notification.clickedAt) byType[type].clicked++;
      }

      // Calculate rates by type
      const byTypeWithRates = Object.entries(byType).map(([type, data]) => ({
        type,
        sent: data.sent,
        read: data.read,
        clicked: data.clicked,
        readRate: data.sent > 0 ? Math.round((data.read / data.sent) * 10000) / 100 : 0,
        clickRate: data.read > 0 ? Math.round((data.clicked / data.read) * 10000) / 100 : 0,
      }));

      return {
        overall: {
          sent: totalSent,
          read,
          clicked,
          readRate: totalSent > 0 ? Math.round((read / totalSent) * 10000) / 100 : 0,
          clickRate: read > 0 ? Math.round((clicked / read) * 10000) / 100 : 0,
          avgResponseTime,
        },
        byType: byTypeWithRates,
      };
    }),

  // ============================================================================
  // ENRICHMENT ANALYTICS
  // ============================================================================

  /**
   * Get profile enrichment metrics
   */
  getEnrichmentMetrics: protectedProcedure
    .input(z.object({
      periodStart: z.string(),
      periodEnd: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const jobs = await db
        .select()
        .from(profileEnrichmentJobs)
        .where(
          and(
            eq(profileEnrichmentJobs.userId, ctx.user.id),
            gte(profileEnrichmentJobs.createdAt, input.periodStart),
            lte(profileEnrichmentJobs.createdAt, input.periodEnd)
          )
        );

      const totalStarted = jobs.length;
      const completed = jobs.filter(j => j.status === 'completed').length;
      const failed = jobs.filter(j => j.status === 'failed').length;
      const partial = jobs.filter(j => j.status === 'partial').length;

      // Calculate average processing time
      const processingTimes = jobs
        .filter(j => j.processingTime)
        .map(j => j.processingTime!);

      const avgProcessingTime = processingTimes.length > 0
        ? Math.round(processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length)
        : 0;

      // Get enrichment results for confidence scores
      const results = await db
        .select()
        .from(enrichmentResults)
        .where(
          and(
            eq(enrichmentResults.candidateId, sql`${enrichmentResults.candidateId}`),
            gte(enrichmentResults.createdAt, input.periodStart),
            lte(enrichmentResults.createdAt, input.periodEnd)
          )
        );

      const avgConfidence = results.length > 0
        ? Math.round(results.reduce((sum, r) => sum + (r.overallConfidence || 0), 0) / results.length)
        : 0;

      // Group by enrichment type
      const byType: Record<string, any> = {};
      for (const job of jobs) {
        const type = job.enrichmentType || 'unknown';
        if (!byType[type]) {
          byType[type] = {
            started: 0,
            completed: 0,
            failed: 0,
          };
        }
        byType[type].started++;
        if (job.status === 'completed') byType[type].completed++;
        if (job.status === 'failed') byType[type].failed++;
      }

      const byTypeWithRates = Object.entries(byType).map(([type, data]) => ({
        type,
        started: data.started,
        completed: data.completed,
        failed: data.failed,
        successRate: data.started > 0 ? Math.round((data.completed / data.started) * 10000) / 100 : 0,
      }));

      return {
        overall: {
          started: totalStarted,
          completed,
          failed,
          partial,
          successRate: totalStarted > 0 ? Math.round((completed / totalStarted) * 10000) / 100 : 0,
          avgProcessingTime,
          avgConfidence,
        },
        byType: byTypeWithRates,
      };
    }),

  // ============================================================================
  // BULK OPERATIONS ANALYTICS
  // ============================================================================

  /**
   * Get bulk operations metrics
   */
  getBulkOperationsMetrics: protectedProcedure
    .input(z.object({
      periodStart: z.string(),
      periodEnd: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const operations = await db
        .select()
        .from(bulkOperations)
        .where(
          and(
            eq(bulkOperations.userId, ctx.user.id),
            gte(bulkOperations.createdAt, input.periodStart),
            lte(bulkOperations.createdAt, input.periodEnd)
          )
        );

      const totalStarted = operations.length;
      const completed = operations.filter(op => op.status === 'completed').length;
      const failed = operations.filter(op => op.status === 'failed').length;
      const cancelled = operations.filter(op => op.status === 'cancelled').length;

      const totalItemsProcessed = operations.reduce((sum, op) => sum + (op.processedCount || 0), 0);
      const totalItemsSuccess = operations.reduce((sum, op) => sum + (op.successCount || 0), 0);
      const totalItemsFailed = operations.reduce((sum, op) => sum + (op.failedCount || 0), 0);

      // Calculate average processing time
      const processingTimes = operations
        .filter(op => op.processingTime)
        .map(op => op.processingTime!);

      const avgProcessingTime = processingTimes.length > 0
        ? Math.round(processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length)
        : 0;

      // Group by operation type
      const byType: Record<string, any> = {};
      for (const operation of operations) {
        const type = operation.operationType || 'unknown';
        if (!byType[type]) {
          byType[type] = {
            started: 0,
            completed: 0,
            failed: 0,
            itemsProcessed: 0,
            itemsSuccess: 0,
          };
        }
        byType[type].started++;
        if (operation.status === 'completed') byType[type].completed++;
        if (operation.status === 'failed') byType[type].failed++;
        byType[type].itemsProcessed += operation.processedCount || 0;
        byType[type].itemsSuccess += operation.successCount || 0;
      }

      const byTypeWithRates = Object.entries(byType).map(([type, data]) => ({
        type,
        started: data.started,
        completed: data.completed,
        failed: data.failed,
        itemsProcessed: data.itemsProcessed,
        itemsSuccess: data.itemsSuccess,
        operationSuccessRate: data.started > 0 ? Math.round((data.completed / data.started) * 10000) / 100 : 0,
        itemSuccessRate: data.itemsProcessed > 0 ? Math.round((data.itemsSuccess / data.itemsProcessed) * 10000) / 100 : 0,
      }));

      return {
        overall: {
          started: totalStarted,
          completed,
          failed,
          cancelled,
          operationSuccessRate: totalStarted > 0 ? Math.round((completed / totalStarted) * 10000) / 100 : 0,
          itemsProcessed: totalItemsProcessed,
          itemsSuccess: totalItemsSuccess,
          itemsFailed: totalItemsFailed,
          itemSuccessRate: totalItemsProcessed > 0 ? Math.round((totalItemsSuccess / totalItemsProcessed) * 10000) / 100 : 0,
          avgProcessingTime,
        },
        byType: byTypeWithRates,
      };
    }),

  // ============================================================================
  // TIME-SERIES DATA
  // ============================================================================

  /**
   * Get time-series data for charts
   */
  getTimeSeriesData: protectedProcedure
    .input(z.object({
      periodStart: z.string(),
      periodEnd: z.string(),
      metrics: z.array(z.enum([
        'notifications',
        'enrichment',
        'bulkOperations',
        'emailCampaigns',
        'timeToHire'
      ])),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const analytics = await db
        .select()
        .from(dailyAnalytics)
        .where(
          and(
            eq(dailyAnalytics.userId, ctx.user.id),
            gte(dailyAnalytics.date, input.periodStart),
            lte(dailyAnalytics.date, input.periodEnd)
          )
        )
        .orderBy(dailyAnalytics.date);

      const timeSeries: Record<string, any[]> = {};

      for (const metric of input.metrics) {
        switch (metric) {
          case 'notifications':
            timeSeries.notifications = analytics.map(a => ({
              date: a.date,
              sent: a.notificationsSent || 0,
              read: a.notificationsRead || 0,
              clicked: a.notificationsClicked || 0,
              readRate: (a.notificationsSent || 0) > 0 
                ? Math.round(((a.notificationsRead || 0) / (a.notificationsSent || 0)) * 10000) / 100 
                : 0,
            }));
            break;

          case 'enrichment':
            timeSeries.enrichment = analytics.map(a => ({
              date: a.date,
              started: a.enrichmentsStarted || 0,
              completed: a.enrichmentsCompleted || 0,
              failed: a.enrichmentsFailed || 0,
              successRate: (a.enrichmentsStarted || 0) > 0 
                ? Math.round(((a.enrichmentsCompleted || 0) / (a.enrichmentsStarted || 0)) * 10000) / 100 
                : 0,
            }));
            break;

          case 'bulkOperations':
            timeSeries.bulkOperations = analytics.map(a => ({
              date: a.date,
              started: a.bulkOperationsStarted || 0,
              completed: a.bulkOperationsCompleted || 0,
              failed: a.bulkOperationsFailed || 0,
              successRate: (a.bulkOperationsStarted || 0) > 0 
                ? Math.round(((a.bulkOperationsCompleted || 0) / (a.bulkOperationsStarted || 0)) * 10000) / 100 
                : 0,
            }));
            break;

          case 'emailCampaigns':
            timeSeries.emailCampaigns = analytics.map(a => ({
              date: a.date,
              sent: a.emailsSent || 0,
              opened: a.emailsOpened || 0,
              clicked: a.emailsClicked || 0,
              openRate: (a.emailsSent || 0) > 0 
                ? Math.round(((a.emailsOpened || 0) / (a.emailsSent || 0)) * 10000) / 100 
                : 0,
            }));
            break;

          case 'timeToHire':
            timeSeries.timeToHire = analytics.map(a => ({
              date: a.date,
              overall: a.avgTimeToHire || 0,
              withEnrichment: a.avgTimeToHireWithEnrichment || 0,
              withoutEnrichment: a.avgTimeToHireWithoutEnrichment || 0,
            }));
            break;
        }
      }

      return timeSeries;
    }),

  // ============================================================================
  // FUNNEL ANALYSIS
  // ============================================================================

  /**
   * Get candidate journey funnel
   */
  getCandidateFunnel: protectedProcedure
    .input(z.object({
      periodStart: z.string(),
      periodEnd: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Get all candidates in the period
      const allCandidates = await db
        .select()
        .from(candidates)
        .where(
          and(
            eq(candidates.userId, ctx.user.id),
            gte(candidates.createdAt, input.periodStart),
            lte(candidates.createdAt, input.periodEnd)
          )
        );

      // Get applications
      const allApplications = await db
        .select()
        .from(applications)
        .where(
          and(
            gte(applications.createdAt, input.periodStart),
            lte(applications.createdAt, input.periodEnd)
          )
        );

      // Get interviews
      const allInterviews = await db
        .select()
        .from(interviews)
        .where(
          and(
            gte(interviews.createdAt, input.periodStart),
            lte(interviews.createdAt, input.periodEnd)
          )
        );

      const totalCandidates = allCandidates.length;
      const totalApplications = allApplications.length;
      const screening = allApplications.filter(a => a.status === 'screening').length;
      const interviewing = allApplications.filter(a => a.status === 'interviewing').length;
      const offered = allApplications.filter(a => a.status === 'offered').length;
      const hired = allApplications.filter(a => a.status === 'offered').length; // Assuming offered = hired for now

      return {
        stages: [
          {
            name: 'Candidates',
            count: totalCandidates,
            conversionRate: 100,
          },
          {
            name: 'Applications',
            count: totalApplications,
            conversionRate: totalCandidates > 0 ? Math.round((totalApplications / totalCandidates) * 10000) / 100 : 0,
          },
          {
            name: 'Screening',
            count: screening,
            conversionRate: totalApplications > 0 ? Math.round((screening / totalApplications) * 10000) / 100 : 0,
          },
          {
            name: 'Interviewing',
            count: interviewing,
            conversionRate: screening > 0 ? Math.round((interviewing / screening) * 10000) / 100 : 0,
          },
          {
            name: 'Offered',
            count: offered,
            conversionRate: interviewing > 0 ? Math.round((offered / interviewing) * 10000) / 100 : 0,
          },
          {
            name: 'Hired',
            count: hired,
            conversionRate: offered > 0 ? Math.round((hired / offered) * 10000) / 100 : 0,
          },
        ],
      };
    }),

  // ============================================================================
  // EXPORT DATA
  // ============================================================================

  /**
   * Export analytics data to CSV
   */
  exportAnalytics: protectedProcedure
    .input(z.object({
      periodStart: z.string(),
      periodEnd: z.string(),
      format: z.enum(['csv', 'json']),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const analytics = await db
        .select()
        .from(dailyAnalytics)
        .where(
          and(
            eq(dailyAnalytics.userId, ctx.user.id),
            gte(dailyAnalytics.date, input.periodStart),
            lte(dailyAnalytics.date, input.periodEnd)
          )
        )
        .orderBy(dailyAnalytics.date);

      if (input.format === 'csv') {
        // Generate CSV
        const headers = [
          'Date',
          'Notifications Sent',
          'Notifications Read',
          'Notifications Clicked',
          'Enrichments Started',
          'Enrichments Completed',
          'Enrichments Failed',
          'Bulk Operations Started',
          'Bulk Operations Completed',
          'Bulk Operations Failed',
          'Emails Sent',
          'Emails Opened',
          'Emails Clicked',
          'Candidates Hired',
          'Avg Time to Hire',
        ];

        const rows = analytics.map(a => [
          a.date,
          a.notificationsSent || 0,
          a.notificationsRead || 0,
          a.notificationsClicked || 0,
          a.enrichmentsStarted || 0,
          a.enrichmentsCompleted || 0,
          a.enrichmentsFailed || 0,
          a.bulkOperationsStarted || 0,
          a.bulkOperationsCompleted || 0,
          a.bulkOperationsFailed || 0,
          a.emailsSent || 0,
          a.emailsOpened || 0,
          a.emailsClicked || 0,
          a.candidatesHired || 0,
          a.avgTimeToHire || 0,
        ]);

        const csv = [
          headers.join(','),
          ...rows.map(row => row.join(',')),
        ].join('\n');

        return {
          success: true,
          format: 'csv',
          data: csv,
        };
      } else {
        // Return JSON
        return {
          success: true,
          format: 'json',
          data: JSON.stringify(analytics, null, 2),
        };
      }
    }),
});
