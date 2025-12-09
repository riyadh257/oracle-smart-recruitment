import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { emailTemplateCategories, emailTemplateLibrary } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const templateLibraryRouter = router({
  // Get all categories
  getCategories: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    
    return await db.select().from(emailTemplateCategories).orderBy(emailTemplateCategories.displayOrder);
  }),

  // Create category
  createCategory: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      displayOrder: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [result] = await db.insert(emailTemplateCategories).values([input]);
      return { id: result.insertId };
    }),

  // Get templates by category
  getTemplatesByCategory: protectedProcedure
    .input(z.object({
      categoryId: z.number().optional(),
      employerId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      let query = db.select().from(emailTemplateLibrary);

      if (input.categoryId) {
        query = query.where(eq(emailTemplateLibrary.categoryId, input.categoryId)) as any;
      }

      if (input.employerId) {
        query = query.where(
          and(
            eq(emailTemplateLibrary.employerId, input.employerId),
            eq(emailTemplateLibrary.isPublic, 0)
          )
        ) as any;
      } else {
        query = query.where(eq(emailTemplateLibrary.isPublic, 1)) as any;
      }

      return await (query as any).orderBy(desc(emailTemplateLibrary.usageCount));
    }),

  // Get template by ID
  getTemplate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const templates = await db
        .select()
        .from(emailTemplateLibrary)
        .where(eq(emailTemplateLibrary.id, input.id))
        .limit(1);

      return templates[0] || null;
    }),

  // Create template
  createTemplate: protectedProcedure
    .input(z.object({
      employerId: z.number().optional(),
      categoryId: z.number().optional(),
      name: z.string(),
      description: z.string().optional(),
      subject: z.string(),
      bodyHtml: z.string(),
      bodyText: z.string().optional(),
      thumbnailUrl: z.string().optional(),
      isPublic: z.boolean().optional(),
      variables: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const insertData = {
        ...input,
        isPublic: input.isPublic !== undefined ? (input.isPublic ? 1 : 0) : undefined,
      };
      const [result] = await db.insert(emailTemplateLibrary).values([insertData as any]);
      return { id: result.insertId };
    }),

  // Update template
  updateTemplate: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      subject: z.string().optional(),
      bodyHtml: z.string().optional(),
      bodyText: z.string().optional(),
      thumbnailUrl: z.string().optional(),
      categoryId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const { id, ...updates } = input;
      await db.update(emailTemplateLibrary).set(updates).where(eq(emailTemplateLibrary.id, id));

      return { success: true };
    }),

  // Delete template
  deleteTemplate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.delete(emailTemplateLibrary).where(eq(emailTemplateLibrary.id, input.id));
      return { success: true };
    }),

  // Increment usage count
  incrementUsage: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const template = await db
        .select()
        .from(emailTemplateLibrary)
        .where(eq(emailTemplateLibrary.id, input.id))
        .limit(1);

      if (template[0]) {
        await db
          .update(emailTemplateLibrary)
          .set({
            usageCount: (template[0].usageCount || 0) + 1,
            lastUsedAt: new Date().toISOString(),
          })
          .where(eq(emailTemplateLibrary.id, input.id));
      }

      return { success: true };
    }),

  // Substitute variables in template
  substituteVariables: protectedProcedure
    .input(z.object({
      templateId: z.number(),
      variables: z.record(z.string(), z.string()),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const templates = await db
        .select()
        .from(emailTemplateLibrary)
        .where(eq(emailTemplateLibrary.id, input.templateId))
        .limit(1);

      if (!templates[0]) {
        throw new Error("Template not found");
      }

      const template = templates[0];
      let subject = template.subject;
      let bodyHtml = template.bodyHtml;
      let bodyText = template.bodyText || "";

      // Replace variables in format {{variableName}}
      for (const [key, value] of Object.entries(input.variables)) {
        const regex = new RegExp(`{{${key}}}`, "g");
        const stringValue = String(value ?? "");
        subject = subject.replace(regex, stringValue);
        bodyHtml = bodyHtml.replace(regex, stringValue);
        bodyText = bodyText.replace(regex, stringValue);
      }

      return {
        subject,
        bodyHtml,
        bodyText,
      };
    }),
});
