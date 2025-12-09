import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { 
  emailTemplatesV2,
  workflowAnalytics,
  campaignSends,
  candidates
} from "../drizzle/schema";
import { eq, and, sql, desc, inArray } from "drizzle-orm";

/**
 * Campaign Template Library with ML-optimized send times
 * Pre-configured templates with historical performance data and smart send time predictions
 */

interface TemplateWithOptimization {
  id: number;
  name: string;
  subject: string;
  category: string;
  description: string | null;
  htmlContent: string;
  variables: string[];
  
  // Performance metrics
  usageCount: number;
  avgOpenRate: number;
  avgClickRate: number;
  avgConversionRate: number;
  
  // ML-optimized send times
  optimalDayOfWeek: number;
  optimalHour: number;
  expectedConversionRate: number;
  confidence: 'high' | 'medium' | 'low';
  
  // Segment recommendations
  recommendedFor: {
    industry?: string;
    experienceLevel?: string;
    location?: string;
  };
}

/**
 * Analyze send time performance for a specific template
 */
async function analyzeTemplateSendTime(
  db: any,
  templateId: number
): Promise<{
  optimalDayOfWeek: number;
  optimalHour: number;
  expectedConversionRate: number;
  confidence: 'high' | 'medium' | 'low';
}> {
  // Get all sends for this template
  const sends = await db
    .select({
      sentAt: campaignSends.sentAt,
      status: campaignSends.status,
      openCount: campaignSends.openCount,
      clickCount: campaignSends.clickCount,
    })
    .from(campaignSends)
    .where(eq(campaignSends.templateId, templateId));

  if (sends.length < 10) {
    // Not enough data, return default optimal time (Tuesday 10 AM)
    return {
      optimalDayOfWeek: 2, // Tuesday
      optimalHour: 10,
      expectedConversionRate: 0.05,
      confidence: 'low',
    };
  }

  // Analyze performance by day and hour
  const performanceByTime: Record<string, {
    opens: number;
    clicks: number;
    conversions: number;
    total: number;
  }> = {};

  for (const send of sends) {
    if (!send.sentAt) continue;
    
    const date = new Date(send.sentAt);
    const dayOfWeek = date.getDay();
    const hour = date.getHours();
    const key = `${dayOfWeek}-${hour}`;

    if (!performanceByTime[key]) {
      performanceByTime[key] = { opens: 0, clicks: 0, conversions: 0, total: 0 };
    }

    performanceByTime[key].total++;
    
    if (send.status === 'opened' || send.status === 'clicked') {
      performanceByTime[key].opens++;
    }
    if (send.status === 'clicked') {
      performanceByTime[key].clicks++;
      performanceByTime[key].conversions++; // Simplified: click = conversion
    }
  }

  // Find the time slot with highest conversion rate
  let bestKey = '';
  let bestConversionRate = 0;
  let bestSampleSize = 0;

  for (const [key, stats] of Object.entries(performanceByTime)) {
    if (stats.total < 3) continue; // Need minimum sample size
    
    const conversionRate = stats.conversions / stats.total;
    if (conversionRate > bestConversionRate) {
      bestConversionRate = conversionRate;
      bestKey = key;
      bestSampleSize = stats.total;
    }
  }

  if (!bestKey) {
    // Fallback to default
    return {
      optimalDayOfWeek: 2,
      optimalHour: 10,
      expectedConversionRate: 0.05,
      confidence: 'low',
    };
  }

  const [dayStr, hourStr] = bestKey.split('-');
  const confidence = bestSampleSize >= 30 ? 'high' : bestSampleSize >= 10 ? 'medium' : 'low';

  return {
    optimalDayOfWeek: parseInt(dayStr),
    optimalHour: parseInt(hourStr),
    expectedConversionRate: bestConversionRate,
    confidence,
  };
}

/**
 * Get recommended segment for a template based on historical performance
 */
async function getTemplateSegmentRecommendation(
  db: any,
  templateId: number
): Promise<{
  industry?: string;
  experienceLevel?: string;
  location?: string;
}> {
  // Get candidates who received this template and had positive engagement
  const engagedSends = await db
    .select({
      candidateId: campaignSends.candidateId,
    })
    .from(campaignSends)
    .where(
      and(
        eq(campaignSends.templateId, templateId),
        inArray(campaignSends.status, ['opened', 'clicked'])
      )
    );

  if (engagedSends.length === 0) {
    return {};
  }

  const candidateIds = engagedSends.map(s => s.candidateId);
  
  // Get candidate profiles
  const candidateProfiles = await db
    .select({
      industry: candidates.industry,
      experienceLevel: candidates.experienceLevel,
      location: candidates.location,
    })
    .from(candidates)
    .where(inArray(candidates.id, candidateIds));

  // Find most common attributes
  const industryCounts: Record<string, number> = {};
  const experienceCounts: Record<string, number> = {};
  const locationCounts: Record<string, number> = {};

  for (const profile of candidateProfiles) {
    if (profile.industry) {
      industryCounts[profile.industry] = (industryCounts[profile.industry] || 0) + 1;
    }
    if (profile.experienceLevel) {
      experienceCounts[profile.experienceLevel] = (experienceCounts[profile.experienceLevel] || 0) + 1;
    }
    if (profile.location) {
      locationCounts[profile.location] = (locationCounts[profile.location] || 0) + 1;
    }
  }

  const getMostCommon = (counts: Record<string, number>) => {
    let maxCount = 0;
    let mostCommon = '';
    for (const [key, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = key;
      }
    }
    return mostCommon || undefined;
  };

  return {
    industry: getMostCommon(industryCounts),
    experienceLevel: getMostCommon(experienceCounts),
    location: getMostCommon(locationCounts),
  };
}

