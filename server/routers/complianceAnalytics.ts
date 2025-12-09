import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { complianceAnalyticsService } from '../services/complianceAnalyticsService';

export const complianceAnalyticsRouter = router({
  /**
   * Get historical compliance trends
   */
  getComplianceTrends: protectedProcedure
    .input(
      z.object({
        employerId: z.number(),
        months: z.number().min(1).max(24).default(12),
      })
    )
    .query(async ({ input }) => {
      const trends = await complianceAnalyticsService.getComplianceTrends(
        input.employerId,
        input.months
      );
      return trends;
    }),

  /**
   * Get current compliance metrics
   */
  getCurrentMetrics: protectedProcedure
    .input(
      z.object({
        employerId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const metrics = await complianceAnalyticsService.getCurrentMetrics(input.employerId);
      return metrics;
    }),

  /**
   * Generate predictive alerts
   */
  getPredictiveAlerts: protectedProcedure
    .input(
      z.object({
        employerId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const alerts = await complianceAnalyticsService.generatePredictiveAlerts(input.employerId);
      return alerts;
    }),

  /**
   * Get comprehensive compliance dashboard data
   */
  getDashboardData: protectedProcedure
    .input(
      z.object({
        employerId: z.number(),
        trendsMonths: z.number().min(1).max(24).default(12),
      })
    )
    .query(async ({ input }) => {
      const [metrics, trends, alerts] = await Promise.all([
        complianceAnalyticsService.getCurrentMetrics(input.employerId),
        complianceAnalyticsService.getComplianceTrends(input.employerId, input.trendsMonths),
        complianceAnalyticsService.generatePredictiveAlerts(input.employerId),
      ]);

      return {
        metrics,
        trends,
        alerts,
        summary: {
          totalAlerts: alerts.length,
          criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
          highAlerts: alerts.filter(a => a.severity === 'high').length,
          averageConfidence: alerts.length > 0
            ? alerts.reduce((sum, a) => sum + a.confidence, 0) / alerts.length
            : 0,
        },
      };
    }),

  /**
   * Get compliance score breakdown
   */
  getScoreBreakdown: protectedProcedure
    .input(
      z.object({
        employerId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const metrics = await complianceAnalyticsService.getCurrentMetrics(input.employerId);

      // Calculate component scores
      const nitaqatScore = {
        platinum: 100,
        green: 80,
        yellow: 60,
        red: 40,
      }[metrics.nitaqatBand] || 40;

      const saudizationScore = Math.min(
        100,
        (metrics.currentSaudizationRate / metrics.targetSaudizationRate) * 100
      );

      const permitScore = Math.max(
        0,
        100 - (metrics.expiringIn30Days * 5)
      );

      return {
        overall: metrics.currentScore,
        components: {
          nitaqat: {
            score: nitaqatScore,
            weight: 40,
            contribution: nitaqatScore * 0.4,
            status: metrics.nitaqatBand,
          },
          saudization: {
            score: saudizationScore,
            weight: 35,
            contribution: saudizationScore * 0.35,
            current: metrics.currentSaudizationRate,
            target: metrics.targetSaudizationRate,
            gap: metrics.saudizationGap,
          },
          permits: {
            score: permitScore,
            weight: 25,
            contribution: permitScore * 0.25,
            expiring30: metrics.expiringIn30Days,
            expiring60: metrics.expiringIn60Days,
            expiring90: metrics.expiringIn90Days,
          },
        },
        trend: metrics.trend,
        riskLevel: metrics.riskLevel,
      };
    }),

  /**
   * Get alert statistics
   */
  getAlertStatistics: protectedProcedure
    .input(
      z.object({
        employerId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const alerts = await complianceAnalyticsService.generatePredictiveAlerts(input.employerId);

      const bySeverity = {
        critical: alerts.filter(a => a.severity === 'critical').length,
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        low: alerts.filter(a => a.severity === 'low').length,
      };

      const byType = {
        permit_expiry: alerts.filter(a => a.type === 'permit_expiry').length,
        saudization_decline: alerts.filter(a => a.type === 'saudization_decline').length,
        nitaqat_downgrade: alerts.filter(a => a.type === 'nitaqat_downgrade').length,
        mass_expiry: alerts.filter(a => a.type === 'mass_expiry').length,
      };

      const avgConfidence = alerts.length > 0
        ? alerts.reduce((sum, a) => sum + a.confidence, 0) / alerts.length
        : 0;

      const avgImpact = alerts.length > 0
        ? alerts.reduce((sum, a) => sum + a.impactScore, 0) / alerts.length
        : 0;

      return {
        total: alerts.length,
        bySeverity,
        byType,
        avgConfidence,
        avgImpact,
        nextAlert: alerts[0] || null,
      };
    }),

  /**
   * Get compliance forecast for next N months
   */
  getForecast: protectedProcedure
    .input(
      z.object({
        employerId: z.number(),
        months: z.number().min(1).max(12).default(6),
      })
    )
    .query(async ({ input }) => {
      const alerts = await complianceAnalyticsService.generatePredictiveAlerts(input.employerId);
      const metrics = await complianceAnalyticsService.getCurrentMetrics(input.employerId);

      // Group alerts by month
      const monthlyForecast: Record<string, {
        month: string;
        alerts: number;
        criticalEvents: number;
        estimatedScore: number;
        riskLevel: string;
      }> = {};

      const now = new Date();
      for (let i = 0; i < input.months; i++) {
        const forecastDate = new Date(now);
        forecastDate.setMonth(now.getMonth() + i);
        const monthKey = forecastDate.toISOString().substring(0, 7);

        const monthAlerts = alerts.filter(a => {
          const alertMonth = new Date(a.predictedDate).toISOString().substring(0, 7);
          return alertMonth === monthKey;
        });

        const criticalEvents = monthAlerts.filter(a => a.severity === 'critical' || a.severity === 'high').length;
        
        // Estimate score degradation based on alerts
        const scorePenalty = monthAlerts.reduce((sum, a) => {
          return sum + (a.impactScore * (a.severity === 'critical' ? 0.5 : 0.3));
        }, 0);

        const estimatedScore = Math.max(0, metrics.currentScore - scorePenalty);

        monthlyForecast[monthKey] = {
          month: monthKey,
          alerts: monthAlerts.length,
          criticalEvents,
          estimatedScore,
          riskLevel: estimatedScore < 50 ? 'critical' : estimatedScore < 70 ? 'high' : estimatedScore < 85 ? 'medium' : 'low',
        };
      }

      return Object.values(monthlyForecast);
    }),
});
