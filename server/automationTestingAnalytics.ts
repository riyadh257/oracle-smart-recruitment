import { getDb } from "./db";

/**
 * Automation Testing Analytics Module
 * Provides metrics and trends for test execution reporting
 */

export interface ExecutionTrend {
  date: string;
  totalExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  successRate: number;
}

export interface PerformanceMetrics {
  averageExecutionTime: number;
  averageCandidatesGenerated: number;
  averageJobsGenerated: number;
  averageApplicationsGenerated: number;
  totalTestsRun: number;
}

export interface ScenarioStats {
  scenarioId: number;
  scenarioName: string;
  scenarioType: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number;
  averageExecutionTime: number;
}

export interface TestResultSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  successRate: number;
  testsByType: Record<string, { passed: number; failed: number; total: number }>;
}

/**
 * Get execution trends over time
 */
export async function getExecutionTrends(days: number = 30): Promise<ExecutionTrend[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const query = `
    SELECT 
      DATE(createdAt) as date,
      COUNT(*) as totalExecutions,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedExecutions,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failedExecutions
    FROM testExecutions
    WHERE createdAt >= ?
    GROUP BY DATE(createdAt)
    ORDER BY date ASC
  `;

  const results = await db.execute(query, [startDate]) as any[];

  return results.map((row: any) => ({
    date: row.date,
    totalExecutions: row.totalExecutions,
    completedExecutions: row.completedExecutions,
    failedExecutions: row.failedExecutions,
    successRate: row.totalExecutions > 0 
      ? (row.completedExecutions / row.totalExecutions) * 100 
      : 0
  }));
}

/**
 * Get performance metrics
 */
export async function getPerformanceMetrics(): Promise<PerformanceMetrics> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const query = `
    SELECT 
      AVG(TIMESTAMPDIFF(SECOND, startedAt, completedAt)) as averageExecutionTime,
      AVG(testCandidatesCount) as averageCandidatesGenerated,
      AVG(testJobsCount) as averageJobsGenerated,
      AVG(testApplicationsCount) as averageApplicationsGenerated,
      COUNT(*) as totalTestsRun
    FROM testExecutions
    WHERE status = 'completed' AND startedAt IS NOT NULL AND completedAt IS NOT NULL
  `;

  const results = await db.execute(query, []) as any[];

  if (results.length === 0) {
    return {
      averageExecutionTime: 0,
      averageCandidatesGenerated: 0,
      averageJobsGenerated: 0,
      averageApplicationsGenerated: 0,
      totalTestsRun: 0
    };
  }

  const row = results[0];
  return {
    averageExecutionTime: Math.round(row.averageExecutionTime || 0),
    averageCandidatesGenerated: Math.round(row.averageCandidatesGenerated || 0),
    averageJobsGenerated: Math.round(row.averageJobsGenerated || 0),
    averageApplicationsGenerated: Math.round(row.averageApplicationsGenerated || 0),
    totalTestsRun: row.totalTestsRun || 0
  };
}

/**
 * Get statistics by scenario
 */
export async function getScenarioStats(): Promise<ScenarioStats[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const query = `
    SELECT 
      s.id as scenarioId,
      s.name as scenarioName,
      s.scenarioType,
      COUNT(e.id) as totalExecutions,
      SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) as successfulExecutions,
      SUM(CASE WHEN e.status = 'failed' THEN 1 ELSE 0 END) as failedExecutions,
      AVG(TIMESTAMPDIFF(SECOND, e.startedAt, e.completedAt)) as averageExecutionTime
    FROM testScenarios s
    LEFT JOIN testExecutions e ON s.id = e.scenarioId
    GROUP BY s.id, s.name, s.scenarioType
    HAVING totalExecutions > 0
    ORDER BY totalExecutions DESC
  `;

  const results = await db.execute(query, []) as any[];

  return results.map((row: any) => ({
    scenarioId: row.scenarioId,
    scenarioName: row.scenarioName,
    scenarioType: row.scenarioType,
    totalExecutions: row.totalExecutions,
    successfulExecutions: row.successfulExecutions,
    failedExecutions: row.failedExecutions,
    successRate: row.totalExecutions > 0 
      ? (row.successfulExecutions / row.totalExecutions) * 100 
      : 0,
    averageExecutionTime: Math.round(row.averageExecutionTime || 0)
  }));
}

