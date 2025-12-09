import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { whatsappService, WhatsAppService } from '../services/whatsappService';
import { getDb } from '../db';
import { workPermits, users } from '../../drizzle/schema';
import { and, gte, lte, eq } from 'drizzle-orm';

export const whatsappNotificationsRouter = router({
  /**
   * Send a test WhatsApp message to verify configuration
   */
  sendTestMessage: protectedProcedure
    .input(
      z.object({
        to: z.string().refine(WhatsAppService.validatePhoneNumber, {
          message: 'Invalid phone number format. Use E.164 format (e.g., +966501234567)',
        }),
        message: z.string().min(1).max(1600),
      })
    )
    .mutation(async ({ input }) => {
      const result = await whatsappService.sendMessage({
        to: input.to,
        body: input.message,
      });
      return result;
    }),

  /**
   * Send permit expiry alerts for all expiring permits
   */
  sendPermitExpiryAlerts: protectedProcedure
    .input(
      z.object({
        daysAhead: z.number().min(1).max(90).default(30),
        recipientPhone: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + input.daysAhead);

      const expiringPermits = await db
        .select()
        .from(workPermits)
        .where(
          and(
            gte(workPermits.expiryDate, now),
            lte(workPermits.expiryDate, futureDate),
            eq(workPermits.status, 'active')
          )
        );

      const results = [];
      for (const permit of expiringPermits) {
        const daysRemaining = Math.ceil(
          (new Date(permit.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        const result = await whatsappService.sendPermitExpiryAlert({
          to: input.recipientPhone,
          candidateName: permit.candidateName || permit.employeeName,
          permitNumber: permit.permitNumber,
          expiryDate: new Date(permit.expiryDate),
          daysRemaining,
        });

        results.push({
          permitId: permit.id,
          success: result.success,
          messageId: result.messageId,
        });

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return {
        totalPermits: expiringPermits.length,
        sent: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
      };
    }),

  /**
   * Send Saudization compliance alert
   */
  sendSaudizationAlert: protectedProcedure
    .input(
      z.object({
        to: z.string(),
        currentBand: z.enum(['platinum', 'green', 'yellow', 'red']),
        targetBand: z.enum(['platinum', 'green', 'yellow', 'red']),
        saudiHiresNeeded: z.number(),
        currentPercentage: z.number(),
        targetPercentage: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await whatsappService.sendSaudizationAlert(input);
      return result;
    }),

  /**
   * Send compliance violation alert
   */
  sendComplianceAlert: protectedProcedure
    .input(
      z.object({
        to: z.string(),
        violationType: z.string(),
        severity: z.enum(['low', 'medium', 'high', 'critical']),
        description: z.string(),
        actionRequired: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await whatsappService.sendComplianceViolationAlert(input);
      return result;
    }),

  /**
   * Send daily compliance summary
   */
  sendDailySummary: protectedProcedure
    .input(
      z.object({
        to: z.string(),
        expiringPermitsCount: z.number(),
        complianceViolations: z.number(),
        saudizationStatus: z.string(),
        actionItems: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      const result = await whatsappService.sendDailyComplianceSummary(input);
      return result;
    }),

  /**
   * Format and validate phone number
   */
  formatPhoneNumber: protectedProcedure
    .input(
      z.object({
        phone: z.string(),
        country: z.enum(['SA', 'AE', 'KW', 'QA', 'BH', 'OM']).default('SA'),
      })
    )
    .query(({ input }) => {
      let formatted = input.phone;
      
      if (input.country === 'SA') {
        formatted = WhatsAppService.formatSaudiNumber(input.phone);
      }
      
      const isValid = WhatsAppService.validatePhoneNumber(formatted);
      
      return {
        original: input.phone,
        formatted,
        isValid,
      };
    }),

  /**
   * Get WhatsApp notification settings for current user
   */
  getNotificationSettings: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }

    // In a real implementation, you'd have a whatsappSettings table
    // For now, return default settings
    return {
      enabled: true,
      phoneNumber: null, // User would configure this
      notifyOnPermitExpiry: true,
      notifyOnComplianceViolation: true,
      notifyOnSaudizationAlert: true,
      dailySummaryEnabled: false,
      dailySummaryTime: '09:00',
    };
  }),

  /**
   * Update WhatsApp notification settings
   */
  updateNotificationSettings: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string().optional(),
        notifyOnPermitExpiry: z.boolean().optional(),
        notifyOnComplianceViolation: z.boolean().optional(),
        notifyOnSaudizationAlert: z.boolean().optional(),
        dailySummaryEnabled: z.boolean().optional(),
        dailySummaryTime: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // In a real implementation, save to database
      // For now, just validate and return
      return {
        success: true,
        settings: input,
      };
    }),

  /**
   * Send bulk notifications to multiple recipients
   */
  sendBulkNotifications: protectedProcedure
    .input(
      z.object({
        recipients: z.array(z.string()).min(1).max(50),
        message: z.string().min(1).max(1600),
      })
    )
    .mutation(async ({ input }) => {
      const result = await whatsappService.sendBulkNotifications(
        input.recipients,
        (recipient) => ({
          to: recipient,
          body: input.message,
        })
      );
      return result;
    }),
});
