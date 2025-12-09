import { z } from "zod";
import { eq, desc, and, like, inArray } from "drizzle-orm";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { 
  emailTemplatesV2, 
  templateVariables,
  emailAbTestsV2,
  abTestVariantResults,
  campaignSends,
  emailCampaigns,
  candidates
} from "../drizzle/schema";

/**
 * Email Template System Router
 * 
 * Provides comprehensive email template management with:
 * - Template CRUD operations
 * - Variable management and substitution
 * - A/B testing framework
 * - Campaign tracking and analytics
 * - Personalization engine
 */

export const emailTemplateSystemRouter = router({
  // ============================================================================
  // TEMPLATE MANAGEMENT
  // ============================================================================

  /**
   * Get list of email templates
   */
  getTemplates: protectedProcedure
    .input(z.object({
      category: z.enum([
        'interview_invitation',
        'rejection',
        'offer',
        'follow_up',
        'reminder',
        'welcome',
        'general'
      ]).optional(),
      isActive: z.boolean().optional(),
      search: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const conditions = [eq(emailTemplatesV2.userId, ctx.user.id)];

      if (input.category) {
        conditions.push(eq(emailTemplatesV2.category, input.category));
      }

      if (input.isActive !== undefined) {
        conditions.push(eq(emailTemplatesV2.isActive, input.isActive ? 1 : 0));
      }

      if (input.search) {
        conditions.push(like(emailTemplatesV2.name, `%${input.search}%`));
      }

      const templates = await db
        .select()
        .from(emailTemplatesV2)
        .where(and(...conditions))
        .orderBy(desc(emailTemplatesV2.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return {
        templates,
        total: templates.length,
      };
    }),

  /**
   * Get template by ID
   */
  getTemplate: protectedProcedure
    .input(z.object({
      templateId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [template] = await db
        .select()
        .from(emailTemplatesV2)
        .where(
          and(
            eq(emailTemplatesV2.id, input.templateId),
            eq(emailTemplatesV2.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!template) {
        throw new Error("Template not found");
      }

      return template;
    }),

  /**
   * Create new email template
   */
  createTemplate: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      category: z.enum([
        'interview_invitation',
        'rejection',
        'offer',
        'follow_up',
        'reminder',
        'welcome',
        'general'
      ]),
      subject: z.string(),
      bodyHtml: z.string(),
      bodyText: z.string().optional(),
      variables: z.array(z.object({
        name: z.string(),
        description: z.string(),
        required: z.boolean(),
        defaultValue: z.string().optional(),
      })).optional(),
      isDefault: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [template] = await db.insert(emailTemplatesV2).values({
        userId: ctx.user.id,
        name: input.name,
        description: input.description,
        category: input.category,
        subject: input.subject,
        bodyHtml: input.bodyHtml,
        bodyText: input.bodyText,
        variables: input.variables || [],
        isActive: 1,
        isDefault: input.isDefault ? 1 : 0,
        usageCount: 0,
      }).$returningId();

      return {
        success: true,
        templateId: template.id,
      };
    }),

  /**
   * Update email template
   */
  updateTemplate: protectedProcedure
    .input(z.object({
      templateId: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      subject: z.string().optional(),
      bodyHtml: z.string().optional(),
      bodyText: z.string().optional(),
      variables: z.array(z.object({
        name: z.string(),
        description: z.string(),
        required: z.boolean(),
        defaultValue: z.string().optional(),
      })).optional(),
      isActive: z.boolean().optional(),
      isDefault: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const updates: any = {
        updatedAt: new Date().toISOString(),
      };

      if (input.name) updates.name = input.name;
      if (input.description !== undefined) updates.description = input.description;
      if (input.subject) updates.subject = input.subject;
      if (input.bodyHtml) updates.bodyHtml = input.bodyHtml;
      if (input.bodyText !== undefined) updates.bodyText = input.bodyText;
      if (input.variables) updates.variables = input.variables;
      if (input.isActive !== undefined) updates.isActive = input.isActive ? 1 : 0;
      if (input.isDefault !== undefined) updates.isDefault = input.isDefault ? 1 : 0;

      await db.update(emailTemplatesV2)
        .set(updates)
        .where(
          and(
            eq(emailTemplatesV2.id, input.templateId),
            eq(emailTemplatesV2.userId, ctx.user.id)
          )
        );

      return {
        success: true,
        templateId: input.templateId,
      };
    }),

  /**
   * Delete email template
   */
  deleteTemplate: protectedProcedure
    .input(z.object({
      templateId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.delete(emailTemplatesV2)
        .where(
          and(
            eq(emailTemplatesV2.id, input.templateId),
            eq(emailTemplatesV2.userId, ctx.user.id)
          )
        );

      return {
        success: true,
        templateId: input.templateId,
      };
    }),

  /**
   * Preview template with sample data
   */
  previewTemplate: protectedProcedure
    .input(z.object({
      templateId: z.number(),
      sampleData: z.record(z.string()),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [template] = await db
        .select()
        .from(emailTemplatesV2)
        .where(
          and(
            eq(emailTemplatesV2.id, input.templateId),
            eq(emailTemplatesV2.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!template) {
        throw new Error("Template not found");
      }

      // Substitute variables
      const personalizedSubject = substituteVariables(template.subject, input.sampleData);
      const personalizedBody = substituteVariables(template.bodyHtml, input.sampleData);

      return {
        subject: personalizedSubject,
        bodyHtml: personalizedBody,
        bodyText: template.bodyText ? substituteVariables(template.bodyText, input.sampleData) : null,
      };
    }),

  // ============================================================================
  // VARIABLE MANAGEMENT
  // ============================================================================

  /**
   * Get available template variables
   */
  getAvailableVariables: protectedProcedure
    .input(z.object({
      category: z.enum(['candidate', 'job', 'company', 'interview', 'system']).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      let query = db.select().from(templateVariables);

      if (input.category) {
        query = db
          .select()
          .from(templateVariables)
          .where(eq(templateVariables.category, input.category));
      }

      const variables = await query;

      return variables;
    }),

  /**
   * Create custom template variable
   */
  createVariable: protectedProcedure
    .input(z.object({
      name: z.string(),
      displayName: z.string(),
      description: z.string().optional(),
      category: z.enum(['candidate', 'job', 'company', 'interview', 'system']),
      dataType: z.enum(['string', 'number', 'date', 'boolean', 'array', 'object']),
      sampleValue: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [variable] = await db.insert(templateVariables).values({
        name: input.name,
        displayName: input.displayName,
        description: input.description,
        category: input.category,
        dataType: input.dataType,
        sampleValue: input.sampleValue,
        isSystem: 0,
      }).$returningId();

      return {
        success: true,
        variableId: variable.id,
      };
    }),

  // ============================================================================
  // A/B TESTING
  // ============================================================================

  /**
   * Get list of A/B tests
   */
  getABTests: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const tests = await db
        .select()
        .from(emailAbTestsV2)
        .where(eq(emailAbTestsV2.userId, ctx.user.id))
        .orderBy(desc(emailAbTestsV2.createdAt));

      // Get variant results for each test
      const testsWithResults = await Promise.all(
        tests.map(async (test) => {
          const results = await db
            .select()
            .from(abTestVariantResults)
            .where(eq(abTestVariantResults.testId, test.id));

          const variantA = results.find(r => r.variant === 'A');
          const variantB = results.find(r => r.variant === 'B');

          return {
            ...test,
            variantASent: variantA?.sentCount || 0,
            variantBSent: variantB?.sentCount || 0,
          };
        })
      );

      return testsWithResults;
    }),

  /**
   * Create A/B test
   */
  createAbTest: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      testType: z.enum(['subject', 'content', 'send_time', 'full_template']),
      variantATemplateId: z.number(),
      variantBTemplateId: z.number(),
      trafficSplit: z.number().default(50),
      minimumSampleSize: z.number().default(100),
      confidenceLevel: z.number().default(95),
      primaryMetric: z.enum(['open_rate', 'click_rate', 'response_rate', 'conversion_rate']),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [test] = await db.insert(emailAbTestsV2).values({
        userId: ctx.user.id,
        name: input.name,
        description: input.description,
        testType: input.testType,
        variantATemplateId: input.variantATemplateId,
        variantBTemplateId: input.variantBTemplateId,
        status: 'draft',
        trafficSplit: input.trafficSplit,
        minimumSampleSize: input.minimumSampleSize,
        confidenceLevel: input.confidenceLevel,
        primaryMetric: input.primaryMetric,
      }).$returningId();

      // Create result records for both variants
      await db.insert(abTestVariantResults).values([
        {
          testId: test.id,
          variant: 'A',
          sentCount: 0,
          deliveredCount: 0,
          openedCount: 0,
          clickedCount: 0,
          respondedCount: 0,
          convertedCount: 0,
          bouncedCount: 0,
          unsubscribedCount: 0,
          openRate: 0,
          clickRate: 0,
          responseRate: 0,
          conversionRate: 0,
        },
        {
          testId: test.id,
          variant: 'B',
          sentCount: 0,
          deliveredCount: 0,
          openedCount: 0,
          clickedCount: 0,
          respondedCount: 0,
          convertedCount: 0,
          bouncedCount: 0,
          unsubscribedCount: 0,
          openRate: 0,
          clickRate: 0,
          responseRate: 0,
          conversionRate: 0,
        },
      ]);

      return {
        success: true,
        testId: test.id,
      };
    }),

  /**
   * Start A/B test
   */
  startABTest: protectedProcedure
    .input(z.object({
      testId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.update(emailAbTestsV2)
        .set({
          status: 'running',
          startedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(emailAbTestsV2.id, input.testId),
            eq(emailAbTestsV2.userId, ctx.user.id)
          )
        );

      return {
        success: true,
        testId: input.testId,
      };
    }),

  /**
   * Stop A/B test
   */
  stopABTest: protectedProcedure
    .input(z.object({
      testId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.update(emailAbTestsV2)
        .set({
          status: 'cancelled',
          completedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(emailAbTestsV2.id, input.testId),
            eq(emailAbTestsV2.userId, ctx.user.id)
          )
        );

      return {
        success: true,
        testId: input.testId,
      };
    }),

  /**
   * Get A/B test results
   */
  getAbTestResults: protectedProcedure
    .input(z.object({
      testId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [test] = await db
        .select()
        .from(emailAbTestsV2)
        .where(
          and(
            eq(emailAbTestsV2.id, input.testId),
            eq(emailAbTestsV2.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!test) {
        throw new Error("Test not found");
      }

      const results = await db
        .select()
        .from(abTestVariantResults)
        .where(eq(abTestVariantResults.testId, input.testId));

      const variantA = results.find(r => r.variant === 'A');
      const variantB = results.find(r => r.variant === 'B');

      // Calculate statistical significance
      const significance = calculateStatisticalSignificance(variantA, variantB, test.primaryMetric);

      return {
        test,
        variantA,
        variantB,
        significance,
        hasWinner: significance.isSignificant,
        winner: significance.isSignificant ? significance.winner : null,
      };
    }),

  /**
   * Complete A/B test and declare winner
   */
  completeAbTest: protectedProcedure
    .input(z.object({
      testId: z.number(),
      winner: z.enum(['A', 'B', 'no_winner']),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.update(emailAbTestsV2)
        .set({
          status: 'completed',
          completedAt: new Date().toISOString(),
          winnerVariant: input.winner,
          winnerDeterminedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(emailAbTestsV2.id, input.testId),
            eq(emailAbTestsV2.userId, ctx.user.id)
          )
        );

      return {
        success: true,
        testId: input.testId,
        winner: input.winner,
      };
    }),

  // ============================================================================
  // CAMPAIGN TRACKING
  // ============================================================================

  /**
   * Track campaign send
   */
  trackCampaignSend: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
      templateId: z.number(),
      candidateId: z.number(),
      recipientEmail: z.string(),
      recipientName: z.string().optional(),
      personalizedSubject: z.string(),
      personalizedBody: z.string(),
      variablesUsed: z.record(z.string()),
      abTestId: z.number().optional(),
      variant: z.enum(['A', 'B', 'control']).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [send] = await db.insert(campaignSends).values({
        campaignId: input.campaignId,
        abTestId: input.abTestId,
        variant: input.variant,
        templateId: input.templateId,
        candidateId: input.candidateId,
        recipientEmail: input.recipientEmail,
        recipientName: input.recipientName,
        personalizedSubject: input.personalizedSubject,
        personalizedBody: input.personalizedBody,
        variablesUsed: input.variablesUsed,
        status: 'sent',
        sentAt: new Date().toISOString(),
      }).$returningId();

      // Update template usage count
      await db.update(emailTemplatesV2)
        .set({
          usageCount: emailTemplatesV2.usageCount + 1,
          lastUsedAt: new Date().toISOString(),
        })
        .where(eq(emailTemplatesV2.id, input.templateId));

      return {
        success: true,
        sendId: send.id,
      };
    }),

  /**
   * Update campaign send status
   */
  updateCampaignSendStatus: protectedProcedure
    .input(z.object({
      sendId: z.number(),
      status: z.enum(['pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed']),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const updates: any = {
        status: input.status,
        updatedAt: new Date().toISOString(),
      };

      if (input.status === 'delivered') {
        updates.deliveredAt = new Date().toISOString();
      } else if (input.status === 'opened') {
        updates.openedAt = new Date().toISOString();
        updates.openCount = campaignSends.openCount + 1;
      } else if (input.status === 'clicked') {
        updates.clickedAt = new Date().toISOString();
        updates.clickCount = campaignSends.clickCount + 1;
      } else if (input.status === 'bounced') {
        updates.bouncedAt = new Date().toISOString();
      }

      await db.update(campaignSends)
        .set(updates)
        .where(eq(campaignSends.id, input.sendId));

      return {
        success: true,
        sendId: input.sendId,
      };
    }),

  /**
   * Get campaign analytics
   */
  getCampaignAnalytics: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const sends = await db
        .select()
        .from(campaignSends)
        .where(eq(campaignSends.campaignId, input.campaignId));

      const totalSent = sends.length;
      const delivered = sends.filter(s => s.status === 'delivered' || s.status === 'opened' || s.status === 'clicked').length;
      const opened = sends.filter(s => s.status === 'opened' || s.status === 'clicked').length;
      const clicked = sends.filter(s => s.status === 'clicked').length;
      const bounced = sends.filter(s => s.status === 'bounced').length;

      const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 0;
      const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
      const clickRate = opened > 0 ? (clicked / opened) * 100 : 0;
      const bounceRate = totalSent > 0 ? (bounced / totalSent) * 100 : 0;

      return {
        totalSent,
        delivered,
        opened,
        clicked,
        bounced,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
        bounceRate: Math.round(bounceRate * 100) / 100,
      };
    }),

  /**
   * Get template analytics and performance metrics
   */
  getTemplateAnalytics: protectedProcedure
    .input(z.object({
      category: z.enum([
        'interview_invitation',
        'rejection',
        'offer',
        'follow_up',
        'reminder',
        'welcome',
        'general'
      ]).optional(),
      days: z.number().default(30),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Get all templates with their analytics
      const conditions = [eq(emailTemplatesV2.userId, ctx.user.id)];
      if (input.category) {
        conditions.push(eq(emailTemplatesV2.category, input.category));
      }

      const templates = await db
        .select()
        .from(emailTemplatesV2)
        .where(and(...conditions))
        .orderBy(desc(emailTemplatesV2.usageCount));

      // Calculate analytics for each template
      const templateAnalytics = await Promise.all(
        templates.map(async (template) => {
          // Get campaign sends for this template
          const sends = await db
            .select()
            .from(campaignSends)
            .where(eq(campaignSends.templateId, template.id));

          const sentCount = sends.length;
          const deliveredCount = sends.filter(s => s.status === 'delivered' || s.status === 'opened' || s.status === 'clicked').length;
          const openedCount = sends.filter(s => s.status === 'opened' || s.status === 'clicked').length;
          const clickedCount = sends.filter(s => s.status === 'clicked').length;
          const respondedCount = sends.filter(s => s.openCount && s.openCount > 1).length;

          return {
            ...template,
            sentCount,
            deliveredCount,
            openedCount,
            clickedCount,
            respondedCount,
          };
        })
      );

      // Calculate summary statistics
      const totalTemplates = templates.length;
      const totalSent = templateAnalytics.reduce((sum, t) => sum + t.sentCount, 0);
      const totalOpened = templateAnalytics.reduce((sum, t) => sum + t.openedCount, 0);
      const totalClicked = templateAnalytics.reduce((sum, t) => sum + t.clickedCount, 0);
      const totalResponded = templateAnalytics.reduce((sum, t) => sum + t.respondedCount, 0);

      const avgOpenRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
      const avgClickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
      const avgResponseRate = totalSent > 0 ? (totalResponded / totalSent) * 100 : 0;

      // Get top performing templates (by engagement rate)
      const topPerforming = templateAnalytics
        .filter(t => t.sentCount > 0)
        .map(t => ({
          ...t,
          engagementRate: ((t.openedCount + t.clickedCount) / t.sentCount) * 100,
        }))
        .sort((a, b) => b.engagementRate - a.engagementRate)
        .slice(0, 5);

      // Get recently used templates
      const recentlyUsed = templates
        .filter(t => t.lastUsedAt)
        .sort((a, b) => {
          const dateA = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
          const dateB = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 5);

      return {
        summary: {
          totalTemplates,
          totalSent,
          avgOpenRate,
          avgClickRate,
          avgResponseRate,
        },
        templates: templateAnalytics,
        topPerforming,
        recentlyUsed,
      };
    }),
});

/**
 * Substitute variables in template text
 */
function substituteVariables(text: string, variables: Record<string, string>): string {
  let result = text;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  }

  return result;
}

/**
 * Calculate statistical significance for A/B test
 */
function calculateStatisticalSignificance(
  variantA: any,
  variantB: any,
  metric: string
): {
  isSignificant: boolean;
  winner: 'A' | 'B' | null;
  pValue: number;
  confidenceLevel: number;
} {
  if (!variantA || !variantB) {
    return {
      isSignificant: false,
      winner: null,
      pValue: 1,
      confidenceLevel: 0,
    };
  }

  // Get metric values
  const metricKey = metric === 'open_rate' ? 'openRate' :
                    metric === 'click_rate' ? 'clickRate' :
                    metric === 'response_rate' ? 'responseRate' :
                    'conversionRate';

  const rateA = variantA[metricKey] / 100; // Convert from percentage
  const rateB = variantB[metricKey] / 100;
  const nA = variantA.sentCount;
  const nB = variantB.sentCount;

  // Simple z-test for proportions
  const pooledRate = (rateA * nA + rateB * nB) / (nA + nB);
  const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1/nA + 1/nB));
  const z = Math.abs(rateA - rateB) / se;
  
  // Approximate p-value from z-score
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));
  
  // Check if significant at 95% confidence level
  const isSignificant = pValue < 0.05 && Math.min(nA, nB) >= 30;
  
  const winner = isSignificant ? (rateA > rateB ? 'A' : 'B') : null;

  return {
    isSignificant,
    winner,
    pValue: Math.round(pValue * 10000) / 10000,
    confidenceLevel: isSignificant ? 95 : 0,
  };
}



/**
 * Normal cumulative distribution function (approximation)
 */
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}