/**
 * Get test results summary
 */
export async function getTestResultSummary(executionId?: number): Promise<TestResultSummary> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let query = `
    SELECT 
      COUNT(*) as totalTests,
      SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) as passedTests,
      SUM(CASE WHEN passed = 0 THEN 1 ELSE 0 END) as failedTests,
      testType,
      SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) as typePassed,
      SUM(CASE WHEN passed = 0 THEN 1 ELSE 0 END) as typeFailed
    FROM testResults
  `;

  const params: any[] = [];
  if (executionId) {
    query += ` WHERE executionId = ?`;
    params.push(executionId);
  }

  query += ` GROUP BY testType`;

  const results = await db.execute(query, params) as any[];

  const testsByType: Record<string, { passed: number; failed: number; total: number }> = {};
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const row of results) {
    totalTests += row.totalTests;
    passedTests += row.passedTests;
    failedTests += row.failedTests;

    testsByType[row.testType] = {
      passed: row.typePassed,
      failed: row.typeFailed,
      total: row.typePassed + row.typeFailed
    };
  }

  return {
    totalTests,
    passedTests,
    failedTests,
    successRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0,
    testsByType
  };
}

/**
 * Get recent execution summary
 */
export async function getRecentExecutionSummary(limit: number = 10): Promise<{
  executionId: number;
  scenarioName: string;
  status: string;
  createdAt: Date;
  executionTime: number | null;
  testCandidatesCount: number;
  testJobsCount: number;
  testApplicationsCount: number;
}[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const query = `
    SELECT 
      e.id as executionId,
      s.name as scenarioName,
      e.status,
      e.createdAt,
      TIMESTAMPDIFF(SECOND, e.startedAt, e.completedAt) as executionTime,
      e.testCandidatesCount,
      e.testJobsCount,
      e.testApplicationsCount
    FROM testExecutions e
    JOIN testScenarios s ON e.scenarioId = s.id
    ORDER BY e.createdAt DESC
    LIMIT ?
  `;

  const results = await db.execute(query, [limit]) as any[];

  return results.map((row: any) => ({
    executionId: row.executionId,
    scenarioName: row.scenarioName,
    status: row.status,
    createdAt: row.createdAt,
    executionTime: row.executionTime,
    testCandidatesCount: row.testCandidatesCount || 0,
    testJobsCount: row.testJobsCount || 0,
    testApplicationsCount: row.testApplicationsCount || 0
  }));
}

/**
 * Get overall statistics
 */
export async function getOverallStats(): Promise<{
  totalScenarios: number;
  activeScenarios: number;
  totalExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  totalTestData: number;
  totalTestResults: number;
  overallSuccessRate: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const scenariosQuery = `
    SELECT 
      COUNT(*) as totalScenarios,
      SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END) as activeScenarios
    FROM testScenarios
  `;

  const executionsQuery = `
    SELECT 
      COUNT(*) as totalExecutions,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedExecutions,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failedExecutions
    FROM testExecutions
  `;

  const dataQuery = `SELECT COUNT(*) as totalTestData FROM testData`;
  const resultsQuery = `SELECT COUNT(*) as totalTestResults FROM testResults`;

  const [scenarios, executions, data, results] = await Promise.all([
    db.execute(scenariosQuery, []) as Promise<any[]>,
    db.execute(executionsQuery, []) as Promise<any[]>,
    db.execute(dataQuery, []) as Promise<any[]>,
    db.execute(resultsQuery, []) as Promise<any[]>
  ]);

  const scenarioRow = scenarios[0] || {};
  const executionRow = executions[0] || {};
  const dataRow = data[0] || {};
  const resultsRow = results[0] || {};

  const totalExecutions = executionRow.totalExecutions || 0;
  const completedExecutions = executionRow.completedExecutions || 0;

  return {
    totalScenarios: scenarioRow.totalScenarios || 0,
    activeScenarios: scenarioRow.activeScenarios || 0,
    totalExecutions,
    completedExecutions,
    failedExecutions: executionRow.failedExecutions || 0,
    totalTestData: dataRow.totalTestData || 0,
    totalTestResults: resultsRow.totalTestResults || 0,
    overallSuccessRate: totalExecutions > 0 ? (completedExecutions / totalExecutions) * 100 : 0
  };
}
