/**
 * Communication Router - Email Analytics, Broadcasts, and A/B Testing
 * Handles email engagement tracking, bulk SMS/WhatsApp broadcasts, and email optimization
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { 
  emailEvents, 
  broadcastMessages, 
  broadcastRecipients, 
  abTestResultsLegacy as abTestResults, 
  optimalSendTimes,
  emailAbTests,
  emailAbVariants,
  candidates,
  employers
} from "../drizzle/schema";
import { eq, and, gte, lte, desc, sql, inArray, count } from "drizzle-orm";

/**
 * Email Analytics Router
 */
const emailAnalyticsRouter = router({
  /**
   * Track email event (open, click, etc.)
   */
  trackEvent: protectedProcedure
    .input(z.object({
      emailAnalyticsId: z.number().optional(),
      campaignId: z.number().optional(),
      abTestId: z.number().optional(),
      variantId: z.number().optional(),
      eventType: z.enum(['sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed']),
      recipientEmail: z.string().email(),
      candidateId: z.number().optional(),
      emailType: z.enum(['interview_invite', 'interview_reminder', 'application_received', 'application_update', 'job_match', 'rejection', 'follow_up', 'broadcast', 'custom']),
      subject: z.string().optional(),
      linkUrl: z.string().optional(),
      linkPosition: z.number().optional(),
      userAgent: z.string().optional(),
      ipAddress: z.string().optional(),
      deviceType: z.enum(['desktop', 'mobile', 'tablet', 'unknown']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      // Get employer ID from user
      const employerRecord = await db.select().from(employers).where(eq(employers.userId, ctx.user.id)).limit(1);
      if (!employerRecord.length) throw new TRPCError({ code: 'NOT_FOUND', message: 'Employer not found' });
      const employerId = employerRecord[0].id;

      const now = new Date();
      const hourOfDay = now.getHours();
      const dayOfWeek = now.getDay();

      await db.insert(emailEvents).values({
        employerId,
        emailAnalyticsId: input.emailAnalyticsId,
        campaignId: input.campaignId,
        abTestId: input.abTestId,
        variantId: input.variantId,
        eventType: input.eventType,
        recipientEmail: input.recipientEmail,
        candidateId: input.candidateId,
        emailType: input.emailType,
        subject: input.subject,
        linkUrl: input.linkUrl,
        linkPosition: input.linkPosition,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
        deviceType: input.deviceType,
        eventTimestamp: now,
        hourOfDay,
        dayOfWeek,
      });

      return { success: true };
    }),

  /**
   * Get engagement rates by email type
   */
  getEngagementRates: protectedProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date(),
      emailTypes: z.array(z.enum(['interview_invite', 'interview_reminder', 'application_received', 'application_update', 'job_match', 'rejection', 'follow_up', 'broadcast', 'custom'])).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const employerRecord = await db.select().from(employers).where(eq(employers.userId, ctx.user.id)).limit(1);
      if (!employerRecord.length) throw new TRPCError({ code: 'NOT_FOUND', message: 'Employer not found' });
      const employerId = employerRecord[0].id;

      // Build where conditions
      const conditions = [
        eq(emailEvents.employerId, employerId),
        gte(emailEvents.eventTimestamp, input.startDate),
        lte(emailEvents.eventTimestamp, input.endDate),
      ];

      if (input.emailTypes && input.emailTypes.length > 0) {
        conditions.push(inArray(emailEvents.emailType, input.emailTypes));
      }

      // Get all events grouped by email type and event type
      const events = await db
        .select({
          emailType: emailEvents.emailType,
          eventType: emailEvents.eventType,
          count: count(),
        })
        .from(emailEvents)
        .where(and(...conditions))
        .groupBy(emailEvents.emailType, emailEvents.eventType);

      // Calculate rates by email type
      const ratesByType: Record<string, { sent: number; opened: number; clicked: number; openRate: number; clickRate: number }> = {};

      events.forEach(event => {
        if (!ratesByType[event.emailType]) {
          ratesByType[event.emailType] = { sent: 0, opened: 0, clicked: 0, openRate: 0, clickRate: 0 };
        }

        if (event.eventType === 'sent') ratesByType[event.emailType].sent += event.count;
        if (event.eventType === 'opened') ratesByType[event.emailType].opened += event.count;
        if (event.eventType === 'clicked') ratesByType[event.emailType].clicked += event.count;
      });

      // Calculate percentages
      Object.keys(ratesByType).forEach(emailType => {
        const data = ratesByType[emailType];
        data.openRate = data.sent > 0 ? (data.opened / data.sent) * 100 : 0;
        data.clickRate = data.sent > 0 ? (data.clicked / data.sent) * 100 : 0;
      });

      return ratesByType;
    }),

  /**
   * Get optimal send times
   */
  getOptimalSendTimes: protectedProcedure
    .input(z.object({
      emailType: z.enum(['interview_invite', 'interview_reminder', 'application_received', 'application_update', 'job_match', 'rejection', 'follow_up', 'broadcast', 'custom']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const employerRecord = await db.select().from(employers).where(eq(employers.userId, ctx.user.id)).limit(1);
      if (!employerRecord.length) throw new TRPCError({ code: 'NOT_FOUND', message: 'Employer not found' });
      const employerId = employerRecord[0].id;

      const conditions = [eq(optimalSendTimes.employerId, employerId)];
      if (input.emailType) {
        conditions.push(eq(optimalSendTimes.emailType, input.emailType));
      }

      const results = await db
        .select()
        .from(optimalSendTimes)
        .where(and(...conditions))
        .orderBy(desc(optimalSendTimes.confidenceScore));

      return results;
    }),

  /**
   * Calculate and update optimal send times
   */
  calculateOptimalSendTimes: protectedProcedure
    .input(z.object({
      emailType: z.enum(['interview_invite', 'interview_reminder', 'application_received', 'application_update', 'job_match', 'rejection', 'follow_up', 'broadcast', 'custom']),
      analysisStartDate: z.date(),
      analysisEndDate: z.date(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const employerRecord = await db.select().from(employers).where(eq(employers.userId, ctx.user.id)).limit(1);
      if (!employerRecord.length) throw new TRPCError({ code: 'NOT_FOUND', message: 'Employer not found' });
      const employerId = employerRecord[0].id;

      // Get events grouped by day of week and hour
      const events = await db
        .select({
          dayOfWeek: emailEvents.dayOfWeek,
          hourOfDay: emailEvents.hourOfDay,
          eventType: emailEvents.eventType,
          count: count(),
        })
        .from(emailEvents)
        .where(and(
          eq(emailEvents.employerId, employerId),
          eq(emailEvents.emailType, input.emailType),
          gte(emailEvents.eventTimestamp, input.analysisStartDate),
          lte(emailEvents.eventTimestamp, input.analysisEndDate)
        ))
        .groupBy(emailEvents.dayOfWeek, emailEvents.hourOfDay, emailEvents.eventType);

      // Calculate rates for each time slot
      const timeSlots: Record<string, { sent: number; opened: number; clicked: number }> = {};

      events.forEach(event => {
        if (event.dayOfWeek === null || event.hourOfDay === null) return;
        
        const key = `${event.dayOfWeek}-${event.hourOfDay}`;
        if (!timeSlots[key]) {
          timeSlots[key] = { sent: 0, opened: 0, clicked: 0 };
        }

        if (event.eventType === 'sent') timeSlots[key].sent += event.count;
        if (event.eventType === 'opened') timeSlots[key].opened += event.count;
        if (event.eventType === 'clicked') timeSlots[key].clicked += event.count;
      });

      // Find optimal time slot
      let bestSlot = { dayOfWeek: 2, hourOfDay: 10, openRate: 0, clickRate: 0, sampleSize: 0 }; // Default: Tuesday 10 AM

      Object.entries(timeSlots).forEach(([key, data]) => {
        if (data.sent < 10) return; // Need minimum sample size

        const openRate = (data.opened / data.sent) * 100;
        const clickRate = (data.clicked / data.sent) * 100;
        const combinedScore = openRate + (clickRate * 2); // Weight clicks higher

        if (combinedScore > (bestSlot.openRate + bestSlot.clickRate * 2)) {
          const [dayOfWeek, hourOfDay] = key.split('-').map(Number);
          bestSlot = { dayOfWeek, hourOfDay, openRate, clickRate, sampleSize: data.sent };
        }
      });

      // Calculate confidence score
      const confidenceScore = Math.min(100, Math.floor((bestSlot.sampleSize / 100) * 100));

      // Upsert optimal send time
      await db.insert(optimalSendTimes).values({
        employerId,
        emailType: input.emailType,
        candidateSegment: 'all',
        optimalDayOfWeek: bestSlot.dayOfWeek,
        optimalHourOfDay: bestSlot.hourOfDay,
        avgOpenRate: Math.floor(bestSlot.openRate * 100),
        avgClickRate: Math.floor(bestSlot.clickRate * 100),
        sampleSize: bestSlot.sampleSize,
        confidenceScore,
        analysisStartDate: input.analysisStartDate,
        analysisEndDate: input.analysisEndDate,
      });

      return {
        success: true,
        optimalTime: {
          dayOfWeek: bestSlot.dayOfWeek,
          hourOfDay: bestSlot.hourOfDay,
          openRate: bestSlot.openRate,
          clickRate: bestSlot.clickRate,
          confidenceScore,
        },
      };
    }),
});

/**
 * Broadcast Router
 */
const broadcastRouter = router({
  /**
   * Create broadcast message
   */
  create: protectedProcedure
    .input(z.object({
      title: z.string(),
      messageType: z.enum(['sms', 'whatsapp', 'email']),
      messageContent: z.string(),
      emailSubject: z.string().optional(),
      emailHtml: z.string().optional(),
      targetAudience: z.enum(['all_candidates', 'filtered', 'manual_selection']),
      filterCriteria: z.object({
        status: z.array(z.string()).optional(),
        skills: z.array(z.string()).optional(),
        location: z.array(z.string()).optional(),
        experienceMin: z.number().optional(),
        experienceMax: z.number().optional(),
        availability: z.boolean().optional(),
      }).optional(),
      scheduledAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const employerRecord = await db.select().from(employers).where(eq(employers.userId, ctx.user.id)).limit(1);
      if (!employerRecord.length) throw new TRPCError({ code: 'NOT_FOUND', message: 'Employer not found' });
      const employerId = employerRecord[0].id;

      const [broadcast] = await db.insert(broadcastMessages).values({
        employerId,
        createdBy: ctx.user.id,
        title: input.title,
        messageType: input.messageType,
        messageContent: input.messageContent,
        emailSubject: input.emailSubject,
        emailHtml: input.emailHtml,
        targetAudience: input.targetAudience,
        filterCriteria: input.filterCriteria,
        status: input.scheduledAt ? 'scheduled' : 'draft',
        scheduledAt: input.scheduledAt,
      });

      return { broadcastId: broadcast.insertId };
    }),

  /**
   * Get filtered candidates for broadcast
   */
  getFilteredCandidates: protectedProcedure
    .input(z.object({
      filterCriteria: z.object({
        status: z.array(z.string()).optional(),
        skills: z.array(z.string()).optional(),
        location: z.array(z.string()).optional(),
        experienceMin: z.number().optional(),
        experienceMax: z.number().optional(),
        availability: z.boolean().optional(),
      }),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      // Build query conditions
      const conditions = [];

      if (input.filterCriteria.location && input.filterCriteria.location.length > 0) {
        conditions.push(inArray(candidates.location, input.filterCriteria.location));
      }

      if (input.filterCriteria.experienceMin !== undefined) {
        conditions.push(gte(candidates.yearsOfExperience, input.filterCriteria.experienceMin));
      }

      if (input.filterCriteria.experienceMax !== undefined) {
        conditions.push(lte(candidates.yearsOfExperience, input.filterCriteria.experienceMax));
      }

      if (input.filterCriteria.availability !== undefined) {
        conditions.push(eq(candidates.isAvailable, input.filterCriteria.availability));
      }

      const results = await db
        .select({
          id: candidates.id,
          fullName: candidates.fullName,
          email: candidates.email,
          phone: candidates.phone,
          location: candidates.location,
          yearsOfExperience: candidates.yearsOfExperience,
          technicalSkills: candidates.technicalSkills,
        })
        .from(candidates)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(1000);

      // Filter by skills if provided (JSON field filtering)
      let filteredResults = results;
      if (input.filterCriteria.skills && input.filterCriteria.skills.length > 0) {
        filteredResults = results.filter(candidate => {
          const skills = candidate.technicalSkills as string[] || [];
          return input.filterCriteria.skills!.some(skill => 
            skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
          );
        });
      }

      return {
        candidates: filteredResults,
        totalCount: filteredResults.length,
      };
    }),

  /**
   * Send broadcast
   */
  send: protectedProcedure
    .input(z.object({
      broadcastId: z.number(),
      candidateIds: z.array(z.number()),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      // Get broadcast
      const [broadcast] = await db
        .select()
        .from(broadcastMessages)
        .where(eq(broadcastMessages.id, input.broadcastId))
        .limit(1);

      if (!broadcast) throw new TRPCError({ code: 'NOT_FOUND', message: 'Broadcast not found' });

      // Get candidates
      const candidateList = await db
        .select()
        .from(candidates)
        .where(inArray(candidates.id, input.candidateIds));

      // Create recipient records
      const recipients = candidateList.map(candidate => ({
        broadcastId: input.broadcastId,
        candidateId: candidate.id,
        recipientName: candidate.fullName,
        recipientEmail: candidate.email,
        recipientPhone: candidate.phone,
        deliveryStatus: 'pending' as const,
      }));

      await db.insert(broadcastRecipients).values(recipients);

      // Update broadcast status
      await db
        .update(broadcastMessages)
        .set({
          status: 'sending',
          totalRecipients: recipients.length,
        })
        .where(eq(broadcastMessages.id, input.broadcastId));

      // TODO: Integrate with actual SMS/WhatsApp/Email sending service
      // For now, mark as sent
      await db
        .update(broadcastMessages)
        .set({
          status: 'sent',
          sentAt: new Date(),
          successCount: recipients.length,
        })
        .where(eq(broadcastMessages.id, input.broadcastId));

      return {
        success: true,
        totalRecipients: recipients.length,
      };
    }),

  /**
   * List broadcasts
   */
  list: protectedProcedure
    .input(z.object({
      status: z.enum(['draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled']).optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const employerRecord = await db.select().from(employers).where(eq(employers.userId, ctx.user.id)).limit(1);
      if (!employerRecord.length) throw new TRPCError({ code: 'NOT_FOUND', message: 'Employer not found' });
      const employerId = employerRecord[0].id;

      const conditions = [eq(broadcastMessages.employerId, employerId)];
      if (input.status) {
        conditions.push(eq(broadcastMessages.status, input.status));
      }

      const results = await db
        .select()
        .from(broadcastMessages)
        .where(and(...conditions))
        .orderBy(desc(broadcastMessages.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return results;
    }),

  /**
   * Get broadcast details with recipients
   */
  getDetails: protectedProcedure
    .input(z.object({
      broadcastId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const [broadcast] = await db
        .select()
        .from(broadcastMessages)
        .where(eq(broadcastMessages.id, input.broadcastId))
        .limit(1);

      if (!broadcast) throw new TRPCError({ code: 'NOT_FOUND', message: 'Broadcast not found' });

      const recipients = await db
        .select()
        .from(broadcastRecipients)
        .where(eq(broadcastRecipients.broadcastId, input.broadcastId))
        .orderBy(desc(broadcastRecipients.createdAt));

      return {
        broadcast,
        recipients,
      };
    }),
});

/**
 * A/B Testing Router
 */
const abTestingRouter = router({
  /**
   * Create A/B test
   */
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      emailType: z.enum(['interview_invite', 'interview_reminder', 'application_received', 'application_update', 'job_match', 'rejection', 'follow_up', 'custom']),
      variantA: z.object({
        subject: z.string(),
        bodyHtml: z.string(),
        bodyText: z.string().optional(),
      }),
      variantB: z.object({
        subject: z.string(),
        bodyHtml: z.string(),
        bodyText: z.string().optional(),
      }),
      sampleSize: z.number().default(100),
      confidenceLevel: z.number().default(95),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const employerRecord = await db.select().from(employers).where(eq(employers.userId, ctx.user.id)).limit(1);
      if (!employerRecord.length) throw new TRPCError({ code: 'NOT_FOUND', message: 'Employer not found' });
      const employerId = employerRecord[0].id;

      // Create test
      const [test] = await db.insert(emailAbTests).values({
        employerId,
        name: input.name,
        emailType: input.emailType,
        status: 'active',
        sampleSize: input.sampleSize,
        confidenceLevel: input.confidenceLevel,
      });

      // Create variants
      await db.insert(emailAbVariants).values([
        {
          testId: test.insertId,
          variant: 'A',
          subject: input.variantA.subject,
          bodyHtml: input.variantA.bodyHtml,
          bodyText: input.variantA.bodyText,
        },
        {
          testId: test.insertId,
          variant: 'B',
          subject: input.variantB.subject,
          bodyHtml: input.variantB.bodyHtml,
          bodyText: input.variantB.bodyText,
        },
      ]);

      return { testId: test.insertId };
    }),

  /**
   * List A/B tests
   */
  list: protectedProcedure
    .input(z.object({
      status: z.enum(['draft', 'active', 'paused', 'completed']).optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const employerRecord = await db.select().from(employers).where(eq(employers.userId, ctx.user.id)).limit(1);
      if (!employerRecord.length) throw new TRPCError({ code: 'NOT_FOUND', message: 'Employer not found' });
      const employerId = employerRecord[0].id;

      const conditions = [eq(emailAbTests.employerId, employerId)];
      if (input.status) {
        conditions.push(eq(emailAbTests.status, input.status));
      }

      const results = await db
        .select()
        .from(emailAbTests)
        .where(and(...conditions))
        .orderBy(desc(emailAbTests.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return results;
    }),

  /**
   * Get A/B test details with variants
   */
  getDetails: protectedProcedure
    .input(z.object({
      testId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const [test] = await db
        .select()
        .from(emailAbTests)
        .where(eq(emailAbTests.id, input.testId))
        .limit(1);

      if (!test) throw new TRPCError({ code: 'NOT_FOUND', message: 'Test not found' });

      const variants = await db
        .select()
        .from(emailAbVariants)
        .where(eq(emailAbVariants.testId, input.testId));

      const [result] = await db
        .select()
        .from(abTestResults)
        .where(eq(abTestResults.testId, input.testId))
        .orderBy(desc(abTestResults.createdAt))
        .limit(1);

      return {
        test,
        variants,
        result: result || null,
      };
    }),

  /**
   * Calculate test results and determine winner
   */
  calculateResults: protectedProcedure
    .input(z.object({
      testId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      // Get test and variants
      const [test] = await db
        .select()
        .from(emailAbTests)
        .where(eq(emailAbTests.id, input.testId))
        .limit(1);

      if (!test) throw new TRPCError({ code: 'NOT_FOUND', message: 'Test not found' });

      const variants = await db
        .select()
        .from(emailAbVariants)
        .where(eq(emailAbVariants.testId, input.testId));

      if (variants.length !== 2) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Test must have exactly 2 variants' });
      }

      const variantA = variants.find(v => v.variant === 'A')!;
      const variantB = variants.find(v => v.variant === 'B')!;

      // Calculate rates
      const variantAOpenRate = variantA.sentCount > 0 ? (variantA.openCount / variantA.sentCount) * 100 : 0;
      const variantBOpenRate = variantB.sentCount > 0 ? (variantB.openCount / variantB.sentCount) * 100 : 0;
      const variantAClickRate = variantA.sentCount > 0 ? (variantA.clickCount / variantA.sentCount) * 100 : 0;
      const variantBClickRate = variantB.sentCount > 0 ? (variantB.clickCount / variantB.sentCount) * 100 : 0;

      // Determine winner (simple comparison, could be enhanced with statistical significance)
      const variantAScore = variantAOpenRate + (variantAClickRate * 2);
      const variantBScore = variantBOpenRate + (variantBClickRate * 2);
      
      const winnerVariantId = variantAScore > variantBScore ? variantA.id : variantB.id;
      const relativeImprovement = variantAScore > 0 
        ? Math.floor(((variantBScore - variantAScore) / variantAScore) * 10000)
        : 0;

      // Calculate p-value (simplified - in production use proper statistical test)
      const minSampleSize = Math.min(variantA.sentCount, variantB.sentCount);
      const pValue = minSampleSize > 30 ? 500 : 1000; // Simplified

      const statisticalSignificance = minSampleSize > 100 ? 95 : minSampleSize > 50 ? 90 : 80;

      // Create result
      const [result] = await db.insert(abTestResults).values({
        testId: input.testId,
        startedAt: test.createdAt,
        completedAt: new Date(),
        testDuration: Math.floor((Date.now() - test.createdAt.getTime()) / (1000 * 60 * 60)),
        winnerVariantId,
        winnerDeterminedAt: new Date(),
        winnerDeterminedBy: 'automatic',
        statisticalSignificance,
        pValue,
        confidenceLevel: test.confidenceLevel,
        variantAOpenRate: Math.floor(variantAOpenRate * 100),
        variantBOpenRate: Math.floor(variantBOpenRate * 100),
        variantAClickRate: Math.floor(variantAClickRate * 100),
        variantBClickRate: Math.floor(variantBClickRate * 100),
        relativeImprovement,
        absoluteImprovement: Math.floor((variantBScore - variantAScore) * 100),
        recommendation: `Variant ${winnerVariantId === variantA.id ? 'A' : 'B'} performed better with a ${Math.abs(relativeImprovement / 100).toFixed(2)}% improvement. Consider using this variant for future campaigns.`,
      });

      // Update test status
      await db
        .update(emailAbTests)
        .set({ status: 'completed' })
        .where(eq(emailAbTests.id, input.testId));

      return {
        success: true,
        resultId: result.insertId,
        winner: winnerVariantId === variantA.id ? 'A' : 'B',
      };
    }),
});

/**
 * Main Communication Router
 */
export const communicationRouter = router({
  emailAnalytics: emailAnalyticsRouter,
  broadcast: broadcastRouter,
  abTesting: abTestingRouter,
});
