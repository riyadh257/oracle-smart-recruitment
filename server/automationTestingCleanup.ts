import { getDb } from "./db";
import * as automationTestingDb from "./automationTestingDb";

/**
 * Automation Testing Cleanup Module
 * Handles scheduled cleanup of old test data to prevent database bloat
 */

export interface CleanupConfig {
  retentionDays: number;
  cleanupExecutions: boolean;
  cleanupTestData: boolean;
  cleanupResults: boolean;
}

const DEFAULT_CLEANUP_CONFIG: CleanupConfig = {
  retentionDays: 30, // Keep test data for 30 days by default
  cleanupExecutions: true,
  cleanupTestData: true,
  cleanupResults: true,
};

/**
 * Get cleanup configuration from database or use defaults
 */
export async function getCleanupConfig(): Promise<CleanupConfig> {
  const db = await getDb();
  if (!db) return DEFAULT_CLEANUP_CONFIG;

  try {
    const result = await db.execute(
      `SELECT configValue FROM systemConfig WHERE configKey = 'automation_testing_cleanup'`
    );
    
    if ((result as any).length > 0) {
      return JSON.parse((result as any)[0].configValue);
    }
  } catch (error) {
    console.warn("[Cleanup] Failed to load config, using defaults:", error);
  }

  return DEFAULT_CLEANUP_CONFIG;
}

/**
 * Save cleanup configuration to database
 */
export async function saveCleanupConfig(config: CleanupConfig): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.execute(
    `INSERT INTO systemConfig (configKey, configValue, updatedAt)
     VALUES ('automation_testing_cleanup', ?, NOW())
     ON DUPLICATE KEY UPDATE configValue = ?, updatedAt = NOW()`,
    [JSON.stringify(config), JSON.stringify(config)]
  );
}

/**
 * Clean up old test executions and related data
 */
export async function cleanupOldTestData(config?: CleanupConfig): Promise<{
  executionsDeleted: number;
  testDataDeleted: number;
  resultsDeleted: number;
  candidatesDeleted: number;
  jobsDeleted: number;
  applicationsDeleted: number;
}> {
  const cleanupConfig = config || await getCleanupConfig();
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - cleanupConfig.retentionDays);

  let executionsDeleted = 0;
  let testDataDeleted = 0;
  let resultsDeleted = 0;
  let candidatesDeleted = 0;
  let jobsDeleted = 0;
  let applicationsDeleted = 0;

  try {
    // Get old executions
    const oldExecutions = await db.execute(
      `SELECT id FROM testExecutions WHERE createdAt < ?`,
      [cutoffDate]
    ) as any[];

    if (oldExecutions.length === 0) {
      return {
        executionsDeleted: 0,
        testDataDeleted: 0,
        resultsDeleted: 0,
        candidatesDeleted: 0,
        jobsDeleted: 0,
        applicationsDeleted: 0,
      };
    }

    const executionIds = oldExecutions.map((e: any) => e.id);

    // Clean up test data records and actual test entities
    if (cleanupConfig.cleanupTestData) {
      for (const executionId of executionIds) {
        // Get test data to clean up actual records
        const testData = await automationTestingDb.getTestDataByExecution(executionId);

        for (const data of testData) {
          try {
            switch (data.dataType) {
              case 'candidate':
                // Delete candidate and associated user
                const candidate = await db.execute(
                  `SELECT userId FROM candidates WHERE id = ?`,
                  [data.recordId]
                ) as any[];
                
                if (candidate.length > 0) {
                  await db.execute(`DELETE FROM candidates WHERE id = ?`, [data.recordId]);
                  await db.execute(`DELETE FROM users WHERE id = ?`, [candidate[0].userId]);
                  candidatesDeleted++;
                }
                break;

              case 'job':
                await db.execute(`DELETE FROM jobs WHERE id = ?`, [data.recordId]);
                jobsDeleted++;
                break;

              case 'application':
                await db.execute(`DELETE FROM applications WHERE id = ?`, [data.recordId]);
                applicationsDeleted++;
                break;

              case 'interview':
                await db.execute(`DELETE FROM interviews WHERE id = ?`, [data.recordId]);
                break;

              case 'email':
                await db.execute(`DELETE FROM emailLogs WHERE id = ?`, [data.recordId]);
                break;

              case 'campaign_execution':
                await db.execute(`DELETE FROM campaignExecutions WHERE id = ?`, [data.recordId]);
                break;
            }
          } catch (error) {
            console.warn(`[Cleanup] Failed to delete ${data.dataType} record ${data.recordId}:`, error);
          }
        }

        // Delete test data tracking records
        const testDataResult = await db.execute(
          `DELETE FROM testData WHERE executionId = ?`,
          [executionId]
        ) as any;
        testDataDeleted += testDataResult.affectedRows || 0;
      }
    }

    // Clean up test results
    if (cleanupConfig.cleanupResults) {
      const resultsResult = await db.execute(
        `DELETE FROM testResults WHERE executionId IN (${executionIds.join(',')})`,
        []
      ) as any;
      resultsDeleted = resultsResult.affectedRows || 0;
    }

    // Clean up executions
    if (cleanupConfig.cleanupExecutions) {
      const executionsResult = await db.execute(
        `DELETE FROM testExecutions WHERE id IN (${executionIds.join(',')})`,
        []
      ) as any;
      executionsDeleted = executionsResult.affectedRows || 0;
    }

    console.log(`[Cleanup] Completed: ${executionsDeleted} executions, ${testDataDeleted} test data records, ${resultsDeleted} results, ${candidatesDeleted} candidates, ${jobsDeleted} jobs, ${applicationsDeleted} applications`);

    return {
      executionsDeleted,
      testDataDeleted,
      resultsDeleted,
      candidatesDeleted,
      jobsDeleted,
      applicationsDeleted,
    };
  } catch (error) {
    console.error("[Cleanup] Failed to clean up test data:", error);
    throw error;
  }
}

