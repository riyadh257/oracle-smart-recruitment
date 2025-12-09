import {
  getExecutionTrends,
  getPerformanceMetrics,
  getScenarioStats,
  getTestResultSummary,
  getRecentExecutionSummary,
  getOverallStats
} from "./automationTestingAnalytics";

/**
 * Automation Testing Export Module
 * Handles PDF and CSV export of analytics data
 */

/**
 * Generate CSV from analytics data
 */
export async function generateAnalyticsCSV(days: number = 30): Promise<string> {
  const [trends, performance, scenarioStats, testResults, recentExecutions, overallStats] = await Promise.all([
    getExecutionTrends(days),
    getPerformanceMetrics(),
    getScenarioStats(),
    getTestResultSummary(),
    getRecentExecutionSummary(20),
    getOverallStats()
  ]);

  let csv = "";

  // Overall Statistics Section
  csv += "OVERALL STATISTICS\n";
  csv += "Metric,Value\n";
  csv += `Total Scenarios,${overallStats.totalScenarios}\n`;
  csv += `Active Scenarios,${overallStats.activeScenarios}\n`;
  csv += `Total Executions,${overallStats.totalExecutions}\n`;
  csv += `Completed Executions,${overallStats.completedExecutions}\n`;
  csv += `Failed Executions,${overallStats.failedExecutions}\n`;
  csv += `Overall Success Rate,${overallStats.overallSuccessRate.toFixed(2)}%\n`;
  csv += `Total Test Data Records,${overallStats.totalTestData}\n`;
  csv += `Total Test Results,${overallStats.totalTestResults}\n`;
  csv += "\n";

  // Performance Metrics Section
  csv += "PERFORMANCE METRICS\n";
  csv += "Metric,Value\n";
  csv += `Average Execution Time,${performance.averageExecutionTime}s\n`;
  csv += `Average Candidates Generated,${performance.averageCandidatesGenerated}\n`;
  csv += `Average Jobs Generated,${performance.averageJobsGenerated}\n`;
  csv += `Average Applications Generated,${performance.averageApplicationsGenerated}\n`;
  csv += `Total Tests Run,${performance.totalTestsRun}\n`;
  csv += "\n";

  // Execution Trends Section
  csv += `EXECUTION TRENDS (Last ${days} Days)\n`;
  csv += "Date,Total Executions,Completed,Failed,Success Rate (%)\n";
  for (const trend of trends) {
    csv += `${trend.date},${trend.totalExecutions},${trend.completedExecutions},${trend.failedExecutions},${trend.successRate.toFixed(2)}\n`;
  }
  csv += "\n";

  // Scenario Statistics Section
  csv += "SCENARIO STATISTICS\n";
  csv += "Scenario Name,Type,Total Executions,Successful,Failed,Success Rate (%),Avg Execution Time (s)\n";
  for (const scenario of scenarioStats) {
    csv += `"${scenario.scenarioName}",${scenario.scenarioType},${scenario.totalExecutions},${scenario.successfulExecutions},${scenario.failedExecutions},${scenario.successRate.toFixed(2)},${scenario.averageExecutionTime}\n`;
  }
  csv += "\n";

  // Test Results Section
  csv += "TEST RESULTS SUMMARY\n";
  csv += "Metric,Value\n";
  csv += `Total Tests,${testResults.totalTests}\n`;
  csv += `Passed Tests,${testResults.passedTests}\n`;
  csv += `Failed Tests,${testResults.failedTests}\n`;
  csv += `Success Rate,${testResults.successRate.toFixed(2)}%\n`;
  csv += "\n";

  csv += "TEST RESULTS BY TYPE\n";
  csv += "Test Type,Passed,Failed,Total\n";
  for (const [type, stats] of Object.entries(testResults.testsByType)) {
    csv += `${type},${stats.passed},${stats.failed},${stats.total}\n`;
  }
  csv += "\n";

  // Recent Executions Section
  csv += "RECENT EXECUTIONS\n";
  csv += "Scenario Name,Status,Created At,Execution Time (s),Candidates,Jobs,Applications\n";
  for (const execution of recentExecutions) {
    const executionTime = execution.executionTime !== null ? execution.executionTime : "N/A";
    csv += `"${execution.scenarioName}",${execution.status},${new Date(execution.createdAt).toISOString()},${executionTime},${execution.testCandidatesCount},${execution.testJobsCount},${execution.testApplicationsCount}\n`;
  }

  return csv;
}

/**
 * Generate analytics report data for PDF generation
 */
export async function generateAnalyticsReportData(days: number = 30) {
  const [trends, performance, scenarioStats, testResults, recentExecutions, overallStats] = await Promise.all([
    getExecutionTrends(days),
    getPerformanceMetrics(),
    getScenarioStats(),
    getTestResultSummary(),
    getRecentExecutionSummary(10),
    getOverallStats()
  ]);

  return {
    generatedAt: new Date().toISOString(),
    period: `Last ${days} days`,
    overallStats,
    performance,
    trends,
    scenarioStats,
    testResults,
    recentExecutions
  };
}

/**
 * Format analytics data as JSON for client-side PDF generation
 */
export async function getAnalyticsExportData(days: number = 30) {
  return await generateAnalyticsReportData(days);
}
