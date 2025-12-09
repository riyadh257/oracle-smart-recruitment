import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  smsCampaigns,
  smsCampaignRecipients,
  candidates,
} from "../drizzle/schema";
import { eq, and, inArray, desc, or, like } from "drizzle-orm";
import { sendBulkSms } from "./smsProvider";

// Segmentation types
type SegmentationRules = {
  status?: string[];
  skills?: string[];
  location?: string;
  minExperience?: number;
  maxExperience?: number;
};

export const smsCampaignBuilderRouter = router({
  // Get all campaigns
  getCampaigns: protectedProcedure
    .input(z.object({ employerId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      return await db
        .select()
        .from(smsCampaigns)
        .where(eq(smsCampaigns.employerId, input.employerId))
        .orderBy(desc(smsCampaigns.createdAt));
    }),

  // Get campaign details with recipients
  getCampaignDetails: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const campaign = await db
        .select()
        .from(smsCampaigns)
        .where(eq(smsCampaigns.id, input.campaignId))
        .limit(1);

      if (!campaign[0]) {
        throw new Error("Campaign not found");
      }

      const recipients = await db
        .select({
          recipient: smsCampaignRecipients,
          candidate: candidates,
        })
        .from(smsCampaignRecipients)
        .leftJoin(candidates, eq(candidates.id, smsCampaignRecipients.candidateId))
        .where(eq(smsCampaignRecipients.campaignId, input.campaignId));

      return {
        campaign: campaign[0],
        recipients,
      };
    }),

  // Preview campaign recipients based on segmentation
  previewRecipients: protectedProcedure
    .input(
      z.object({
        employerId: z.number(),
        segmentationRules: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const rules: SegmentationRules = JSON.parse(input.segmentationRules);

      // Build query based on segmentation rules
      let query = db.select().from(candidates);

      const conditions: any[] = [];

      if (rules.status && rules.status.length > 0) {
        conditions.push(inArray(candidates.status, rules.status as any));
      }

      if (rules.location) {
        conditions.push(like(candidates.location, `%${rules.location}%`));
      }

      if (rules.skills && rules.skills.length > 0) {
        // Assuming skills are stored as JSON or comma-separated
        const skillConditions = rules.skills.map((skill) => like(candidates.skills, `%${skill}%`));
        conditions.push(or(...skillConditions));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const recipients = await query.limit(100);

      return {
        count: recipients.length,
        preview: recipients.slice(0, 10),
      };
    }),

  // Create campaign
  createCampaign: protectedProcedure
    .input(
      z.object({
        employerId: z.number(),
        name: z.string(),
        message: z.string(),
        segmentationRules: z.string(),
        scheduledAt: z.string().optional(),
        createdBy: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Parse segmentation rules and get recipients
      const rules: SegmentationRules = JSON.parse(input.segmentationRules);
      let query = db.select().from(candidates);

      const conditions: any[] = [];

      if (rules.status && rules.status.length > 0) {
        conditions.push(inArray(candidates.status, rules.status as any));
      }

      if (rules.location) {
        conditions.push(like(candidates.location, `%${rules.location}%`));
      }

      if (rules.skills && rules.skills.length > 0) {
        const skillConditions = rules.skills.map((skill) => like(candidates.skills, `%${skill}%`));
        conditions.push(or(...skillConditions));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const recipients = await query;

      // Create campaign
      const [campaignResult] = await db.insert(smsCampaigns).values({
        employerId: input.employerId,
        name: input.name,
        message: input.message,
        segmentationRules: input.segmentationRules,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        totalRecipients: recipients.length,
        createdBy: input.createdBy,
        status: input.scheduledAt ? "scheduled" : "draft",
      });

      const campaignId = campaignResult.insertId;

      // Add recipients
      if (recipients.length > 0) {
        await db.insert(smsCampaignRecipients).values(
          recipients
            .filter((r) => r.phone)
            .map((recipient) => ({
              campaignId,
              candidateId: recipient.id,
              phoneNumber: recipient.phone!,
              status: "pending" as const,
            }))
        );
      }

      return { id: campaignId, recipientCount: recipients.length };
    }),

  // Update campaign
  updateCampaign: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        message: z.string().optional(),
        scheduledAt: z.string().optional(),
        status: z.enum(["draft", "scheduled", "sending", "completed", "cancelled"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const { id, ...updates } = input;

      const updateData: any = { ...updates };
      if (updates.scheduledAt) {
        updateData.scheduledAt = new Date(updates.scheduledAt);
      }

      await db.update(smsCampaigns).set(updateData).where(eq(smsCampaigns.id, id));

      return { success: true };
    }),

  // Send campaign immediately
  sendCampaign: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const campaign = await db
        .select()
        .from(smsCampaigns)
        .where(eq(smsCampaigns.id, input.campaignId))
        .limit(1);

      if (!campaign[0]) {
        throw new Error("Campaign not found");
      }

      if (campaign[0].status === "completed" || campaign[0].status === "sending") {
        throw new Error("Campaign already sent or in progress");
      }

      // Update status to sending
      await db
        .update(smsCampaigns)
        .set({ status: "sending" })
        .where(eq(smsCampaigns.id, input.campaignId));

      // Get recipients
      const recipients = await db
        .select()
        .from(smsCampaignRecipients)
        .where(
          and(
            eq(smsCampaignRecipients.campaignId, input.campaignId),
            eq(smsCampaignRecipients.status, "pending")
          )
        );

      // Send SMS in batches
      const batchSize = 100;
      let sentCount = 0;
      let deliveredCount = 0;
      let failedCount = 0;

      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        const phoneNumbers = batch.map((r) => r.phoneNumber);

        try {
          const result = await sendBulkSms({
            employerId: campaign[0].employerId,
            recipients: phoneNumbers,
            message: campaign[0].message,
          });

          // Update recipient statuses
          for (const recipient of batch) {
            const success = result.results?.find((r) => r.to === recipient.phoneNumber)?.success;

            await db
              .update(smsCampaignRecipients)
              .set({
                status: success ? "sent" : "failed",
                sentAt: new Date(),
                deliveredAt: success ? new Date() : null,
                errorMessage: success ? null : "Delivery failed",
              })
              .where(eq(smsCampaignRecipients.id, recipient.id));

            if (success) {
              sentCount++;
              deliveredCount++;
            } else {
              failedCount++;
            }
          }
        } catch (error) {
          console.error(`[SMS Campaign] Batch send failed:`, error);
          failedCount += batch.length;

          // Mark batch as failed
          for (const recipient of batch) {
            await db
              .update(smsCampaignRecipients)
              .set({
                status: "failed",
                errorMessage: error instanceof Error ? error.message : "Unknown error",
              })
              .where(eq(smsCampaignRecipients.id, recipient.id));
          }
        }

        // Small delay between batches to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Update campaign statistics
      await db
        .update(smsCampaigns)
        .set({
          status: "completed",
          sentCount,
          deliveredCount,
          failedCount,
          completedAt: new Date(),
        })
        .where(eq(smsCampaigns.id, input.campaignId));

      return {
        success: true,
        sentCount,
        deliveredCount,
        failedCount,
      };
    }),

  // Cancel campaign
  cancelCampaign: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db
        .update(smsCampaigns)
        .set({ status: "cancelled" })
        .where(eq(smsCampaigns.id, input.campaignId));

      return { success: true };
    }),

  // Delete campaign
  deleteCampaign: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Delete recipients first
      await db.delete(smsCampaignRecipients).where(eq(smsCampaignRecipients.campaignId, input.campaignId));

      // Delete campaign
      await db.delete(smsCampaigns).where(eq(smsCampaigns.id, input.campaignId));

      return { success: true };
    }),

  // Get campaign statistics
  getCampaignStats: protectedProcedure
    .input(z.object({ employerId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const campaigns = await db
        .select()
        .from(smsCampaigns)
        .where(eq(smsCampaigns.employerId, input.employerId));

      const totalCampaigns = campaigns.length;
      const totalSent = campaigns.reduce((sum, c) => sum + c.sentCount, 0);
      const totalDelivered = campaigns.reduce((sum, c) => sum + c.deliveredCount, 0);
      const totalFailed = campaigns.reduce((sum, c) => sum + c.failedCount, 0);

      const deliveryRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(2) : "0.00";

      return {
        totalCampaigns,
        totalSent,
        totalDelivered,
        totalFailed,
        deliveryRate: parseFloat(deliveryRate),
      };
    }),
});
