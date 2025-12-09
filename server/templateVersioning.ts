/**
 * Email Template Versioning Service
 * Track template changes, performance metrics, and enable rollback
 */

import { getDb } from "./db";
import { sql, eq, and, desc } from "drizzle-orm";
import { emailTemplateVersions } from "../drizzle/schema";

export interface TemplateVersion {
  id: number;
  templateId: string;
  version: number;
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  variables?: Record<string, any>;
  createdBy?: number;
  createdAt: string;
  isActive: number;
  performanceScore: number;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
  notes?: string;
}

export interface VersionComparison {
  currentVersion: TemplateVersion;
  previousVersion: TemplateVersion;
  performanceDelta: {
    openRateDelta: number;
    clickRateDelta: number;
    scoreDelta: number;
  };
  recommendation: "keep" | "rollback" | "test_more";
  reason: string;
}

/**
 * Create a new version of a template
 */
export async function createTemplateVersion(
  templateId: string,
  name: string,
  subject: string,
  bodyHtml: string,
  bodyText: string | undefined,
  variables: Record<string, any> | undefined,
  createdBy: number,
  notes?: string
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get the latest version number using Drizzle query builder
  const versions = await db
    .select({ version: emailTemplateVersions.version })
    .from(emailTemplateVersions)
    .where(eq(emailTemplateVersions.templateId, templateId))
    .orderBy(desc(emailTemplateVersions.version))
    .limit(1);

  const nextVersion = versions.length > 0 ? (versions[0].version || 0) + 1 : 1;

  // Deactivate all previous versions
  await db
    .update(emailTemplateVersions)
    .set({ isActive: 0 })
    .where(eq(emailTemplateVersions.templateId, templateId));

  // Insert new version
  const result = await db.insert(emailTemplateVersions).values({
    templateId,
    version: nextVersion,
    name,
    subject,
    bodyHtml,
    bodyText: bodyText || null,
    variables: variables ? JSON.stringify(variables) : null,
    createdBy,
    isActive: 1,
    notes: notes || null,
  });

  return Number((result as any).insertId);
}

/**
 * Get all versions of a template
 */
export async function getTemplateVersions(templateId: string): Promise<TemplateVersion[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rows = await db
    .select()
    .from(emailTemplateVersions)
    .where(eq(emailTemplateVersions.templateId, templateId))
    .orderBy(desc(emailTemplateVersions.version));

  return rows.map((row: any) => ({
    ...row,
    variables: typeof row.variables === 'string' ? JSON.parse(row.variables) : row.variables,
  }));
}

/**
 * Get active version of a template
 */
export async function getActiveTemplateVersion(templateId: string): Promise<TemplateVersion | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rows = await db
    .select()
    .from(emailTemplateVersions)
    .where(
      and(
        eq(emailTemplateVersions.templateId, templateId),
        eq(emailTemplateVersions.isActive, 1)
      )
    )
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    ...row,
    variables: typeof row.variables === 'string' ? JSON.parse(row.variables) : row.variables,
  } as TemplateVersion;
}

/**
 * Get specific version of a template
 */
export async function getTemplateVersion(
  templateId: string,
  version: number
): Promise<TemplateVersion | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rows = await db
    .select()
    .from(emailTemplateVersions)
    .where(
      and(
        eq(emailTemplateVersions.templateId, templateId),
        eq(emailTemplateVersions.version, version)
      )
    )
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    ...row,
    variables: typeof row.variables === 'string' ? JSON.parse(row.variables) : row.variables,
  } as TemplateVersion;
}

/**
 * Update performance metrics for a version
 */
