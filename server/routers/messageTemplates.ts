import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import * as dbTemplates from "../dbMessageTemplates";

export const messageTemplatesRouter = router({
  // ============================================================================
  // CRUD Operations
  // ============================================================================

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        category: z.enum([
          "interview_invitation",
          "status_update",
          "follow_up",
          "rejection",
          "offer",
          "reminder",
          "general",
        ]),
        channelType: z.enum(["email", "sms", "both"]),
        emailSubject: z.string().max(500).optional(),
        emailBody: z.string().optional(),
        emailHtml: z.string().optional(),
        smsBody: z.string().optional(),
        variables: z.array(z.string()).optional(),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await dbTemplates.createMessageTemplate({
        userId: ctx.user.id,
        ...input,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        category: z
          .enum([
            "interview_invitation",
            "status_update",
            "follow_up",
            "rejection",
            "offer",
            "reminder",
            "general",
          ])
          .optional(),
        channelType: z.enum(["email", "sms", "both"]).optional(),
        emailSubject: z.string().max(500).optional(),
        emailBody: z.string().optional(),
        emailHtml: z.string().optional(),
        smsBody: z.string().optional(),
        variables: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await dbTemplates.updateMessageTemplate(id, ctx.user.id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await dbTemplates.deleteMessageTemplate(input.id, ctx.user.id);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await dbTemplates.getMessageTemplateById(input.id);
    }),

  list: protectedProcedure
    .input(
      z
        .object({
          category: z.string().optional(),
          channelType: z.enum(["email", "sms", "both"]).optional(),
          isActive: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return await dbTemplates.getUserMessageTemplates(ctx.user.id, input);
    }),

  getDefaults: protectedProcedure
    .input(
      z
        .object({
          channelType: z.enum(["email", "sms", "both"]).optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return await dbTemplates.getDefaultTemplates(input?.channelType);
    }),

  // ============================================================================
  // Usage Tracking
  // ============================================================================

  logUsage: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        channel: z.enum(["email", "sms"]),
        recipientCount: z.number(),
        bulkActionId: z.number().optional(),
        campaignId: z.number().optional(),
        successCount: z.number(),
        failureCount: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await dbTemplates.logTemplateUsage({
        userId: ctx.user.id,
        ...input,
      });
    }),

  getUsageStats: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ input }) => {
      return await dbTemplates.getTemplateUsageStats(input.templateId);
    }),

  getUsageHistory: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().default(50),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return await dbTemplates.getUserTemplateUsageHistory(ctx.user.id, input?.limit);
    }),

  // ============================================================================
  // Template Preview with Variable Replacement
  // ============================================================================

  preview: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        variables: z.record(z.string(), z.union([z.string(), z.number()])),
      })
    )
    .query(async ({ input }) => {
      const template = await dbTemplates.getMessageTemplateById(input.templateId);
      if (!template) {
        throw new Error("Template not found");
      }

      return {
        emailSubject: template.emailSubject
          ? dbTemplates.replaceTemplateVariables(template.emailSubject, input.variables)
          : null,
        emailBody: template.emailBody
          ? dbTemplates.replaceTemplateVariables(template.emailBody, input.variables)
          : null,
        emailHtml: template.emailHtml
          ? dbTemplates.replaceTemplateVariables(template.emailHtml, input.variables)
          : null,
        smsBody: template.smsBody
          ? dbTemplates.replaceTemplateVariables(template.smsBody, input.variables)
          : null,
      };
    }),

  // ============================================================================
  // Bulk Messaging with Templates
  // ============================================================================

  sendBulkMessage: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        candidateIds: z.array(z.number()),
        channel: z.enum(["email", "sms"]),
        customVariables: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const template = await dbTemplates.getMessageTemplateById(input.templateId);
      if (!template) {
        throw new Error("Template not found");
      }

      // Get candidate details
      const db = await import("../db").then(m => m.getDb());
      if (!db) throw new Error("Database unavailable");

      const { candidates } = await import("../../drizzle/schema");
      const { inArray } = await import("drizzle-orm");
      
      const candidateList = await db
        .select()
        .from(candidates)
        .where(inArray(candidates.id, input.candidateIds));

      let successCount = 0;
      let failureCount = 0;
      const errors: string[] = [];

      // Send messages to each candidate
      for (const candidate of candidateList) {
        try {
          const variables = {
            candidateName: candidate.name || "",
            candidateEmail: candidate.email || "",
            ...input.customVariables,
          };

          if (input.channel === "email" && template.emailSubject && template.emailBody) {
            const subject = dbTemplates.replaceTemplateVariables(template.emailSubject, variables);
            const body = template.emailHtml
              ? dbTemplates.replaceTemplateVariables(template.emailHtml, variables)
              : dbTemplates.replaceTemplateVariables(template.emailBody!, variables);

            // Send email using Gmail MCP
            await import("../gmailMcpService").then(m =>
              m.sendEmail({
                to: candidate.email!,
                subject,
                html: body,
              })
            );
            successCount++;
          } else if (input.channel === "sms" && template.smsBody) {
            const smsBody = dbTemplates.replaceTemplateVariables(template.smsBody, variables);

            // Send SMS using Twilio
            await import("../smsService").then(m =>
              m.sendSMS({
                to: candidate.phone!,
                body: smsBody,
              })
            );
            successCount++;
          }
        } catch (error: any) {
          failureCount++;
          errors.push(`${candidate.name}: ${error.message}`);
        }
      }

      // Log template usage
      await dbTemplates.logTemplateUsage({
        userId: ctx.user.id,
        templateId: input.templateId,
        channel: input.channel,
        recipientCount: input.candidateIds.length,
        successCount,
        failureCount,
      });

      return {
        success: true,
        totalSent: input.candidateIds.length,
        successCount,
        failureCount,
        errors: errors.length > 0 ? errors : undefined,
      };
    }),
});
