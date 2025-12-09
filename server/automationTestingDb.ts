import { eq, desc } from "drizzle-orm";
import { getDb } from "./db";

/**
 * Automation Testing Database Helpers
 * Provides query functions for test scenarios, triggers, campaigns, and executions
 */

// Note: These tables were created via SQL, so we define minimal type interfaces
// In a production scenario, these would be in drizzle/schema.ts

export interface TestScenario {
  id: number;
  name: string;
  description?: string;
  scenarioType: 'candidate_application' | 'interview_scheduling' | 'email_campaign' | 'engagement_tracking' | 'ab_testing' | 'full_workflow';
  isActive: boolean;
  createdBy?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestTrigger {
  id: number;
  scenarioId: number;
  name: string;
  triggerType: 'application_submitted' | 'interview_scheduled' | 'interview_completed' | 'feedback_submitted' | 'engagement_score_change' | 'time_based' | 'manual';
  triggerConditions?: Record<string, any>;
  delayMinutes: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestCampaign {
  id: number;
  scenarioId: number;
  name: string;
  campaignType: 'email' | 'sms' | 'notification' | 'multi_channel';
  templateId?: number;
  targetAudience?: Record<string, any>;
  content?: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestExecution {
  id: number;
  scenarioId: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  executedBy?: number;
  sampleDataGenerated: boolean;
  testCandidatesCount: number;
  testJobsCount: number;
  testApplicationsCount: number;
  triggersExecuted: number;
  campaignsExecuted: number;
  results?: Record<string, any>;
  errorLog?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestData {
  id: number;
  executionId: number;
  dataType: 'candidate' | 'job' | 'application' | 'interview' | 'email' | 'campaign_execution';
  recordId: number;
  recordData?: Record<string, any>;
  createdAt: Date;
}

export interface TestResult {
  id: number;
  executionId: number;
  testType: string;
  testName: string;
  passed: boolean;
  expectedValue?: string;
  actualValue?: string;
  executionTime?: number;
  errorMessage?: string;
  stackTrace?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// ============================================================================
// Test Scenarios
// ============================================================================

export async function getAllTestScenarios(): Promise<TestScenario[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.execute<TestScenario>(
    `SELECT * FROM testScenarios ORDER BY createdAt DESC`
  );
  return result as TestScenario[];
}

export async function getTestScenarioById(id: number): Promise<TestScenario | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.execute<TestScenario>(
    `SELECT * FROM testScenarios WHERE id = ? LIMIT 1`,
    [id]
  );
  return result[0] || null;
}

export async function createTestScenario(data: {
  name: string;
  description?: string;
  scenarioType: TestScenario['scenarioType'];
  createdBy?: number;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.execute(
    `INSERT INTO testScenarios (name, description, scenarioType, createdBy) VALUES (?, ?, ?, ?)`,
    [data.name, data.description || null, data.scenarioType, data.createdBy || null]
  );
  return (result as any).insertId;
}

export async function updateTestScenario(id: number, data: Partial<TestScenario>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push(data.description);
  }
  if (data.isActive !== undefined) {
    updates.push('isActive = ?');
    values.push(data.isActive);
  }
  
  if (updates.length === 0) return;
  
  values.push(id);
  await db.execute(
    `UPDATE testScenarios SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
}

export async function deleteTestScenario(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.execute(`DELETE FROM testScenarios WHERE id = ?`, [id]);
}

// ============================================================================
// Test Triggers
// ============================================================================

export async function getTestTriggersByScenario(scenarioId: number): Promise<TestTrigger[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.execute<TestTrigger>(
    `SELECT * FROM testTriggers WHERE scenarioId = ? ORDER BY createdAt ASC`,
    [scenarioId]
  );
  return result as TestTrigger[];
}

export async function createTestTrigger(data: {
  scenarioId: number;
  name: string;
  triggerType: TestTrigger['triggerType'];
  triggerConditions?: Record<string, any>;
  delayMinutes?: number;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.execute(
    `INSERT INTO testTriggers (scenarioId, name, triggerType, triggerConditions, delayMinutes) VALUES (?, ?, ?, ?, ?)`,
    [
      data.scenarioId,
      data.name,
      data.triggerType,
      data.triggerConditions ? JSON.stringify(data.triggerConditions) : null,
      data.delayMinutes || 0
    ]
  );
  return (result as any).insertId;
}

export async function updateTestTrigger(id: number, data: Partial<TestTrigger>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.triggerConditions !== undefined) {
    updates.push('triggerConditions = ?');
    values.push(JSON.stringify(data.triggerConditions));
  }
  if (data.delayMinutes !== undefined) {
    updates.push('delayMinutes = ?');
    values.push(data.delayMinutes);
  }
  if (data.isActive !== undefined) {
    updates.push('isActive = ?');
    values.push(data.isActive);
  }
  
  if (updates.length === 0) return;
  
  values.push(id);
  await db.execute(
    `UPDATE testTriggers SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
}

export async function deleteTestTrigger(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.execute(`DELETE FROM testTriggers WHERE id = ?`, [id]);
}

// ============================================================================
// Test Campaigns
// ============================================================================

export async function getTestCampaignsByScenario(scenarioId: number): Promise<TestCampaign[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.execute<TestCampaign>(
    `SELECT * FROM testCampaigns WHERE scenarioId = ? ORDER BY createdAt ASC`,
    [scenarioId]
  );
  return result as TestCampaign[];
}

export async function createTestCampaign(data: {
  scenarioId: number;
  name: string;
  campaignType: TestCampaign['campaignType'];
  templateId?: number;
  targetAudience?: Record<string, any>;
  content?: Record<string, any>;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.execute(
    `INSERT INTO testCampaigns (scenarioId, name, campaignType, templateId, targetAudience, content) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.scenarioId,
      data.name,
      data.campaignType,
      data.templateId || null,
      data.targetAudience ? JSON.stringify(data.targetAudience) : null,
      data.content ? JSON.stringify(data.content) : null
    ]
  );
  return (result as any).insertId;
}

export async function updateTestCampaign(id: number, data: Partial<TestCampaign>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.targetAudience !== undefined) {
    updates.push('targetAudience = ?');
    values.push(JSON.stringify(data.targetAudience));
  }
  if (data.content !== undefined) {
    updates.push('content = ?');
    values.push(JSON.stringify(data.content));
  }
  if (data.isActive !== undefined) {
    updates.push('isActive = ?');
    values.push(data.isActive);
  }
  
  if (updates.length === 0) return;
  
  values.push(id);
  await db.execute(
    `UPDATE testCampaigns SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
}

export async function deleteTestCampaign(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.execute(`DELETE FROM testCampaigns WHERE id = ?`, [id]);
}

// ============================================================================
// Test Executions
// ============================================================================

export async function getTestExecutionsByScenario(scenarioId: number): Promise<TestExecution[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.execute<TestExecution>(
    `SELECT * FROM testExecutions WHERE scenarioId = ? ORDER BY createdAt DESC`,
    [scenarioId]
  );
  return result as TestExecution[];
}

export async function getTestExecutionById(id: number): Promise<TestExecution | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.execute<TestExecution>(
    `SELECT * FROM testExecutions WHERE id = ? LIMIT 1`,
    [id]
  );
  return result[0] || null;
}

export async function createTestExecution(data: {
  scenarioId: number;
  executedBy?: number;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.execute(
    `INSERT INTO testExecutions (scenarioId, executedBy, status) VALUES (?, ?, 'pending')`,
    [data.scenarioId, data.executedBy || null]
  );
  return (result as any).insertId;
}

export async function updateTestExecution(id: number, data: Partial<TestExecution>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (data.status !== undefined) {
    updates.push('status = ?');
    values.push(data.status);
  }
  if (data.startedAt !== undefined) {
    updates.push('startedAt = ?');
    values.push(data.startedAt);
  }
  if (data.completedAt !== undefined) {
    updates.push('completedAt = ?');
    values.push(data.completedAt);
  }
  if (data.sampleDataGenerated !== undefined) {
    updates.push('sampleDataGenerated = ?');
    values.push(data.sampleDataGenerated);
  }
  if (data.testCandidatesCount !== undefined) {
    updates.push('testCandidatesCount = ?');
    values.push(data.testCandidatesCount);
  }
  if (data.testJobsCount !== undefined) {
    updates.push('testJobsCount = ?');
    values.push(data.testJobsCount);
  }
  if (data.testApplicationsCount !== undefined) {
    updates.push('testApplicationsCount = ?');
    values.push(data.testApplicationsCount);
  }
  if (data.triggersExecuted !== undefined) {
    updates.push('triggersExecuted = ?');
    values.push(data.triggersExecuted);
  }
  if (data.campaignsExecuted !== undefined) {
    updates.push('campaignsExecuted = ?');
    values.push(data.campaignsExecuted);
  }
  if (data.results !== undefined) {
    updates.push('results = ?');
    values.push(JSON.stringify(data.results));
  }
  if (data.errorLog !== undefined) {
    updates.push('errorLog = ?');
    values.push(data.errorLog);
  }
  
  if (updates.length === 0) return;
  
  values.push(id);
  await db.execute(
    `UPDATE testExecutions SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
}

// ============================================================================
// Test Data
// ============================================================================

export async function createTestData(data: {
  executionId: number;
  dataType: TestData['dataType'];
  recordId: number;
  recordData?: Record<string, any>;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.execute(
    `INSERT INTO testData (executionId, dataType, recordId, recordData) VALUES (?, ?, ?, ?)`,
    [
      data.executionId,
      data.dataType,
      data.recordId,
      data.recordData ? JSON.stringify(data.recordData) : null
    ]
  );
  return (result as any).insertId;
}

export async function getTestDataByExecution(executionId: number): Promise<TestData[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.execute<TestData>(
    `SELECT * FROM testData WHERE executionId = ? ORDER BY createdAt ASC`,
    [executionId]
  );
  return result as TestData[];
}

export async function cleanupTestData(executionId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get all test data records
  const testDataRecords = await getTestDataByExecution(executionId);
  
  // Delete records from their respective tables
  for (const record of testDataRecords) {
    try {
      switch (record.dataType) {
        case 'candidate':
          await db.execute(`DELETE FROM candidates WHERE id = ?`, [record.recordId]);
          break;
        case 'job':
          await db.execute(`DELETE FROM jobs WHERE id = ?`, [record.recordId]);
          break;
        case 'application':
          await db.execute(`DELETE FROM applications WHERE id = ?`, [record.recordId]);
          break;
        case 'interview':
          await db.execute(`DELETE FROM videoInterviews WHERE id = ?`, [record.recordId]);
          break;
        case 'email':
          await db.execute(`DELETE FROM emailAnalytics WHERE id = ?`, [record.recordId]);
          break;
        case 'campaign_execution':
          await db.execute(`DELETE FROM campaignExecutions WHERE id = ?`, [record.recordId]);
          break;
      }
    } catch (error) {
      console.error(`Failed to cleanup test data record ${record.id}:`, error);
    }
  }
  
  // Delete test data tracking records
  await db.execute(`DELETE FROM testData WHERE executionId = ?`, [executionId]);
}

// ============================================================================
// Test Results
// ============================================================================

export async function createTestResult(data: {
  executionId: number;
  testType: string;
  testName: string;
  passed: boolean;
  expectedValue?: string;
  actualValue?: string;
  executionTime?: number;
  errorMessage?: string;
  stackTrace?: string;
  metadata?: Record<string, any>;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.execute(
    `INSERT INTO testResults (executionId, testType, testName, passed, expectedValue, actualValue, executionTime, errorMessage, stackTrace, metadata) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.executionId,
      data.testType,
      data.testName,
      data.passed,
      data.expectedValue || null,
      data.actualValue || null,
      data.executionTime || null,
      data.errorMessage || null,
      data.stackTrace || null,
      data.metadata ? JSON.stringify(data.metadata) : null
    ]
  );
  return (result as any).insertId;
}

export async function getTestResultsByExecution(executionId: number): Promise<TestResult[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.execute<TestResult>(
    `SELECT * FROM testResults WHERE executionId = ? ORDER BY createdAt ASC`,
    [executionId]
  );
  return result as TestResult[];
}