/**
 * Clean up test data for a specific execution
 */
export async function cleanupExecutionData(executionId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Get test data to clean up actual records
    const testData = await automationTestingDb.getTestDataByExecution(executionId);

    for (const data of testData) {
      try {
        switch (data.dataType) {
          case 'candidate':
            const candidate = await db.execute(
              `SELECT userId FROM candidates WHERE id = ?`,
              [data.recordId]
            ) as any[];
            
            if (candidate.length > 0) {
              await db.execute(`DELETE FROM candidates WHERE id = ?`, [data.recordId]);
              await db.execute(`DELETE FROM users WHERE id = ?`, [candidate[0].userId]);
            }
            break;

          case 'job':
            await db.execute(`DELETE FROM jobs WHERE id = ?`, [data.recordId]);
            break;

          case 'application':
            await db.execute(`DELETE FROM applications WHERE id = ?`, [data.recordId]);
            break;

          case 'interview':
            await db.execute(`DELETE FROM interviews WHERE id = ?`, [data.recordId]);
            break;

          case 'email':
            await db.execute(`DELETE FROM emailLogs WHERE id = ?`, [data.recordId]);
            break;

          case 'campaign_execution':
            await db.execute(`DELETE FROM campaignExecutions WHERE id = ?`, [data.recordId]);
            break;
        }
      } catch (error) {
        console.warn(`[Cleanup] Failed to delete ${data.dataType} record ${data.recordId}:`, error);
      }
    }

    // Delete test data tracking records
    await db.execute(`DELETE FROM testData WHERE executionId = ?`, [executionId]);

    // Delete test results
    await db.execute(`DELETE FROM testResults WHERE executionId = ?`, [executionId]);

    console.log(`[Cleanup] Cleaned up data for execution ${executionId}`);
  } catch (error) {
    console.error(`[Cleanup] Failed to clean up execution ${executionId}:`, error);
    throw error;
  }
}

/**
 * Get cleanup statistics
 */
export async function getCleanupStats(): Promise<{
  totalExecutions: number;
  oldExecutions: number;
  totalTestData: number;
  totalResults: number;
  estimatedCleanupSize: number;
}> {
  const config = await getCleanupConfig();
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - config.retentionDays);

  const totalExecutions = await db.execute(`SELECT COUNT(*) as count FROM testExecutions`) as any[];
  const oldExecutions = await db.execute(
    `SELECT COUNT(*) as count FROM testExecutions WHERE createdAt < ?`,
    [cutoffDate]
  ) as any[];
  const totalTestData = await db.execute(`SELECT COUNT(*) as count FROM testData`) as any[];
  const totalResults = await db.execute(`SELECT COUNT(*) as count FROM testResults`) as any[];

  const oldExecutionIds = await db.execute(
    `SELECT id FROM testExecutions WHERE createdAt < ?`,
    [cutoffDate]
  ) as any[];

  let estimatedCleanupSize = 0;
  if (oldExecutionIds.length > 0) {
    const ids = oldExecutionIds.map((e: any) => e.id).join(',');
    const cleanupTestData = await db.execute(
      `SELECT COUNT(*) as count FROM testData WHERE executionId IN (${ids})`,
      []
    ) as any[];
    const cleanupResults = await db.execute(
      `SELECT COUNT(*) as count FROM testResults WHERE executionId IN (${ids})`,
      []
    ) as any[];
    
    estimatedCleanupSize = oldExecutionIds.length + 
                          (cleanupTestData[0]?.count || 0) + 
                          (cleanupResults[0]?.count || 0);
  }

  return {
    totalExecutions: totalExecutions[0]?.count || 0,
    oldExecutions: oldExecutions[0]?.count || 0,
    totalTestData: totalTestData[0]?.count || 0,
    totalResults: totalResults[0]?.count || 0,
    estimatedCleanupSize,
  };
}
