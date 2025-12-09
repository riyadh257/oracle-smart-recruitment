import { getDb } from "./db";

/**
 * Custom Templates Database Module
 * Handles CRUD operations for user-created test templates
 */

export interface CustomTemplate {
  id: number;
  name: string;
  description: string | null;
  scenarioType: string;
  createdBy: number;
  isPublic: boolean;
  templateData: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCustomTemplateInput {
  name: string;
  description?: string;
  scenarioType: string;
  createdBy: number;
  isPublic?: boolean;
  templateData: any;
}

/**
 * Create a custom template
 */
export async function createCustomTemplate(input: CreateCustomTemplateInput): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.execute(
    `INSERT INTO customTemplates (name, description, scenarioType, createdBy, isPublic, templateData)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.name,
      input.description || null,
      input.scenarioType,
      input.createdBy,
      input.isPublic || false,
      JSON.stringify(input.templateData)
    ]
  ) as any;

  return result.insertId;
}

/**
 * Get custom template by ID
 */
export async function getCustomTemplateById(id: number): Promise<CustomTemplate | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const results = await db.execute(
    `SELECT * FROM customTemplates WHERE id = ?`,
    [id]
  ) as any[];

  if (results.length === 0) return null;

  const row = results[0];
  return {
    ...row,
    templateData: typeof row.templateData === 'string' ? JSON.parse(row.templateData) : row.templateData
  };
}

/**
 * Get all custom templates for a user
 */
export async function getCustomTemplatesByUser(userId: number): Promise<CustomTemplate[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const results = await db.execute(
    `SELECT * FROM customTemplates WHERE createdBy = ? OR isPublic = TRUE ORDER BY createdAt DESC`,
    [userId]
  ) as any[];

  return results.map((row: any) => ({
    ...row,
    templateData: typeof row.templateData === 'string' ? JSON.parse(row.templateData) : row.templateData
  }));
}

/**
 * Get custom templates by scenario type
 */
export async function getCustomTemplatesByType(scenarioType: string, userId: number): Promise<CustomTemplate[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const results = await db.execute(
    `SELECT * FROM customTemplates 
     WHERE scenarioType = ? AND (createdBy = ? OR isPublic = TRUE)
     ORDER BY createdAt DESC`,
    [scenarioType, userId]
  ) as any[];

  return results.map((row: any) => ({
    ...row,
    templateData: typeof row.templateData === 'string' ? JSON.parse(row.templateData) : row.templateData
  }));
}

/**
 * Update a custom template
 */
export async function updateCustomTemplate(
  id: number,
  userId: number,
  updates: Partial<CreateCustomTemplateInput>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const setClauses: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    setClauses.push("name = ?");
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    setClauses.push("description = ?");
    values.push(updates.description);
  }
  if (updates.scenarioType !== undefined) {
    setClauses.push("scenarioType = ?");
    values.push(updates.scenarioType);
  }
  if (updates.isPublic !== undefined) {
    setClauses.push("isPublic = ?");
    values.push(updates.isPublic);
  }
  if (updates.templateData !== undefined) {
    setClauses.push("templateData = ?");
    values.push(JSON.stringify(updates.templateData));
  }

  if (setClauses.length === 0) return;

  values.push(id, userId);

  await db.execute(
    `UPDATE customTemplates SET ${setClauses.join(", ")} WHERE id = ? AND createdBy = ?`,
    values
  );
}

/**
 * Delete a custom template
 */
export async function deleteCustomTemplate(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.execute(
    `DELETE FROM customTemplates WHERE id = ? AND createdBy = ?`,
    [id, userId]
  );
}

/**
 * Create template from existing scenario
 */
export async function createTemplateFromScenario(
  scenarioId: number,
  userId: number,
  name: string,
  description?: string,
  isPublic?: boolean
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get scenario details
  const scenarios = await db.execute(
    `SELECT * FROM testScenarios WHERE id = ?`,
    [scenarioId]
  ) as any[];

  if (scenarios.length === 0) {
    throw new Error("Scenario not found");
  }

  const scenario = scenarios[0];

  // Get triggers
  const triggers = await db.execute(
    `SELECT * FROM testTriggers WHERE scenarioId = ?`,
    [scenarioId]
  ) as any[];

  // Get campaigns
  const campaigns = await db.execute(
    `SELECT * FROM testCampaigns WHERE scenarioId = ?`,
    [scenarioId]
  ) as any[];

  // Build template data
  const templateData = {
    scenarioType: scenario.scenarioType,
    triggers: triggers.map((t: any) => ({
      name: t.name,
      triggerType: t.triggerType,
      delayMinutes: t.delayMinutes,
      triggerConditions: typeof t.triggerConditions === 'string' 
        ? JSON.parse(t.triggerConditions) 
        : t.triggerConditions
    })),
    campaigns: campaigns.map((c: any) => ({
      name: c.name,
      campaignType: c.campaignType,
      content: typeof c.content === 'string' ? JSON.parse(c.content) : c.content
    })),
    sampleDataConfig: {
      candidateCount: 5,
      jobCount: 2,
      generateApplications: true
    }
  };

  return await createCustomTemplate({
    name,
    description,
    scenarioType: scenario.scenarioType,
    createdBy: userId,
    isPublic: isPublic || false,
    templateData
  });
}
