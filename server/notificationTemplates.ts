import { eq, and, desc, sql } from "drizzle-orm";
import { getDb } from "./db";
import { notificationTemplates, notificationTemplateVariables } from "../drizzle/schema";

export interface NotificationTemplate {
  id: number;
  employerId: number | null;
  name: string;
  description: string | null;
  type: 'interview_reminder' | 'feedback_request' | 'candidate_response' | 'engagement_alert' | 'ab_test_result' | 'system_update' | 'general' | 'custom';
  channel: 'push' | 'email' | 'sms' | 'push_email';
  subject: string | null;
  bodyTemplate: string;
  variables: any;
  isDefault: number;
  isActive: number;
  usageCount: number;
  lastUsedAt: string | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateVariable {
  id: number;
  name: string;
  description: string | null;
  placeholder: string;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'url';
  defaultValue: string | null;
  isRequired: number;
  category: 'candidate' | 'interview' | 'job' | 'company' | 'system';
  exampleValue: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getAllTemplates(employerId?: number): Promise<NotificationTemplate[]> {
  const db = await getDb();
  if (!db) return [];

  if (employerId) {
    return await db
      .select()
      .from(notificationTemplates)
      .where(
        and(
          eq(notificationTemplates.isActive, 1),
          sql`(${notificationTemplates.employerId} = ${employerId} OR ${notificationTemplates.employerId} IS NULL)`
        )
      )
      .orderBy(desc(notificationTemplates.createdAt));
  }

  return await db
    .select()
    .from(notificationTemplates)
    .where(eq(notificationTemplates.isActive, 1))
    .orderBy(desc(notificationTemplates.createdAt));
}

export async function getTemplateById(id: number): Promise<NotificationTemplate | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(notificationTemplates)
    .where(eq(notificationTemplates.id, id))
    .limit(1);

  return result[0];
}

export async function getTemplatesByType(
  type: NotificationTemplate['type'],
  employerId?: number
): Promise<NotificationTemplate[]> {
  const db = await getDb();
  if (!db) return [];

  if (employerId) {
    return await db
      .select()
      .from(notificationTemplates)
      .where(
        and(
          eq(notificationTemplates.type, type),
          eq(notificationTemplates.isActive, 1),
          sql`(${notificationTemplates.employerId} = ${employerId} OR ${notificationTemplates.employerId} IS NULL)`
        )
      )
      .orderBy(desc(notificationTemplates.createdAt));
  }

  return await db
    .select()
    .from(notificationTemplates)
    .where(
      and(
        eq(notificationTemplates.type, type),
        eq(notificationTemplates.isActive, 1)
      )
    )
    .orderBy(desc(notificationTemplates.createdAt));
}

export async function createTemplate(template: {
  employerId?: number;
  name: string;
  description?: string;
  type: NotificationTemplate['type'];
  channel: NotificationTemplate['channel'];
  subject?: string;
  bodyTemplate: string;
  variables?: string[];
  isDefault?: boolean;
  createdBy?: number;
}): Promise<NotificationTemplate> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(notificationTemplates).values({
    employerId: template.employerId || null,
    name: template.name,
    description: template.description || null,
    type: template.type,
    channel: template.channel,
    subject: template.subject || null,
    bodyTemplate: template.bodyTemplate,
    variables: template.variables ? JSON.stringify(template.variables) : null,
    isDefault: template.isDefault ? 1 : 0,
    isActive: 1,
    usageCount: 0,
    createdBy: template.createdBy || null,
  });

  const insertedId = Number(result[0].insertId);
  const inserted = await getTemplateById(insertedId);
  if (!inserted) throw new Error("Failed to retrieve inserted template");
  return inserted;
}

export async function updateTemplate(
  id: number,
  updates: {
    name?: string;
    description?: string;
    subject?: string;
    bodyTemplate?: string;
    variables?: string[];
    isActive?: boolean;
  }
): Promise<NotificationTemplate> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.subject !== undefined) updateData.subject = updates.subject;
  if (updates.bodyTemplate !== undefined) updateData.bodyTemplate = updates.bodyTemplate;
  if (updates.variables !== undefined) updateData.variables = JSON.stringify(updates.variables);
  if (updates.isActive !== undefined) updateData.isActive = updates.isActive ? 1 : 0;

  await db
    .update(notificationTemplates)
    .set(updateData)
    .where(eq(notificationTemplates.id, id));

  const updated = await getTemplateById(id);
  if (!updated) throw new Error("Template not found after update");
  return updated;
}

export async function deleteTemplate(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(notificationTemplates)
    .set({ isActive: 0 })
    .where(eq(notificationTemplates.id, id));
}

export async function incrementTemplateUsage(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(notificationTemplates)
    .set({
      usageCount: sql`${notificationTemplates.usageCount} + 1`,
      lastUsedAt: new Date().toISOString(),
    })
    .where(eq(notificationTemplates.id, id));
}

export async function getAllTemplateVariables(): Promise<TemplateVariable[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(notificationTemplateVariables)
    .orderBy(notificationTemplateVariables.category, notificationTemplateVariables.name);
}

export async function getTemplateVariablesByCategory(
  category: TemplateVariable['category']
): Promise<TemplateVariable[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(notificationTemplateVariables)
    .where(eq(notificationTemplateVariables.category, category))
    .orderBy(notificationTemplateVariables.name);
}

export function renderTemplate(
  template: string,
  variables: Record<string, any>
): string {
  let rendered = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    const stringValue = value !== null && value !== undefined ? String(value) : '';
    rendered = rendered.replace(new RegExp(placeholder, 'g'), stringValue);
  }
  
  return rendered;
}

export function extractVariablesFromTemplate(template: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const variables: string[] = [];
  let match;
  
  while ((match = regex.exec(template)) !== null) {
    const varName = match[1].trim();
    if (!variables.includes(varName)) {
      variables.push(varName);
    }
  }
  
  return variables;
}
