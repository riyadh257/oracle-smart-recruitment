import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

/**
 * Advanced Analytics Router
 * Handles A/B test insights, template performance alerts, and smart campaign scheduling
 */
export const advancedAnalyticsRouter = router({
  // ============================================
  // A/B TEST INSIGHTS
  // ============================================
  
  /**
   * Get A/B test insights with historical performance trends
   */
  getABTestInsights: protectedProcedure
    .input(z.object({
      testId: z.number().optional(),
      segmentType: z.enum(['all', 'industry', 'experience_level', 'location', 'skill_category']).optional(),
    }))
    .query(async ({ input }) => {
      const insights = await db.getABTestInsights(input.testId);
      
      // Filter by segment type if provided
      if (input.segmentType) {
        return insights.filter((i: any) => i.segmentType === input.segmentType);
      }
      
      return insights;
    }),

  /**
   * Create A/B test insight record
   */
  createABTestInsight: protectedProcedure
    .input(z.object({
      testId: z.number(),
      segmentType: z.enum(['all', 'industry', 'experience_level', 'location', 'skill_category']).default('all'),
      segmentValue: z.string().optional(),
      winnerVariantId: z.number().optional(),
      openRateImprovement: z.number().default(0),
      clickRateImprovement: z.number().default(0),
      conversionRateImprovement: z.number().default(0),
      roi: z.number().default(0),
      costSavings: z.number().default(0),
      revenueImpact: z.number().default(0),
      sampleSize: z.number(),
      confidenceLevel: z.number().default(95),
    }))
    .mutation(async ({ input }) => {
      const result = await db.createABTestInsight(input);
      return { success: true, id: result.insertId };
    }),

  /**
   * Get A/B test performance trends over time
   */
  getABTestTrends: protectedProcedure
    .input(z.object({
      segmentType: z.enum(['all', 'industry', 'experience_level', 'location', 'skill_category']).optional(),
      limit: z.number().default(30),
    }))
    .query(async ({ input }) => {
      const insights = await db.getABTestInsights();
      
      // Filter and aggregate by segment
      const filtered = input.segmentType 
        ? insights.filter((i: any) => i.segmentType === input.segmentType)
        : insights;
      
      // Calculate trends
      const trends = filtered.slice(0, input.limit).map((insight: any) => ({
        date: insight.createdAt,
        segmentType: insight.segmentType,
        segmentValue: insight.segmentValue,
        openRateImprovement: insight.openRateImprovement / 100,
        clickRateImprovement: insight.clickRateImprovement / 100,
        conversionRateImprovement: insight.conversionRateImprovement / 100,
        roi: insight.roi / 100,
      }));
      
      return trends;
    }),

  /**
   * Get winning patterns by segment
   */
  getWinningPatterns: protectedProcedure
    .query(async () => {
      const insights = await db.getABTestInsights();
      
      // Group by segment and calculate win rates
      const patterns: Record<string, any> = {};
      
      insights.forEach((insight: any) => {
        const key = `${insight.segmentType}:${insight.segmentValue || 'all'}`;
        
        if (!patterns[key]) {
          patterns[key] = {
            segmentType: insight.segmentType,
            segmentValue: insight.segmentValue,
            testCount: 0,
            avgOpenRateImprovement: 0,
            avgClickRateImprovement: 0,
            avgConversionRateImprovement: 0,
            avgROI: 0,
            totalCostSavings: 0,
            totalRevenueImpact: 0,
          };
        }
        
        patterns[key].testCount++;
        patterns[key].avgOpenRateImprovement += insight.openRateImprovement / 100;
        patterns[key].avgClickRateImprovement += insight.clickRateImprovement / 100;
        patterns[key].avgConversionRateImprovement += insight.conversionRateImprovement / 100;
        patterns[key].avgROI += insight.roi / 100;
        patterns[key].totalCostSavings += insight.costSavings;
        patterns[key].totalRevenueImpact += insight.revenueImpact;
      });
      
      // Calculate averages
      Object.values(patterns).forEach((pattern: any) => {
        pattern.avgOpenRateImprovement /= pattern.testCount;
        pattern.avgClickRateImprovement /= pattern.testCount;
        pattern.avgConversionRateImprovement /= pattern.testCount;
        pattern.avgROI /= pattern.testCount;
      });
      
      return Object.values(patterns);
    }),

  // ============================================
  // TEMPLATE PERFORMANCE ALERTS
  // ============================================
  
  /**
   * Get template performance metrics
   */
  getTemplatePerformanceMetrics: protectedProcedure
    .input(z.object({
      templateId: z.number(),
      limit: z.number().default(30),
    }))
    .query(async ({ input }) => {
      const metrics = await db.getTemplatePerformanceMetrics(input.templateId, input.limit);
      
      return metrics.map((m: any) => ({
        ...m,
        openRate: m.openRate / 100,
        clickRate: m.clickRate / 100,
        conversionRate: m.conversionRate / 100,
        bounceRate: m.bounceRate / 100,
        unsubscribeRate: m.unsubscribeRate / 100,
        averageOpenRate: m.averageOpenRate / 100,
        averageClickRate: m.averageClickRate / 100,
        averageConversionRate: m.averageConversionRate / 100,
      }));
    }),

  /**
   * Get template alert configuration
   */
  getTemplateAlertConfig: protectedProcedure
    .input(z.object({
      templateId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      return await db.getTemplateAlertConfig(input.templateId);
    }),

  /**
   * Create or update template alert configuration
   */
  upsertTemplateAlertConfig: protectedProcedure
    .input(z.object({
      templateId: z.number(),
      alertType: z.enum(['open_rate_drop', 'click_rate_drop', 'conversion_drop', 'bounce_spike', 'unsubscribe_spike']),
      thresholdPercentage: z.number().default(20),
      comparisonPeriodDays: z.number().default(30),
      isEnabled: z.boolean().default(true),
      notifyOwner: z.boolean().default(true),
      notifyUsers: z.array(z.number()).optional(),
    }))
    .mutation(async ({ input }) => {
      const data = {
        ...input,
        isEnabled: input.isEnabled ? 1 : 0,
        notifyOwner: input.notifyOwner ? 1 : 0,
        notifyUsers: input.notifyUsers ? JSON.stringify(input.notifyUsers) : null,
      };
      
      const result = await db.upsertTemplateAlertConfig(data);
      return { success: true, id: result.insertId };
    }),

  /**
   * Get template alert history
   */
  getTemplateAlertHistory: protectedProcedure
    .input(z.object({
      templateId: z.number().optional(),
      acknowledged: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      return await db.getTemplateAlertHistory(input.templateId, input.acknowledged);
    }),

  /**
   * Acknowledge template alert
   */
  acknowledgeTemplateAlert: protectedProcedure
    .input(z.object({
      alertId: z.number(),
      actionTaken: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      
      return await db.acknowledgeTemplateAlert(input.alertId, ctx.user.id, input.actionTaken);
    }),

  /**
   * Check and trigger template performance alerts
   */
  checkTemplatePerformance: protectedProcedure
    .input(z.object({
      templateId: z.number(),
    }))
    .mutation(async ({ input }) => {
      // Get alert configurations for this template
      const configs = await db.getTemplateAlertConfig(input.templateId);
      
      if (configs.length === 0) {
        return { alertsTriggered: 0 };
      }
      
      // Get recent performance metrics
      const metrics = await db.getTemplatePerformanceMetrics(input.templateId, 1);
      
      if (metrics.length === 0) {
        return { alertsTriggered: 0 };
      }
      
      const latest = metrics[0] as any;
      let alertsTriggered = 0;
      
      // Check each alert configuration
      for (const config of configs) {
        const c = config as any;
        if (!c.isEnabled) continue;
        
        let shouldAlert = false;
        let currentValue = 0;
        let historicalAverage = 0;
        let message = '';
        let recommendation = '';
        
        switch (c.alertType) {
          case 'open_rate_drop':
            currentValue = latest.openRate;
            historicalAverage = latest.averageOpenRate;
            if (currentValue < historicalAverage * (1 - c.thresholdPercentage / 100)) {
              shouldAlert = true;
              message = `Open rate dropped to ${(currentValue / 100).toFixed(2)}% (avg: ${(historicalAverage / 100).toFixed(2)}%)`;
              recommendation = 'Consider refreshing subject lines or testing different send times';
            }
            break;
          
          case 'click_rate_drop':
            currentValue = latest.clickRate;
            historicalAverage = latest.averageClickRate;
            if (currentValue < historicalAverage * (1 - c.thresholdPercentage / 100)) {
              shouldAlert = true;
              message = `Click rate dropped to ${(currentValue / 100).toFixed(2)}% (avg: ${(historicalAverage / 100).toFixed(2)}%)`;
              recommendation = 'Review email content and call-to-action effectiveness';
            }
            break;
          
          case 'conversion_drop':
            currentValue = latest.conversionRate;
            historicalAverage = latest.averageConversionRate;
            if (currentValue < historicalAverage * (1 - c.thresholdPercentage / 100)) {
              shouldAlert = true;
              message = `Conversion rate dropped to ${(currentValue / 100).toFixed(2)}% (avg: ${(historicalAverage / 100).toFixed(2)}%)`;
              recommendation = 'Analyze landing page experience and offer relevance';
            }
            break;
          
          case 'bounce_spike':
            currentValue = latest.bounceRate;
            historicalAverage = latest.averageOpenRate; // Use open rate as proxy
            if (currentValue > historicalAverage * (1 + c.thresholdPercentage / 100)) {
              shouldAlert = true;
              message = `Bounce rate spiked to ${(currentValue / 100).toFixed(2)}%`;
              recommendation = 'Clean email list and verify email addresses';
            }
            break;
          
          case 'unsubscribe_spike':
            currentValue = latest.unsubscribeRate;
            if (currentValue > c.thresholdPercentage) {
              shouldAlert = true;
              message = `Unsubscribe rate spiked to ${(currentValue / 100).toFixed(2)}%`;
              recommendation = 'Review email frequency and content relevance';
            }
            break;
        }
        
        if (shouldAlert) {
          const percentageChange = historicalAverage > 0 
            ? Math.round(((currentValue - historicalAverage) / historicalAverage) * 10000)
            : 0;
          
          const severity = Math.abs(percentageChange) > 5000 ? 'critical' 
                         : Math.abs(percentageChange) > 3000 ? 'warning' 
                         : 'info';
          
          await db.createTemplateAlert({
            configId: c.id,
            templateId: input.templateId,
            alertType: c.alertType,
            currentValue,
            historicalAverage,
            percentageChange,
            severity,
            message,
            recommendation,
            acknowledged: 0,
          });
          
          alertsTriggered++;
        }
      }
      
      return { alertsTriggered };
    }),

  // ============================================
  // SMART CAMPAIGN SCHEDULING
  // ============================================
  
  /**
   * Get campaign schedule predictions for candidates
   */
  getCampaignSchedulePredictions: protectedProcedure
    .input(z.object({
      candidateIds: z.array(z.number()).optional(),
    }))
    .query(async ({ input }) => {
      return await db.getCampaignSchedulePredictions(input.candidateIds);
    }),

  /**
   * Generate optimal send time prediction for a candidate
   */
  generateSendTimePrediction: protectedProcedure
    .input(z.object({
      candidateId: z.number(),
      timezone: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Get candidate's historical engagement data
      // This is a simplified ML prediction - in production, use actual ML model
      
      // Default optimal times based on general email marketing best practices
      const optimalTimes = [
        { hour: 9, dayOfWeek: 2, confidence: 75 },  // Tuesday 9 AM
        { hour: 10, dayOfWeek: 3, confidence: 70 }, // Wednesday 10 AM
        { hour: 14, dayOfWeek: 4, confidence: 65 }, // Thursday 2 PM
      ];
      
      // Select best time
      const best = optimalTimes[0];
      
      const prediction = {
        candidateId: input.candidateId,
        timezone: input.timezone,
        optimalSendTime: `${best.hour.toString().padStart(2, '0')}:00`,
        optimalDayOfWeek: best.dayOfWeek,
        predictionConfidence: best.confidence,
        basedOnHistoricalData: 1,
        historicalOpenRate: 0,
        historicalClickRate: 0,
        lastEngagementTime: null,
        engagementPattern: JSON.stringify(optimalTimes),
        modelVersion: 'v1.0',
      };
      
      const result = await db.upsertCampaignSchedulePrediction(prediction);
      return { success: true, prediction, id: result.insertId };
    }),

  /**
   * Get scheduled campaign queue
   */
  getScheduledCampaignQueue: protectedProcedure
    .input(z.object({
      status: z.enum(['queued', 'sent', 'failed', 'cancelled']).optional(),
      limit: z.number().default(100),
    }))
    .query(async ({ input }) => {
      return await db.getScheduledCampaignQueue(input.status, input.limit);
    }),

  /**
   * Schedule campaign with optimal send times
   */
  scheduleCampaignWithOptimalTimes: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
      candidateIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      const scheduled = [];
      
      for (const candidateId of input.candidateIds) {
        // Get or generate prediction
        const predictions = await db.getCampaignSchedulePredictions([candidateId]);
        let prediction = predictions[0] as any;
        
        if (!prediction) {
          // Generate default prediction
          const result = await db.upsertCampaignSchedulePrediction({
            candidateId,
            timezone: 'Asia/Riyadh',
            optimalSendTime: '09:00',
            optimalDayOfWeek: 2,
            predictionConfidence: 50,
            basedOnHistoricalData: 0,
            modelVersion: 'v1.0',
          });
          
          prediction = {
            id: result.insertId,
            candidateId,
            timezone: 'Asia/Riyadh',
            optimalSendTime: '09:00',
            optimalDayOfWeek: 2,
          };
        }
        
        // Calculate next optimal send time
        const now = new Date();
        const targetDay = prediction.optimalDayOfWeek;
        const targetHour = parseInt(prediction.optimalSendTime.split(':')[0]);
        
        const scheduledDate = new Date(now);
        scheduledDate.setDate(now.getDate() + ((targetDay - now.getDay() + 7) % 7));
        scheduledDate.setHours(targetHour, 0, 0, 0);
        
        // If calculated time is in the past, move to next week
        if (scheduledDate < now) {
          scheduledDate.setDate(scheduledDate.getDate() + 7);
        }
        
        const queueItem = {
          campaignId: input.campaignId,
          candidateId,
          scheduledSendTime: scheduledDate,
          candidateLocalTime: `${prediction.optimalSendTime} ${prediction.timezone}`,
          timezone: prediction.timezone,
          predictionId: prediction.id,
          status: 'queued',
          priority: 5,
        };
        
        await db.addToScheduledCampaignQueue(queueItem);
        scheduled.push(queueItem);
      }
      
      return { success: true, scheduled: scheduled.length };
    }),

  /**
   * Get campaign send time analytics
   */
  getCampaignSendTimeAnalytics: protectedProcedure
    .input(z.object({
      campaignId: z.number().optional(),
      timezone: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const analytics = await db.getCampaignSendTimeAnalytics(input.campaignId, input.timezone);
      
      return analytics.map((a: any) => ({
        ...a,
        openRate: a.openRate / 100,
        clickRate: a.clickRate / 100,
        conversionRate: a.conversionRate / 100,
      }));
    }),
});
