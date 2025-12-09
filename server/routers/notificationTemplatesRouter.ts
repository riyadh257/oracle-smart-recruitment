import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import {
  getAllTemplates,
  getTemplateById,
  getTemplatesByType,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getAllTemplateVariables,
  getTemplateVariablesByCategory,
  renderTemplate,
  extractVariablesFromTemplate,
} from "../notificationTemplates";

export const notificationTemplatesRouter = router({
  // Get all templates (optionally filtered by employer)
  list: protectedProcedure
    .input(
      z.object({
        employerId: z.number().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      return await getAllTemplates(input?.employerId);
    }),

  // Get template by ID
  getById: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await getTemplateById(input.id);
    }),

  // Get templates by type
  getByType: protectedProcedure
    .input(
      z.object({
        type: z.enum([
          'interview_reminder',
          'feedback_request',
          'candidate_response',
          'engagement_alert',
          'ab_test_result',
          'system_update',
          'general',
          'custom',
        ]),
        employerId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return await getTemplatesByType(input.type, input.employerId);
    }),

  // Create new template
  create: protectedProcedure
    .input(
      z.object({
        employerId: z.number().optional(),
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        type: z.enum([
          'interview_reminder',
          'feedback_request',
          'candidate_response',
          'engagement_alert',
          'ab_test_result',
          'system_update',
          'general',
          'custom',
        ]),
        channel: z.enum(['push', 'email', 'sms', 'push_email']),
        subject: z.string().max(500).optional(),
        bodyTemplate: z.string().min(1),
        variables: z.array(z.string()).optional(),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await createTemplate({
        ...input,
        createdBy: ctx.user.id,
      });
    }),

  // Update template
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        subject: z.string().max(500).optional(),
        bodyTemplate: z.string().min(1).optional(),
        variables: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      return await updateTemplate(id, updates);
    }),

  // Delete template (soft delete)
  delete: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      await deleteTemplate(input.id);
      return { success: true };
    }),

  // Get all available template variables
  getVariables: protectedProcedure.query(async () => {
    return await getAllTemplateVariables();
  }),

  // Get template variables by category
  getVariablesByCategory: protectedProcedure
    .input(
      z.object({
        category: z.enum(['candidate', 'interview', 'job', 'company', 'system']),
      })
    )
    .query(async ({ input }) => {
      return await getTemplateVariablesByCategory(input.category);
    }),

  // Preview template with sample data
  preview: protectedProcedure
    .input(
      z.object({
        template: z.string(),
        variables: z.record(z.any()),
      })
    )
    .mutation(({ input }) => {
      return {
        rendered: renderTemplate(input.template, input.variables),
      };
    }),

  // Extract variables from template
  extractVariables: protectedProcedure
    .input(
      z.object({
        template: z.string(),
      })
    )
    .mutation(({ input }) => {
      return {
        variables: extractVariablesFromTemplate(input.template),
      };
    }),
});