export async function updateVersionPerformance(
  templateId: string,
  version: number,
  metrics: {
    totalSent?: number;
    totalOpened?: number;
    totalClicked?: number;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get current metrics
  const currentVersion = await getTemplateVersion(templateId, version);
  if (!currentVersion) throw new Error("Template version not found");

  const newSent = metrics.totalSent ?? currentVersion.totalSent;
  const newOpened = metrics.totalOpened ?? currentVersion.totalOpened;
  const newClicked = metrics.totalClicked ?? currentVersion.totalClicked;

  const openRate = newSent > 0 ? (newOpened / newSent) * 100 : 0;
  const clickRate = newSent > 0 ? (newClicked / newSent) * 100 : 0;
  
  // Calculate performance score (weighted average)
  const performanceScore = openRate * 0.6 + clickRate * 0.4;

  await db
    .update(emailTemplateVersions)
    .set({
      totalSent: newSent,
      totalOpened: newOpened,
      totalClicked: newClicked,
      openRate,
      clickRate,
      performanceScore,
    })
    .where(
      and(
        eq(emailTemplateVersions.templateId, templateId),
        eq(emailTemplateVersions.version, version)
      )
    );
}

/**
 * Rollback to a previous version
 */
export async function rollbackToVersion(
  templateId: string,
  targetVersion: number,
  userId: number,
  reason?: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verify target version exists
  const targetVersionData = await getTemplateVersion(templateId, targetVersion);
  if (!targetVersionData) {
    throw new Error(`Version ${targetVersion} not found for template ${templateId}`);
  }

  // Deactivate all versions
  await db
    .update(emailTemplateVersions)
    .set({ isActive: 0 })
    .where(eq(emailTemplateVersions.templateId, templateId));

  // Activate target version
  await db
    .update(emailTemplateVersions)
    .set({ isActive: 1 })
    .where(
      and(
        eq(emailTemplateVersions.templateId, templateId),
        eq(emailTemplateVersions.version, targetVersion)
      )
    );

  // Log the rollback (create a new version entry that references the rolled-back content)
  const rollbackNotes = `Rolled back to version ${targetVersion}. ${reason || ""}`;
  await createTemplateVersion(
    templateId,
    targetVersionData.name,
    targetVersionData.subject,
    targetVersionData.bodyHtml,
    targetVersionData.bodyText,
    targetVersionData.variables,
    userId,
    rollbackNotes
  );
}

/**
 * Compare two versions and provide recommendation
 */
export async function compareVersions(
  templateId: string,
  currentVersionNum: number,
  previousVersionNum: number
): Promise<VersionComparison> {
  const currentVersion = await getTemplateVersion(templateId, currentVersionNum);
  const previousVersion = await getTemplateVersion(templateId, previousVersionNum);

  if (!currentVersion || !previousVersion) {
    throw new Error("One or both versions not found");
  }

  // Calculate deltas
  const openRateDelta = currentVersion.openRate - previousVersion.openRate;
  const clickRateDelta = currentVersion.clickRate - previousVersion.clickRate;
  const scoreDelta = currentVersion.performanceScore - previousVersion.performanceScore;

  // Determine recommendation
  let recommendation: "keep" | "rollback" | "test_more";
  let reason: string;

  // Need minimum sample size for reliable comparison
  const minSampleSize = 100;
  if (currentVersion.totalSent < minSampleSize) {
    recommendation = "test_more";
    reason = `Current version has only ${currentVersion.totalSent} sends. Collect at least ${minSampleSize} for reliable comparison.`;
  } else if (scoreDelta < -10) {
    // Significant performance drop (>10 points)
    recommendation = "rollback";
    reason = `Performance dropped significantly (${scoreDelta.toFixed(1)} points). Open rate: ${openRateDelta.toFixed(1)}%, Click rate: ${clickRateDelta.toFixed(1)}%.`;
  } else if (scoreDelta < -5) {
    // Moderate performance drop (5-10 points)
    recommendation = "rollback";
    reason = `Performance declined moderately (${scoreDelta.toFixed(1)} points). Consider rolling back.`;
  } else if (scoreDelta > 5) {
    // Significant improvement
    recommendation = "keep";
    reason = `Performance improved significantly (${scoreDelta.toFixed(1)} points). Keep this version.`;
  } else {
    // Minor changes
    recommendation = "keep";
    reason = `Performance is similar to previous version (${scoreDelta.toFixed(1)} points difference). Continue monitoring.`;
  }

  return {
    currentVersion,
    previousVersion,
    performanceDelta: {
      openRateDelta,
      clickRateDelta,
      scoreDelta,
    },
    recommendation,
    reason,
  };
}

/**
 * Auto-check for performance degradation and rollback if needed
 */
export async function autoCheckAndRollback(
  templateId: string,
  userId: number
): Promise<{ rolledBack: boolean; reason?: string }> {
  const versions = await getTemplateVersions(templateId);
  
  if (versions.length < 2) {
    return { rolledBack: false };
  }

  const currentVersion = versions[0];
  const previousVersion = versions[1];

  if (!currentVersion || !previousVersion) {
    return { rolledBack: false };
  }

  // Only check if we have enough data
  if (currentVersion.totalSent < 100) {
    return { rolledBack: false };
  }

  const comparison = await compareVersions(
    templateId,
    currentVersion.version,
    previousVersion.version
  );

  if (comparison.recommendation === "rollback") {
    await rollbackToVersion(
      templateId,
      previousVersion.version,
      userId,
      `Auto-rollback: ${comparison.reason}`
    );
    return { rolledBack: true, reason: comparison.reason };
  }

  return { rolledBack: false };
}
