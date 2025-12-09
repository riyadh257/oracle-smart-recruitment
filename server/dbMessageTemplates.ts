import { eq, and, desc, sql } from "drizzle-orm";
import { getDb } from "./db";
import { messageTemplates, messageTemplateUsage } from "../drizzle/schema";

// ============================================================================
// MESSAGE TEMPLATES CRUD
// ============================================================================

export async function createMessageTemplate(data: {
  userId: number;
  name: string;
  description?: string;
  category: string;
  channelType: string;
  emailSubject?: string;
  emailBody?: string;
  emailHtml?: string;
  smsBody?: string;
  variables?: string[];
  isDefault?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [template] = await db.insert(messageTemplates).values({
    userId: data.userId,
    name: data.name,
    description: data.description || null,
    category: data.category as any,
    channelType: data.channelType as any,
    emailSubject: data.emailSubject || null,
    emailBody: data.emailBody || null,
    emailHtml: data.emailHtml || null,
    smsBody: data.smsBody || null,
    variables: data.variables ? JSON.stringify(data.variables) : null,
    isActive: 1,
    isDefault: data.isDefault ? 1 : 0,
    usageCount: 0,
  });

  return template;
}

export async function updateMessageTemplate(
  id: number,
  userId: number,
  data: {
    name?: string;
    description?: string;
    category?: string;
    channelType?: string;
    emailSubject?: string;
    emailBody?: string;
    emailHtml?: string;
    smsBody?: string;
    variables?: string[];
    isActive?: boolean;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.channelType !== undefined) updateData.channelType = data.channelType;
  if (data.emailSubject !== undefined) updateData.emailSubject = data.emailSubject || null;
  if (data.emailBody !== undefined) updateData.emailBody = data.emailBody || null;
  if (data.emailHtml !== undefined) updateData.emailHtml = data.emailHtml || null;
  if (data.smsBody !== undefined) updateData.smsBody = data.smsBody || null;
  if (data.variables !== undefined) updateData.variables = JSON.stringify(data.variables);
  if (data.isActive !== undefined) updateData.isActive = data.isActive ? 1 : 0;

  await db
    .update(messageTemplates)
    .set(updateData)
    .where(and(eq(messageTemplates.id, id), eq(messageTemplates.userId, userId)));

  return await getMessageTemplateById(id);
}

export async function deleteMessageTemplate(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(messageTemplates)
    .where(and(eq(messageTemplates.id, id), eq(messageTemplates.userId, userId)));

  return { success: true };
}

export async function getMessageTemplateById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [template] = await db
    .select()
    .from(messageTemplates)
    .where(eq(messageTemplates.id, id))
    .limit(1);

  if (!template) return null;

  return {
    ...template,
    variables: template.variables ? JSON.parse(template.variables as string) : [],
    isActive: Boolean(template.isActive),
    isDefault: Boolean(template.isDefault),
  };
}

export async function getUserMessageTemplates(userId: number, filters?: {
  category?: string;
  channelType?: string;
  isActive?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let query = db.select().from(messageTemplates).where(eq(messageTemplates.userId, userId));

  // Apply filters
  const conditions = [eq(messageTemplates.userId, userId)];
  if (filters?.category) {
    conditions.push(eq(messageTemplates.category, filters.category as any));
  }
  if (filters?.channelType) {
    conditions.push(eq(messageTemplates.channelType, filters.channelType as any));
  }
  if (filters?.isActive !== undefined) {
    conditions.push(eq(messageTemplates.isActive, filters.isActive ? 1 : 0));
  }

  const templates = await db
    .select()
    .from(messageTemplates)
    .where(and(...conditions))
    .orderBy(desc(messageTemplates.updatedAt));

  return templates.map((template) => ({
    ...template,
    variables: template.variables ? JSON.parse(template.variables as string) : [],
    isActive: Boolean(template.isActive),
    isDefault: Boolean(template.isDefault),
  }));
}

export async function getDefaultTemplates(channelType?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(messageTemplates.isDefault, 1), eq(messageTemplates.isActive, 1)];
  if (channelType) {
    conditions.push(eq(messageTemplates.channelType, channelType as any));
  }

  const templates = await db
    .select()
    .from(messageTemplates)
    .where(and(...conditions))
    .orderBy(messageTemplates.category);

  return templates.map((template) => ({
    ...template,
    variables: template.variables ? JSON.parse(template.variables as string) : [],
    isActive: Boolean(template.isActive),
    isDefault: Boolean(template.isDefault),
  }));
}

export async function incrementTemplateUsage(templateId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(messageTemplates)
    .set({
      usageCount: sql`${messageTemplates.usageCount} + 1`,
      lastUsedAt: new Date().toISOString(),
    })
    .where(eq(messageTemplates.id, templateId));
}

// ============================================================================
// MESSAGE TEMPLATE USAGE TRACKING
// ============================================================================

export async function logTemplateUsage(data: {
  templateId: number;
  userId: number;
  channel: string;
  recipientCount: number;
  bulkActionId?: number;
  campaignId?: number;
  successCount: number;
  failureCount: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(messageTemplateUsage).values({
    templateId: data.templateId,
    userId: data.userId,
    channel: data.channel as any,
    recipientCount: data.recipientCount,
    bulkActionId: data.bulkActionId || null,
    campaignId: data.campaignId || null,
    successCount: data.successCount,
    failureCount: data.failureCount,
  });

  // Increment usage count
  await incrementTemplateUsage(data.templateId);
}

export async function getTemplateUsageStats(templateId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const stats = await db
    .select({
      totalUsages: sql<number>`COUNT(*)`,
      totalRecipients: sql<number>`SUM(${messageTemplateUsage.recipientCount})`,
      totalSuccess: sql<number>`SUM(${messageTemplateUsage.successCount})`,
      totalFailures: sql<number>`SUM(${messageTemplateUsage.failureCount})`,
      emailUsages: sql<number>`SUM(CASE WHEN ${messageTemplateUsage.channel} = 'email' THEN 1 ELSE 0 END)`,
      smsUsages: sql<number>`SUM(CASE WHEN ${messageTemplateUsage.channel} = 'sms' THEN 1 ELSE 0 END)`,
    })
    .from(messageTemplateUsage)
    .where(eq(messageTemplateUsage.templateId, templateId));

  return stats[0] || {
    totalUsages: 0,
    totalRecipients: 0,
    totalSuccess: 0,
    totalFailures: 0,
    emailUsages: 0,
    smsUsages: 0,
  };
}

export async function getUserTemplateUsageHistory(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const history = await db
    .select({
      id: messageTemplateUsage.id,
      templateId: messageTemplateUsage.templateId,
      templateName: messageTemplates.name,
      channel: messageTemplateUsage.channel,
      recipientCount: messageTemplateUsage.recipientCount,
      successCount: messageTemplateUsage.successCount,
      failureCount: messageTemplateUsage.failureCount,
      createdAt: messageTemplateUsage.createdAt,
    })
    .from(messageTemplateUsage)
    .innerJoin(messageTemplates, eq(messageTemplateUsage.templateId, messageTemplates.id))
    .where(eq(messageTemplateUsage.userId, userId))
    .orderBy(desc(messageTemplateUsage.createdAt))
    .limit(limit);

  return history;
}

// ============================================================================
// TEMPLATE VARIABLE REPLACEMENT
// ============================================================================

export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string | number>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    result = result.replace(regex, String(value));
  }
  return result;
}
