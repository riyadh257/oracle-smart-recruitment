import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { reportEmailTemplates, templatePreviewHistory } from "../drizzle/schema";

// Content block types for dynamic email sections
const contentBlockSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'image', 'button', 'divider', 'data_table', 'chart', 'merge_tag']),
  config: z.record(z.any()),
  position: z.number(),
});

// Merge tag schema for dynamic content
const mergeTagSchema = z.object({
  tag: z.string(), // e.g., {{candidateName}}, {{reportDate}}
  description: z.string(),
  sampleValue: z.string(),
});

export const reportEmailTemplatesRouter = router({
  // List all templates for the current user
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const templates = await db
      .select()
      .from(reportEmailTemplates)
      .where(eq(reportEmailTemplates.userId, ctx.user.id))
      .orderBy(desc(reportEmailTemplates.updatedAt));

    return templates;
  }),

  // Get a single template by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [template] = await db
        .select()
        .from(reportEmailTemplates)
        .where(
          and(
            eq(reportEmailTemplates.id, input.id),
            eq(reportEmailTemplates.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!template) {
        throw new Error("Template not found");
      }

      return template;
    }),

  // Create a new template
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        logoUrl: z.string().url().optional(),
        primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#1e40af'),
        secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3b82f6'),
        fontFamily: z.string().default('Arial, sans-serif'),
        headerHtml: z.string().optional(),
        footerHtml: z.string().optional(),
        subjectTemplate: z.string().min(1).max(500),
        bodyHtml: z.string().min(1),
        bodyText: z.string().optional(),
        contentBlocks: z.array(contentBlockSchema).optional(),
        availableMergeTags: z.array(mergeTagSchema).optional(),
        isDefault: z.boolean().default(false),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // If this is set as default, unset other defaults
      if (input.isDefault) {
        await db
          .update(reportEmailTemplates)
          .set({ isDefault: 0 })
          .where(eq(reportEmailTemplates.userId, ctx.user.id));
      }

      const [result] = await db.insert(reportEmailTemplates).values({
        userId: ctx.user.id,
        name: input.name,
        description: input.description || null,
        logoUrl: input.logoUrl || null,
        primaryColor: input.primaryColor,
        secondaryColor: input.secondaryColor,
        fontFamily: input.fontFamily,
        headerHtml: input.headerHtml || null,
        footerHtml: input.footerHtml || null,
        subjectTemplate: input.subjectTemplate,
        bodyHtml: input.bodyHtml,
        bodyText: input.bodyText || null,
        contentBlocks: input.contentBlocks ? JSON.stringify(input.contentBlocks) : null,
        availableMergeTags: input.availableMergeTags ? JSON.stringify(input.availableMergeTags) : null,
        isDefault: input.isDefault ? 1 : 0,
        isActive: input.isActive ? 1 : 0,
      });

      return { id: Number(result.insertId), success: true };
    }),

  // Update an existing template
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        logoUrl: z.string().url().optional(),
        primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        fontFamily: z.string().optional(),
        headerHtml: z.string().optional(),
        footerHtml: z.string().optional(),
        subjectTemplate: z.string().min(1).max(500).optional(),
        bodyHtml: z.string().min(1).optional(),
        bodyText: z.string().optional(),
        contentBlocks: z.array(contentBlockSchema).optional(),
        availableMergeTags: z.array(mergeTagSchema).optional(),
        isDefault: z.boolean().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updateData } = input;

      // Verify ownership
      const [existing] = await db
        .select()
        .from(reportEmailTemplates)
        .where(
          and(
            eq(reportEmailTemplates.id, id),
            eq(reportEmailTemplates.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!existing) {
        throw new Error("Template not found");
      }

      // If this is set as default, unset other defaults
      if (updateData.isDefault) {
        await db
          .update(reportEmailTemplates)
          .set({ isDefault: 0 })
          .where(eq(reportEmailTemplates.userId, ctx.user.id));
      }

      // Build update object
      const updates: Record<string, any> = {};
      if (updateData.name !== undefined) updates.name = updateData.name;
      if (updateData.description !== undefined) updates.description = updateData.description || null;
      if (updateData.logoUrl !== undefined) updates.logoUrl = updateData.logoUrl || null;
      if (updateData.primaryColor !== undefined) updates.primaryColor = updateData.primaryColor;
      if (updateData.secondaryColor !== undefined) updates.secondaryColor = updateData.secondaryColor;
      if (updateData.fontFamily !== undefined) updates.fontFamily = updateData.fontFamily;
      if (updateData.headerHtml !== undefined) updates.headerHtml = updateData.headerHtml || null;
      if (updateData.footerHtml !== undefined) updates.footerHtml = updateData.footerHtml || null;
      if (updateData.subjectTemplate !== undefined) updates.subjectTemplate = updateData.subjectTemplate;
      if (updateData.bodyHtml !== undefined) updates.bodyHtml = updateData.bodyHtml;
      if (updateData.bodyText !== undefined) updates.bodyText = updateData.bodyText || null;
      if (updateData.contentBlocks !== undefined) {
        updates.contentBlocks = JSON.stringify(updateData.contentBlocks);
      }
      if (updateData.availableMergeTags !== undefined) {
        updates.availableMergeTags = JSON.stringify(updateData.availableMergeTags);
      }
      if (updateData.isDefault !== undefined) updates.isDefault = updateData.isDefault ? 1 : 0;
      if (updateData.isActive !== undefined) updates.isActive = updateData.isActive ? 1 : 0;

      await db
        .update(reportEmailTemplates)
        .set(updates)
        .where(eq(reportEmailTemplates.id, id));

      return { success: true };
    }),

  // Delete a template
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify ownership before deleting
      const [existing] = await db
        .select()
        .from(reportEmailTemplates)
        .where(
          and(
            eq(reportEmailTemplates.id, input.id),
            eq(reportEmailTemplates.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!existing) {
        throw new Error("Template not found");
      }

      await db
        .delete(reportEmailTemplates)
        .where(eq(reportEmailTemplates.id, input.id));

      return { success: true };
    }),

  // Generate and save a preview
  generatePreview: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        sampleData: z.record(z.any()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get the template
      const [template] = await db
        .select()
        .from(reportEmailTemplates)
        .where(
          and(
            eq(reportEmailTemplates.id, input.templateId),
            eq(reportEmailTemplates.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!template) {
        throw new Error("Template not found");
      }

      // Replace merge tags in the template
      let previewHtml = template.bodyHtml;
      const mergeTags = (template.availableMergeTags as any) || [];
      
      for (const tag of mergeTags) {
        const value = input.sampleData[tag.tag] || tag.sampleValue || '';
        previewHtml = previewHtml.replace(new RegExp(`{{${tag.tag}}}`, 'g'), value);
      }

      // Wrap with header and footer
      const fullHtml = `
        ${template.headerHtml || ''}
        ${previewHtml}
        ${template.footerHtml || ''}
      `;

      // Save preview to history
      const [result] = await db.insert(templatePreviewHistory).values({
        templateId: input.templateId,
        previewHtml: fullHtml,
        sampleData: JSON.stringify(input.sampleData),
      });

      return {
        previewId: Number(result.insertId),
        previewHtml: fullHtml,
      };
    }),

  // Get preview history for a template
  getPreviewHistory: protectedProcedure
    .input(z.object({ templateId: z.number(), limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify template ownership
      const [template] = await db
        .select()
        .from(reportEmailTemplates)
        .where(
          and(
            eq(reportEmailTemplates.id, input.templateId),
            eq(reportEmailTemplates.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!template) {
        throw new Error("Template not found");
      }

      const previews = await db
        .select()
        .from(templatePreviewHistory)
        .where(eq(templatePreviewHistory.templateId, input.templateId))
        .orderBy(desc(templatePreviewHistory.createdAt))
        .limit(input.limit);

      return previews;
    }),

  // Get default template library (predefined templates)
  getDefaultLibrary: protectedProcedure.query(async () => {
    return [
      {
        id: 'professional',
        name: 'Professional Report',
        description: 'Clean, corporate design with header and footer',
        preview: '/templates/professional-preview.png',
        template: {
          primaryColor: '#1e40af',
          secondaryColor: '#3b82f6',
          fontFamily: 'Arial, sans-serif',
          headerHtml: '<div style="background: #1e40af; color: white; padding: 20px; text-align: center;"><h1>{{companyName}}</h1></div>',
          footerHtml: '<div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">© {{year}} {{companyName}}. All rights reserved.</div>',
          subjectTemplate: 'Weekly Report - {{reportDate}}',
          bodyHtml: '<div style="padding: 30px;"><h2>Report Summary</h2><p>{{reportContent}}</p></div>',
        },
      },
      {
        id: 'minimal',
        name: 'Minimal',
        description: 'Simple, text-focused design',
        preview: '/templates/minimal-preview.png',
        template: {
          primaryColor: '#000000',
          secondaryColor: '#6b7280',
          fontFamily: 'Georgia, serif',
          headerHtml: '<div style="border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px;"><h2>{{reportTitle}}</h2></div>',
          footerHtml: '<div style="border-top: 1px solid #e5e7eb; padding-top: 10px; margin-top: 20px; font-size: 11px; color: #9ca3af;">Sent on {{reportDate}}</div>',
          subjectTemplate: '{{reportTitle}} - {{reportDate}}',
          bodyHtml: '<div style="font-family: Georgia, serif; line-height: 1.6;">{{reportContent}}</div>',
        },
      },
      {
        id: 'branded',
        name: 'Branded',
        description: 'Full branding with logo and custom colors',
        preview: '/templates/branded-preview.png',
        template: {
          primaryColor: '#7c3aed',
          secondaryColor: '#a78bfa',
          fontFamily: 'Helvetica, Arial, sans-serif',
          headerHtml: '<div style="background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%); color: white; padding: 30px; text-align: center;"><img src="{{logoUrl}}" alt="Logo" style="max-width: 150px; margin-bottom: 15px;"><h1 style="margin: 0;">{{companyName}}</h1></div>',
          footerHtml: '<div style="background: #f9fafb; padding: 20px; text-align: center;"><p style="margin: 0; font-size: 13px; color: #6b7280;">{{companyAddress}}</p><p style="margin: 5px 0 0 0; font-size: 11px; color: #9ca3af;">Unsubscribe | Privacy Policy</p></div>',
          subjectTemplate: '{{companyName}} - {{reportTitle}}',
          bodyHtml: '<div style="padding: 40px; background: white;"><h2 style="color: #7c3aed;">{{reportTitle}}</h2><div style="margin-top: 20px;">{{reportContent}}</div></div>',
        },
      },
    ];
  }),
});
