import { eq, and, desc, gte, lte } from "drizzle-orm";
import { getDb } from "./db";
import {
  bulkBroadcastCampaigns,
  emailWorkflows,
  workflowExecutions,
  abTestsNew,
  abTestVariants,
  abTestResults,
  candidates,
  type InsertBulkBroadcastCampaign,
  type InsertEmailWorkflow,
  type InsertWorkflowExecution,
  type InsertABTestNew,
  type InsertABTestVariant,
  type InsertABTestResult,
} from "../drizzle/schema";

// ===== Bulk Broadcast =====

export async function createBroadcastCampaign(campaign: InsertBulkBroadcastCampaign) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(bulkBroadcastCampaigns).values(campaign);
  return result[0].insertId;
}

export async function getBroadcastCampaign(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(bulkBroadcastCampaigns).where(eq(bulkBroadcastCampaigns.id, id)).limit(1);
  return result[0];
}

export async function getAllBroadcastCampaigns(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(bulkBroadcastCampaigns)
    .where(eq(bulkBroadcastCampaigns.createdBy, userId))
    .orderBy(desc(bulkBroadcastCampaigns.createdAt));
}

export async function updateBroadcastCampaignStatus(
  id: number,
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed',
  updates?: Partial<InsertBulkBroadcastCampaign>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(bulkBroadcastCampaigns)
    .set({ status, ...updates })
    .where(eq(bulkBroadcastCampaigns.id, id));
}

// ===== Email Workflows =====

export async function createEmailWorkflow(workflow: InsertEmailWorkflow) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(emailWorkflows).values(workflow);
  return result[0].insertId;
}

export async function getEmailWorkflow(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(emailWorkflows).where(eq(emailWorkflows.id, id)).limit(1);
  return result[0];
}

export async function getAllEmailWorkflows(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(emailWorkflows)
    .where(eq(emailWorkflows.createdBy, userId))
    .orderBy(desc(emailWorkflows.createdAt));
}

export async function getActiveWorkflowsByTrigger(triggerEvent: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(emailWorkflows)
    .where(and(
      eq(emailWorkflows.triggerEvent, triggerEvent as any),
      eq(emailWorkflows.isActive, 1)
    ));
}

export async function updateEmailWorkflow(id: number, updates: Partial<InsertEmailWorkflow>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(emailWorkflows)
    .set(updates)
    .where(eq(emailWorkflows.id, id));
}

// ===== Workflow Executions =====

export async function createWorkflowExecution(execution: InsertWorkflowExecution) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(workflowExecutions).values(execution);
  return result[0].insertId;
}

export async function getPendingWorkflowExecutions(beforeTime: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(workflowExecutions)
    .where(and(
      eq(workflowExecutions.status, 'pending'),
      lte(workflowExecutions.scheduledFor, beforeTime.toISOString())
    ))
    .orderBy(workflowExecutions.scheduledFor);
}

export async function updateWorkflowExecution(id: number, updates: Partial<InsertWorkflowExecution>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(workflowExecutions)
    .set(updates)
    .where(eq(workflowExecutions.id, id));
}

// ===== A/B Tests =====

export async function createABTest(test: InsertABTestNew) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(abTestsNew).values(test);
  return result[0].insertId;
}

export async function getABTest(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(abTestsNew).where(eq(abTestsNew.id, id)).limit(1);
  return result[0];
}

export async function getAllABTests(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(abTestsNew)
    .where(eq(abTestsNew.createdBy, userId))
    .orderBy(desc(abTestsNew.createdAt));
}

export async function updateABTest(id: number, updates: Partial<InsertABTestNew>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(abTestsNew)
    .set(updates)
    .where(eq(abTestsNew.id, id));
}

// ===== A/B Test Variants =====

export async function createABTestVariant(variant: InsertABTestVariant) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(abTestVariants).values(variant);
  return result[0].insertId;
}

export async function getABTestVariants(testId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(abTestVariants)
    .where(eq(abTestVariants.testId, testId))
    .orderBy(abTestVariants.variantName);
}

export async function updateABTestVariant(id: number, updates: Partial<InsertABTestVariant>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(abTestVariants)
    .set(updates)
    .where(eq(abTestVariants.id, id));
}

// ===== A/B Test Results =====

export async function createABTestResult(result: InsertABTestResult) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const insertResult = await db.insert(abTestResults).values(result);
  return insertResult[0].insertId;
}

export async function getABTestResult(testId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(abTestResults)
    .where(eq(abTestResults.testId, testId))
    .limit(1);
  return result[0];
}

export async function updateABTestResult(testId: number, updates: Partial<InsertABTestResult>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(abTestResults)
    .set(updates)
    .where(eq(abTestResults.testId, testId));
}

// ===== Helper Functions =====

export async function getCandidatesBySegment(segmentFilter: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // For now, return all candidates if no filter or "all" segment
  if (!segmentFilter || segmentFilter.type === 'all') {
    return db.select().from(candidates);
  }
  
  // TODO: Implement more sophisticated filtering based on segmentFilter criteria
  // For example: skills, experience, location, status, etc.
  return db.select().from(candidates);
}
