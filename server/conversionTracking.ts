import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { conversionEvents, bulkBroadcastCampaigns, emailWorkflows, candidates } from "../drizzle/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import crypto from "crypto";

/**
 * Generate a unique tracking token for email tracking
 */
export function generateTrackingToken(campaignId?: number, workflowId?: number, candidateId?: number): string {
  const data = `${campaignId || ''}-${workflowId || ''}-${candidateId || ''}-${Date.now()}-${Math.random()}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
}

/**
 * Replace variables in email content with actual data
 */
export function replaceEmailVariables(
  content: string,
  data: {
    candidateName?: string;
    candidateEmail?: string;
    candidatePhone?: string;
    jobTitle?: string;
    companyName?: string;
    department?: string;
    location?: string;
    salary?: string;
    interviewDate?: string;
    interviewTime?: string;
    interviewerName?: string;
    interviewLocation?: string;
    interviewDuration?: string;
    applicationDate?: string;
    applicationStatus?: string;
  }
): string {
  let result = content;
  
  // Define all possible variables
  const allVariables = [
    'candidateName', 'candidateEmail', 'candidatePhone',
    'jobTitle', 'companyName', 'department', 'location', 'salary',
    'interviewDate', 'interviewTime', 'interviewerName', 'interviewLocation', 'interviewDuration',
    'applicationDate', 'applicationStatus'
  ];
  
  // Replace all variables with actual data or empty string if not provided
  allVariables.forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    const value = (data as any)[key];
    result = result.replace(regex, value !== undefined ? value : '');
  });
  
  return result;
}

/**
 * Track a conversion event
 */
async function trackConversionEvent(params: {
  campaignId?: number;
  workflowId?: number;
  candidateId: number;
  eventType: 'email_sent' | 'email_opened' | 'email_clicked' | 'link_clicked' | 'application_submitted' | 'interview_accepted' | 'interview_completed' | 'offer_accepted';
  eventData?: any;
  trackingToken?: string;
  linkUrl?: string;
  userAgent?: string;
  ipAddress?: string;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[ConversionTracking] Database not available");
    return null;
  }

  try {
    const result = await db.insert(conversionEvents).values({
      campaignId: params.campaignId,
      workflowId: params.workflowId,
      candidateId: params.candidateId,
      eventType: params.eventType,
      eventData: params.eventData ? JSON.stringify(params.eventData) : null,
      trackingToken: params.trackingToken,
      linkUrl: params.linkUrl,
      userAgent: params.userAgent,
      ipAddress: params.ipAddress,
      createdAt: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    console.error("[ConversionTracking] Failed to track event:", error);
    return null;
  }
}

export const conversionTrackingRouter = router({
  /**
   * Generate tracking token for email
   */
  generateToken: protectedProcedure
    .input(z.object({
      campaignId: z.number().optional(),
      workflowId: z.number().optional(),
      candidateId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const token = generateTrackingToken(input.campaignId, input.workflowId, input.candidateId);
      return { token };
    }),

  /**
   * Track email sent event
   */
  trackEmailSent: protectedProcedure
    .input(z.object({
      campaignId: z.number().optional(),
      workflowId: z.number().optional(),
      candidateId: z.number(),
      trackingToken: z.string(),
      eventData: z.any().optional(),
    }))
    .mutation(async ({ input }) => {
      await trackConversionEvent({
        campaignId: input.campaignId,
        workflowId: input.workflowId,
        candidateId: input.candidateId,
        eventType: 'email_sent',
        trackingToken: input.trackingToken,
        eventData: input.eventData,
      });
      return { success: true };
    }),

  /**
   * Public webhook endpoint for email open tracking (tracking pixel)
   */
  trackEmailOpen: publicProcedure
    .input(z.object({
      token: z.string(),
      userAgent: z.string().optional(),
      ipAddress: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      try {
        // Find the original email sent event to get campaign/workflow/candidate info
        const [sentEvent] = await db
          .select()
          .from(conversionEvents)
          .where(
            and(
              eq(conversionEvents.trackingToken, input.token),
              eq(conversionEvents.eventType, 'email_sent')
            )
          )
          .limit(1);

        if (!sentEvent) {
          console.warn("[ConversionTracking] No sent event found for token:", input.token);
          return { success: false };
        }

        // Check if already tracked to avoid duplicates
        const [existingOpen] = await db
          .select()
          .from(conversionEvents)
          .where(
            and(
              eq(conversionEvents.trackingToken, input.token),
              eq(conversionEvents.eventType, 'email_opened')
            )
          )
          .limit(1);

        if (existingOpen) {
          return { success: true, alreadyTracked: true };
        }

        await trackConversionEvent({
          campaignId: sentEvent.campaignId || undefined,
          workflowId: sentEvent.workflowId || undefined,
          candidateId: sentEvent.candidateId,
          eventType: 'email_opened',
          trackingToken: input.token,
          userAgent: input.userAgent,
          ipAddress: input.ipAddress,
        });

        return { success: true };
      } catch (error) {
        console.error("[ConversionTracking] Failed to track email open:", error);
        return { success: false };
      }
    }),

  /**
   * Public webhook endpoint for link click tracking
   */
  trackLinkClick: publicProcedure
    .input(z.object({
      token: z.string(),
      linkUrl: z.string(),
      userAgent: z.string().optional(),
      ipAddress: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      try {
        // Find the original email sent event
        const [sentEvent] = await db
          .select()
          .from(conversionEvents)
          .where(
            and(
              eq(conversionEvents.trackingToken, input.token),
              eq(conversionEvents.eventType, 'email_sent')
            )
          )
          .limit(1);

        if (!sentEvent) {
          return { success: false };
        }

        await trackConversionEvent({
          campaignId: sentEvent.campaignId || undefined,
          workflowId: sentEvent.workflowId || undefined,
          candidateId: sentEvent.candidateId,
          eventType: 'link_clicked',
          trackingToken: input.token,
          linkUrl: input.linkUrl,
          userAgent: input.userAgent,
          ipAddress: input.ipAddress,
        });

        return { success: true };
      } catch (error) {
        console.error("[ConversionTracking] Failed to track link click:", error);
        return { success: false };
      }
    }),

  /**
   * Track application submission
   */
  trackApplicationSubmitted: protectedProcedure
    .input(z.object({
      candidateId: z.number(),
      campaignId: z.number().optional(),
      workflowId: z.number().optional(),
      eventData: z.any().optional(),
    }))
    .mutation(async ({ input }) => {
      await trackConversionEvent({
        campaignId: input.campaignId,
        workflowId: input.workflowId,
        candidateId: input.candidateId,
        eventType: 'application_submitted',
        eventData: input.eventData,
      });
      return { success: true };
    }),

  /**
   * Track interview acceptance
   */
  trackInterviewAccepted: protectedProcedure
    .input(z.object({
      candidateId: z.number(),
      campaignId: z.number().optional(),
      workflowId: z.number().optional(),
      eventData: z.any().optional(),
    }))
    .mutation(async ({ input }) => {
      await trackConversionEvent({
        campaignId: input.campaignId,
        workflowId: input.workflowId,
        candidateId: input.candidateId,
        eventType: 'interview_accepted',
        eventData: input.eventData,
      });
      return { success: true };
    }),

  /**
   * Get conversion funnel for a campaign
   */
  getCampaignFunnel: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      try {
        const events = await db
          .select({
            eventType: conversionEvents.eventType,
            count: sql<number>`COUNT(DISTINCT ${conversionEvents.candidateId})`,
          })
          .from(conversionEvents)
          .where(eq(conversionEvents.campaignId, input.campaignId))
          .groupBy(conversionEvents.eventType);

        const funnel = {
          sent: 0,
          opened: 0,
          clicked: 0,
          applied: 0,
          interviewAccepted: 0,
          interviewCompleted: 0,
          offerAccepted: 0,
        };

        events.forEach((event) => {
          switch (event.eventType) {
            case 'email_sent':
              funnel.sent = Number(event.count);
              break;
            case 'email_opened':
              funnel.opened = Number(event.count);
              break;
            case 'link_clicked':
            case 'email_clicked':
              funnel.clicked = Number(event.count);
              break;
            case 'application_submitted':
              funnel.applied = Number(event.count);
              break;
            case 'interview_accepted':
              funnel.interviewAccepted = Number(event.count);
              break;
            case 'interview_completed':
              funnel.interviewCompleted = Number(event.count);
              break;
            case 'offer_accepted':
              funnel.offerAccepted = Number(event.count);
              break;
          }
        });

        // Calculate conversion rates
        const openRate = funnel.sent > 0 ? (funnel.opened / funnel.sent) * 100 : 0;
        const clickRate = funnel.opened > 0 ? (funnel.clicked / funnel.opened) * 100 : 0;
        const applyRate = funnel.clicked > 0 ? (funnel.applied / funnel.clicked) * 100 : 0;
        const interviewRate = funnel.applied > 0 ? (funnel.interviewAccepted / funnel.applied) * 100 : 0;

        return {
          funnel,
          rates: {
            openRate: openRate.toFixed(2),
            clickRate: clickRate.toFixed(2),
            applyRate: applyRate.toFixed(2),
            interviewRate: interviewRate.toFixed(2),
          },
        };
      } catch (error) {
        console.error("[ConversionTracking] Failed to get campaign funnel:", error);
        return null;
      }
    }),

  /**
   * Get conversion events for a workflow
   */
  getWorkflowConversions: protectedProcedure
    .input(z.object({
      workflowId: z.number(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        let query = db
          .select()
          .from(conversionEvents)
          .where(eq(conversionEvents.workflowId, input.workflowId))
          .orderBy(desc(conversionEvents.createdAt));

        if (input.startDate && input.endDate) {
          query = query.where(
            and(
              eq(conversionEvents.workflowId, input.workflowId),
              gte(conversionEvents.createdAt, input.startDate),
              lte(conversionEvents.createdAt, input.endDate)
            )
          );
        }

        const events = await query;
        return events;
      } catch (error) {
        console.error("[ConversionTracking] Failed to get workflow conversions:", error);
        return [];
      }
    }),
});
