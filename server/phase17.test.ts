import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';
import { WhatsAppService } from './services/whatsappService';

type AuthenticatedUser = NonNullable<TrpcContext['user']>;

function createTestContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: 'test-user',
    email: 'test@example.com',
    name: 'Test User',
    loginMethod: 'manus',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: 'https',
      headers: {},
    } as TrpcContext['req'],
    res: {} as TrpcContext['res'],
  };
}

describe('Phase 17 Features - Calendar, WhatsApp & Compliance Analytics', () => {
  describe('Calendar Reminders Router', () => {
    it('should get pending reminders for permits expiring soon', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.calendarReminders.getPendingReminders({
        daysAhead: 90,
      });

      expect(Array.isArray(result)).toBe(true);
      // Result can be empty if no permits exist, which is fine for test
    });

    it('should get permits with calendar status', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.calendarReminders.getPermitsWithCalendarStatus();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('WhatsApp Notifications Router', () => {
    it('should validate and format phone numbers correctly', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.whatsappNotifications.formatPhoneNumber({
        phone: '0501234567',
        country: 'SA',
      });

      expect(result.formatted).toBe('+966501234567');
      expect(result.isValid).toBe(true);
    });

    it('should validate E.164 phone numbers', () => {
      expect(WhatsAppService.validatePhoneNumber('+966501234567')).toBe(true);
      expect(WhatsAppService.validatePhoneNumber('+14155551234')).toBe(true);
      expect(WhatsAppService.validatePhoneNumber('0501234567')).toBe(false);
      expect(WhatsAppService.validatePhoneNumber('invalid')).toBe(false);
    });

    it('should format Saudi phone numbers to E.164', () => {
      expect(WhatsAppService.formatSaudiNumber('0501234567')).toBe('+966501234567');
      expect(WhatsAppService.formatSaudiNumber('966501234567')).toBe('+966501234567');
      expect(WhatsAppService.formatSaudiNumber('501234567')).toBe('+966501234567');
    });

    it('should get notification settings', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.whatsappNotifications.getNotificationSettings();

      expect(result).toHaveProperty('enabled');
      expect(result).toHaveProperty('notifyOnPermitExpiry');
      expect(result).toHaveProperty('notifyOnComplianceViolation');
      expect(result).toHaveProperty('notifyOnSaudizationAlert');
    });

    it('should update notification settings', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.whatsappNotifications.updateNotificationSettings({
        phoneNumber: '+966501234567',
        notifyOnPermitExpiry: true,
        dailySummaryEnabled: true,
      });

      expect(result.success).toBe(true);
      expect(result.settings).toHaveProperty('phoneNumber');
    });
  });

  describe('Compliance Analytics Router', () => {
    it('should get current compliance metrics', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.complianceAnalyticsNew.getCurrentMetrics({
        employerId: 1,
      });

      expect(result).toHaveProperty('currentScore');
      expect(result).toHaveProperty('trend');
      expect(result).toHaveProperty('activePermits');
      expect(result).toHaveProperty('expiringIn30Days');
      expect(result).toHaveProperty('expiringIn60Days');
      expect(result).toHaveProperty('expiringIn90Days');
      expect(result).toHaveProperty('currentSaudizationRate');
      expect(result).toHaveProperty('targetSaudizationRate');
      expect(result).toHaveProperty('nitaqatBand');
      expect(result).toHaveProperty('riskLevel');

      expect(['improving', 'stable', 'declining']).toContain(result.trend);
      expect(['low', 'medium', 'high', 'critical']).toContain(result.riskLevel);
      expect(['platinum', 'green', 'yellow', 'red']).toContain(result.nitaqatBand);
    });

    it('should get compliance trends for specified months', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.complianceAnalyticsNew.getComplianceTrends({
        employerId: 1,
        months: 6,
      });

      expect(Array.isArray(result)).toBe(true);
      
      if (result.length > 0) {
        const trend = result[0];
        expect(trend).toHaveProperty('date');
        expect(trend).toHaveProperty('expiringPermits');
        expect(trend).toHaveProperty('saudizationPercentage');
        expect(trend).toHaveProperty('nitaqatBand');
        expect(trend).toHaveProperty('complianceScore');
      }
    });

    it('should generate predictive alerts', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.complianceAnalyticsNew.getPredictiveAlerts({
        employerId: 1,
      });

      expect(Array.isArray(result)).toBe(true);

      if (result.length > 0) {
        const alert = result[0];
        expect(alert).toHaveProperty('type');
        expect(alert).toHaveProperty('severity');
        expect(alert).toHaveProperty('predictedDate');
        expect(alert).toHaveProperty('confidence');
        expect(alert).toHaveProperty('description');
        expect(alert).toHaveProperty('recommendedAction');
        expect(alert).toHaveProperty('impactScore');

        expect(['permit_expiry', 'saudization_decline', 'nitaqat_downgrade', 'mass_expiry']).toContain(alert.type);
        expect(['low', 'medium', 'high', 'critical']).toContain(alert.severity);
        expect(alert.confidence).toBeGreaterThanOrEqual(0);
        expect(alert.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('should get comprehensive dashboard data', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.complianceAnalyticsNew.getDashboardData({
        employerId: 1,
        trendsMonths: 12,
      });

      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('trends');
      expect(result).toHaveProperty('alerts');
      expect(result).toHaveProperty('summary');

      expect(result.summary).toHaveProperty('totalAlerts');
      expect(result.summary).toHaveProperty('criticalAlerts');
      expect(result.summary).toHaveProperty('highAlerts');
      expect(result.summary).toHaveProperty('averageConfidence');

      expect(Array.isArray(result.trends)).toBe(true);
      expect(Array.isArray(result.alerts)).toBe(true);
    });

    it('should get compliance score breakdown', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.complianceAnalyticsNew.getScoreBreakdown({
        employerId: 1,
      });

      expect(result).toHaveProperty('overall');
      expect(result).toHaveProperty('components');
      expect(result).toHaveProperty('trend');
      expect(result).toHaveProperty('riskLevel');

      expect(result.components).toHaveProperty('nitaqat');
      expect(result.components).toHaveProperty('saudization');
      expect(result.components).toHaveProperty('permits');

      expect(result.components.nitaqat).toHaveProperty('score');
      expect(result.components.nitaqat).toHaveProperty('weight');
      expect(result.components.nitaqat).toHaveProperty('contribution');

      expect(result.overall).toBeGreaterThanOrEqual(0);
      expect(result.overall).toBeLessThanOrEqual(100);
    });

    it('should get alert statistics', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.complianceAnalyticsNew.getAlertStatistics({
        employerId: 1,
      });

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('bySeverity');
      expect(result).toHaveProperty('byType');
      expect(result).toHaveProperty('avgConfidence');
      expect(result).toHaveProperty('avgImpact');

      expect(result.bySeverity).toHaveProperty('critical');
      expect(result.bySeverity).toHaveProperty('high');
      expect(result.bySeverity).toHaveProperty('medium');
      expect(result.bySeverity).toHaveProperty('low');

      expect(result.byType).toHaveProperty('permit_expiry');
      expect(result.byType).toHaveProperty('saudization_decline');
      expect(result.byType).toHaveProperty('nitaqat_downgrade');
      expect(result.byType).toHaveProperty('mass_expiry');
    });

    it('should get compliance forecast', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.complianceAnalyticsNew.getForecast({
        employerId: 1,
        months: 6,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(6);

      if (result.length > 0) {
        const forecast = result[0];
        expect(forecast).toHaveProperty('month');
        expect(forecast).toHaveProperty('alerts');
        expect(forecast).toHaveProperty('criticalEvents');
        expect(forecast).toHaveProperty('estimatedScore');
        expect(forecast).toHaveProperty('riskLevel');

        expect(['low', 'medium', 'high', 'critical']).toContain(forecast.riskLevel);
      }
    });
  });

  describe('Integration Tests', () => {
    it('should have all three routers registered in appRouter', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      // Test that we can call procedures from each router
      await expect(
        caller.calendarReminders.getPendingReminders({ daysAhead: 30 })
      ).resolves.toBeDefined();

      await expect(
        caller.whatsappNotifications.getNotificationSettings()
      ).resolves.toBeDefined();

      await expect(
        caller.complianceAnalyticsNew.getCurrentMetrics({ employerId: 1 })
      ).resolves.toBeDefined();
    });

    it('should handle database unavailability gracefully', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      // These should not throw even if database is empty
      await expect(
        caller.complianceAnalyticsNew.getCurrentMetrics({ employerId: 999999 })
      ).resolves.toBeDefined();

      await expect(
        caller.complianceAnalyticsNew.getPredictiveAlerts({ employerId: 999999 })
      ).resolves.toBeDefined();

      await expect(
        caller.calendarReminders.getPendingReminders({ daysAhead: 30 })
      ).resolves.toBeDefined();
    });
  });
});
