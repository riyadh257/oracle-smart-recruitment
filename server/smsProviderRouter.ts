import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { smsProviderConfigs } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { sendSms, sendBulkSms, validatePhoneNumber } from "./smsProvider";

export const smsProviderRouter = router({
  // Get provider configuration
  getConfig: protectedProcedure
    .input(z.object({ employerId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      return await db
        .select()
        .from(smsProviderConfigs)
        .where(eq(smsProviderConfigs.employerId, input.employerId));
    }),

  // Create provider configuration
  createConfig: protectedProcedure
    .input(
      z.object({
        employerId: z.number(),
        provider: z.enum(["twilio", "aws_sns"]),
        isActive: z.boolean().optional(),
        twilioAccountSid: z.string().optional(),
        twilioAuthToken: z.string().optional(),
        twilioPhoneNumber: z.string().optional(),
        awsAccessKeyId: z.string().optional(),
        awsSecretAccessKey: z.string().optional(),
        awsRegion: z.string().optional(),
        awsSnsTopicArn: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // If setting as active, deactivate other providers for this employer
      if (input.isActive) {
        await db
          .update(smsProviderConfigs)
          .set({ isActive: false })
          .where(eq(smsProviderConfigs.employerId, input.employerId));
      }

      const [result] = await db.insert(smsProviderConfigs).values(input);
      return { id: result.insertId };
    }),

  // Update provider configuration
  updateConfig: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        employerId: z.number(),
        isActive: z.boolean().optional(),
        twilioAccountSid: z.string().optional(),
        twilioAuthToken: z.string().optional(),
        twilioPhoneNumber: z.string().optional(),
        awsAccessKeyId: z.string().optional(),
        awsSecretAccessKey: z.string().optional(),
        awsRegion: z.string().optional(),
        awsSnsTopicArn: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const { id, employerId, ...updates } = input;

      // If setting as active, deactivate other providers for this employer
      if (updates.isActive) {
        await db
          .update(smsProviderConfigs)
          .set({ isActive: false })
          .where(eq(smsProviderConfigs.employerId, employerId));
      }

      await db
        .update(smsProviderConfigs)
        .set(updates)
        .where(and(eq(smsProviderConfigs.id, id), eq(smsProviderConfigs.employerId, employerId)));

      return { success: true };
    }),

  // Delete provider configuration
  deleteConfig: protectedProcedure
    .input(z.object({ id: z.number(), employerId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db
        .delete(smsProviderConfigs)
        .where(
          and(eq(smsProviderConfigs.id, input.id), eq(smsProviderConfigs.employerId, input.employerId))
        );

      return { success: true };
    }),

  // Send single SMS
  sendSms: protectedProcedure
    .input(
      z.object({
        employerId: z.number(),
        to: z.string(),
        message: z.string(),
        provider: z.enum(["twilio", "aws_sns"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      if (!validatePhoneNumber(input.to)) {
        throw new Error("Invalid phone number format. Use E.164 format (e.g., +14155552671)");
      }

      return await sendSms(input);
    }),

  // Send bulk SMS
  sendBulkSms: protectedProcedure
    .input(
      z.object({
        employerId: z.number(),
        recipients: z.array(z.string()),
        message: z.string(),
        provider: z.enum(["twilio", "aws_sns"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Validate all phone numbers
      const invalidNumbers = input.recipients.filter((num) => !validatePhoneNumber(num));
      if (invalidNumbers.length > 0) {
        throw new Error(
          `Invalid phone numbers: ${invalidNumbers.join(", ")}. Use E.164 format (e.g., +14155552671)`
        );
      }

      return await sendBulkSms(input);
    }),

  // Get provider statistics
  getStats: protectedProcedure
    .input(z.object({ employerId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const configs = await db
        .select()
        .from(smsProviderConfigs)
        .where(eq(smsProviderConfigs.employerId, input.employerId));

      const totalStats = configs.reduce(
        (acc, config) => ({
          totalSent: acc.totalSent + config.messagesSent,
          totalDelivered: acc.totalDelivered + config.messagesDelivered,
          totalFailed: acc.totalFailed + config.messagesFailed,
        }),
        { totalSent: 0, totalDelivered: 0, totalFailed: 0 }
      );

      const deliveryRate =
        totalStats.totalSent > 0
          ? ((totalStats.totalDelivered / totalStats.totalSent) * 100).toFixed(2)
          : "0.00";

      return {
        ...totalStats,
        deliveryRate: parseFloat(deliveryRate),
        providers: configs.map((c) => ({
          provider: c.provider,
          isActive: c.isActive,
          messagesSent: c.messagesSent,
          messagesDelivered: c.messagesDelivered,
          messagesFailed: c.messagesFailed,
          lastUsedAt: c.lastUsedAt,
        })),
      };
    }),
});