export const campaignTemplateLibraryRouter = router({
  /**
   * Get all templates with ML-optimized send times and performance metrics
   */
  getTemplateLibrary: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        sortBy: z.enum(['performance', 'usage', 'recent']).optional().default('performance'),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get all templates for this user
      let query = db
        .select()
        .from(emailTemplatesV2)
        .where(eq(emailTemplatesV2.userId, ctx.user.id));

      if (input.category) {
        query = query.where(
          and(
            eq(emailTemplatesV2.userId, ctx.user.id),
            eq(emailTemplatesV2.category, input.category)
          )
        );
      }

      const templates = await query;

      // Enhance each template with optimization data
      const enhancedTemplates: TemplateWithOptimization[] = await Promise.all(
        templates.map(async (template) => {
          // Get performance metrics
          const sends = await db
            .select()
            .from(campaignSends)
            .where(eq(campaignSends.templateId, template.id));

          const totalSends = sends.length;
          const opens = sends.filter(s => s.status === 'opened' || s.status === 'clicked').length;
          const clicks = sends.filter(s => s.status === 'clicked').length;
          const conversions = clicks; // Simplified

          const avgOpenRate = totalSends > 0 ? opens / totalSends : 0;
          const avgClickRate = totalSends > 0 ? clicks / totalSends : 0;
          const avgConversionRate = totalSends > 0 ? conversions / totalSends : 0;

          // Get ML-optimized send time
          const sendTimeOptimization = await analyzeTemplateSendTime(db, template.id);

          // Get segment recommendation
          const recommendedFor = await getTemplateSegmentRecommendation(db, template.id);

          return {
            id: template.id,
            name: template.name,
            subject: template.subject,
            category: template.category,
            description: template.description,
            htmlContent: template.htmlContent,
            variables: template.variables ? JSON.parse(template.variables) : [],
            usageCount: template.usageCount || 0,
            avgOpenRate,
            avgClickRate,
            avgConversionRate,
            optimalDayOfWeek: sendTimeOptimization.optimalDayOfWeek,
            optimalHour: sendTimeOptimization.optimalHour,
            expectedConversionRate: sendTimeOptimization.expectedConversionRate,
            confidence: sendTimeOptimization.confidence,
            recommendedFor,
          };
        })
      );

      // Sort templates
      let sorted = enhancedTemplates;
      if (input.sortBy === 'performance') {
        sorted = enhancedTemplates.sort((a, b) => b.avgConversionRate - a.avgConversionRate);
      } else if (input.sortBy === 'usage') {
        sorted = enhancedTemplates.sort((a, b) => b.usageCount - a.usageCount);
      }

      return {
        templates: sorted,
        totalCount: sorted.length,
      };
    }),

  /**
   * Get template recommendations for a specific candidate segment
   */
  getRecommendedTemplates: protectedProcedure
    .input(
      z.object({
        segment: z.object({
          industry: z.string().optional(),
          experienceLevel: z.string().optional(),
          location: z.string().optional(),
        }),
        limit: z.number().optional().default(5),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get all templates
      const templates = await db
        .select()
        .from(emailTemplatesV2)
        .where(eq(emailTemplatesV2.userId, ctx.user.id));

      // Score each template based on segment match and performance
      const scoredTemplates = await Promise.all(
        templates.map(async (template) => {
          const recommendedFor = await getTemplateSegmentRecommendation(db, template.id);
          const sendTimeOptimization = await analyzeTemplateSendTime(db, template.id);

          // Calculate match score
          let matchScore = 0;
          if (input.segment.industry && recommendedFor.industry === input.segment.industry) {
            matchScore += 3;
          }
          if (input.segment.experienceLevel && recommendedFor.experienceLevel === input.segment.experienceLevel) {
            matchScore += 2;
          }
          if (input.segment.location && recommendedFor.location === input.segment.location) {
            matchScore += 1;
          }

          // Add performance score
          const performanceScore = sendTimeOptimization.expectedConversionRate * 10;
          const totalScore = matchScore + performanceScore;

          return {
            template,
            recommendedFor,
            sendTimeOptimization,
            matchScore,
            totalScore,
          };
        })
      );

      // Sort by total score and return top N
      const topTemplates = scoredTemplates
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, input.limit)
        .map(item => ({
          ...item.template,
          recommendedFor: item.recommendedFor,
          optimalDayOfWeek: item.sendTimeOptimization.optimalDayOfWeek,
          optimalHour: item.sendTimeOptimization.optimalHour,
          expectedConversionRate: item.sendTimeOptimization.expectedConversionRate,
          confidence: item.sendTimeOptimization.confidence,
          matchScore: item.matchScore,
        }));

      return {
        recommendations: topTemplates,
      };
    }),
});
