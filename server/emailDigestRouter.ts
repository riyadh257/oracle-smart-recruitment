import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { 
  sendGmailMessage, 
  generateWeeklyDigestContent,
  generateBudgetAlertContent 
} from "./gmailIntegration";
import { 
  candidates, 
  interviews, 
  interviewFeedback, 
  emailCampaigns,
  emailCampaignEvents,
  digestDeliveryLog,
  budgetTemplates
} from "../drizzle/schema";
import { eq, and, gte, sql, desc } from "drizzle-orm";

/**
 * Email Digest Router
 * 
 * Handles weekly digest generation and delivery via Gmail MCP,
 * budget alert notifications, and digest management.
 */

export const emailDigestRouter = router({
  /**
   * Generate weekly digest preview without sending
   */
  previewWeeklyDigest: protectedProcedure
    .input(
      z.object({
        userId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userId = input.userId || ctx.user.id;
      const user = ctx.user;

      // Get date range for the week
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get candidate statistics
      const allCandidates = await db
        .select()
        .from(candidates)
        .where(eq(candidates.status, "active"));

      const newApplications = allCandidates.filter(
        (c) => new Date(c.createdAt) >= oneWeekAgo
      ).length;

      // Get interview statistics
      const scheduledInterviews = await db
        .select()
        .from(interviews)
        .where(
          and(
            gte(interviews.scheduledAt, oneWeekAgo.toISOString()),
            eq(interviews.status, "scheduled")
          )
        );

      // Get pending feedback count
      const completedInterviews = await db
        .select()
        .from(interviews)
        .where(eq(interviews.status, "completed"));

      const feedbackCounts = await Promise.all(
        completedInterviews.map(async (interview) => {
          const feedback = await db
            .select()
            .from(interviewFeedback)
            .where(eq(interviewFeedback.interviewId, interview.id))
            .limit(1);
          return feedback.length === 0 ? 1 : 0;
        })
      );

      const feedbackPending = feedbackCounts.reduce((sum, val) => sum + val, 0);

      // Get top performers (candidates with highest overall scores)
      const topPerformers = allCandidates
        .filter((c) => c.overallMatchScore !== null)
        .sort((a, b) => (b.overallMatchScore || 0) - (a.overallMatchScore || 0))
        .slice(0, 5)
        .map((c) => ({
          name: c.name,
          score: c.overallMatchScore || 0,
        }));

      // Get campaign metrics
      const recentCampaigns = await db
        .select()
        .from(emailCampaigns)
        .where(gte(emailCampaigns.createdAt, oneWeekAgo.toISOString()));

      let campaignMetrics = undefined;
      if (recentCampaigns.length > 0) {
        const campaignIds = recentCampaigns.map((c) => c.id);
        
        let totalSent = 0;
        let totalOpened = 0;
        let totalClicked = 0;

        for (const campaignId of campaignIds) {
          const events = await db
            .select()
            .from(emailCampaignEvents)
            .where(eq(emailCampaignEvents.campaignId, campaignId));

          totalSent += events.filter((e) => e.eventType === "sent").length;
          totalOpened += events.filter((e) => e.eventType === "opened").length;
          totalClicked += events.filter((e) => e.eventType === "clicked").length;
        }

        campaignMetrics = {
          emailsSent: totalSent,
          openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
          clickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
        };
      }

      // Generate preview content
      const content = generateWeeklyDigestContent({
        userName: user.name || "User",
        totalCandidates: allCandidates.length,
        newApplications,
        interviewsScheduled: scheduledInterviews.length,
        feedbackPending,
        topPerformers,
        campaignMetrics,
      });

      return {
        subject: `Weekly Recruitment Summary - ${now.toLocaleDateString()}`,
        content,
        stats: {
          totalCandidates: allCandidates.length,
          newApplications,
          interviewsScheduled: scheduledInterviews.length,
          feedbackPending,
          topPerformersCount: topPerformers.length,
        },
      };
    }),

  /**
   * Send weekly digest via Gmail
   */
  sendWeeklyDigest: protectedProcedure
    .input(
      z.object({
        recipients: z.array(z.string().email()),
        includeUserEmail: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Generate digest content
      const preview = await emailDigestRouter.createCaller(ctx).previewWeeklyDigest({});

      // Prepare recipient list
      const recipients = [...input.recipients];
      if (input.includeUserEmail && ctx.user.email) {
        recipients.push(ctx.user.email);
      }

      if (recipients.length === 0) {
        throw new Error("No recipients specified");
      }

      // Send via Gmail MCP
      const result = await sendGmailMessage({
        to: recipients,
        subject: preview.subject,
        content: preview.content,
      });

      // Log delivery
      await db.insert(digestDeliveryLog).values({
        userId: ctx.user.id,
        digestType: "weekly",
        deliveredAt: new Date().toISOString(),
        matchesIncluded: preview.stats.totalCandidates,
        emailSubject: preview.subject,
        emailSent: result.success ? 1 : 0,
        metadata: {
          recipients,
          stats: preview.stats,
          messageId: result.messageId,
          error: result.error,
        },
      });

      return {
        success: result.success,
        messageId: result.messageId,
        error: result.error,
        recipientCount: recipients.length,
      };
    }),

  /**
   * Get digest delivery history
   */
  getDigestHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const history = await db
        .select()
        .from(digestDeliveryLog)
        .where(eq(digestDeliveryLog.userId, ctx.user.id))
        .orderBy(desc(digestDeliveryLog.deliveredAt))
        .limit(input.limit);

      return history;
    }),

  /**
   * Send budget alert email
   */
  sendBudgetAlert: protectedProcedure
    .input(
      z.object({
        budgetName: z.string(),
        currentSpending: z.number(),
        budgetLimit: z.number(),
        threshold: z.number().min(0).max(100),
        recipients: z.array(z.string().email()),
        projectedOverrun: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const percentUsed = (input.currentSpending / input.budgetLimit) * 100;

      const content = generateBudgetAlertContent({
        userName: ctx.user.name || "User",
        budgetName: input.budgetName,
        currentSpending: input.currentSpending,
        budgetLimit: input.budgetLimit,
        percentUsed,
        threshold: input.threshold,
        projectedOverrun: input.projectedOverrun,
      });

      const subject = `⚠️ Budget Alert: ${input.budgetName} (${percentUsed.toFixed(1)}% used)`;

      const result = await sendGmailMessage({
        to: input.recipients,
        subject,
        content,
      });

      return {
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      };
    }),

  /**
   * Configure digest recipients
   */
  updateDigestRecipients: protectedProcedure
    .input(
      z.object({
        recipients: z.array(z.string().email()),
        frequency: z.enum(["daily", "weekly", "biweekly"]),
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Store preferences in user metadata or separate table
      // For now, return success
      return {
        success: true,
        recipients: input.recipients,
        frequency: input.frequency,
        enabled: input.enabled,
      };
    }),
});
