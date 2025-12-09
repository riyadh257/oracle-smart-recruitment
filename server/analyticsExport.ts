import { getTalentPoolAnalyticsDashboard } from "./talentPoolAnalytics";

/**
 * Analytics Export Service
 * Handles PDF and CSV export for analytics dashboards
 */

export interface ExportOptions {
  format: "pdf" | "csv";
  employerId: number;
  includeCharts?: boolean;
}

/**
 * Export analytics to CSV format
 */
export async function exportAnalyticsToCSV(employerId: number): Promise<string> {
  const analytics = await getTalentPoolAnalyticsDashboard(employerId);
  
  let csv = "";
  
  // Metrics section
  csv += "Talent Pool Metrics\n";
  csv += "Metric,Value\n";
  csv += `Total Candidates,${analytics.metrics.totalCandidates}\n`;
  csv += `Active Candidates,${analytics.metrics.activeCandidates}\n`;
  csv += `Contacted Candidates,${analytics.metrics.contactedCandidates}\n`;
  csv += `Hired Candidates,${analytics.metrics.hiredCandidates}\n`;
  csv += `Average Match Score,${analytics.metrics.averageMatchScore}%\n`;
  csv += `Growth Rate (30 days),${analytics.metrics.growthRate}%\n`;
  csv += `Conversion Rate,${analytics.metrics.conversionRate}%\n`;
  csv += `Engagement Rate,${analytics.metrics.engagementRate}%\n`;
  csv += "\n";
  
  // Growth data
  csv += "Growth Over Time (Last 90 Days)\n";
  csv += "Date,New Candidates,Cumulative Total\n";
  analytics.growth.forEach((day: any) => {
    csv += `${day.date},${day.count},${day.cumulative}\n`;
  });
  csv += "\n";
  
  // Conversion funnel
  csv += "Conversion Funnel\n";
  csv += "Stage,Count,Percentage\n";
  analytics.funnel.forEach((stage: any) => {
    csv += `${stage.stage},${stage.count},${stage.percentage}%\n`;
  });
  csv += "\n";
  
  // Skills distribution
  csv += "Top Skills Distribution\n";
  csv += "Skill,Count\n";
  analytics.skills.forEach((skill: any) => {
    csv += `${skill.skill},${skill.count}\n`;
  });
  csv += "\n";
  
  // Match score distribution
  csv += "Match Score Distribution\n";
  csv += "Range,Count\n";
  analytics.matchScores.forEach((range: any) => {
    csv += `${range.range},${range.count}\n`;
  });
  
  return csv;
}

/**
 * Export analytics to PDF format (simplified HTML version)
 * Note: For production, consider using a proper PDF library like puppeteer or pdfkit
 */
export async function exportAnalyticsToPDF(employerId: number): Promise<string> {
  const analytics = await getTalentPoolAnalyticsDashboard(employerId);
  
  // Generate HTML that can be converted to PDF
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Talent Pool Analytics Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      color: #2563eb;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 10px;
    }
    h2 {
      color: #1e40af;
      margin-top: 30px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 5px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin: 20px 0;
    }
    .metric-card {
      background: #f3f4f6;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #2563eb;
    }
    .metric-label {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 5px;
    }
    .metric-value {
      font-size: 32px;
      font-weight: bold;
      color: #1f2937;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background-color: #f3f4f6;
      font-weight: bold;
      color: #1f2937;
    }
    tr:hover {
      background-color: #f9fafb;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <h1>Talent Pool Analytics Report</h1>
  <p>Generated on: ${new Date().toLocaleDateString()}</p>
  
  <h2>Key Metrics</h2>
  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-label">Total Candidates</div>
      <div class="metric-value">${analytics.metrics.totalCandidates}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Growth Rate (30 days)</div>
      <div class="metric-value">${analytics.metrics.growthRate}%</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Engagement Rate</div>
      <div class="metric-value">${analytics.metrics.engagementRate}%</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Conversion Rate</div>
      <div class="metric-value">${analytics.metrics.conversionRate}%</div>
    </div>
  </div>
  
  <h2>Conversion Funnel</h2>
  <table>
    <thead>
      <tr>
        <th>Stage</th>
        <th>Count</th>
        <th>Percentage</th>
      </tr>
    </thead>
    <tbody>
      ${analytics.funnel.map((stage: any) => `
        <tr>
          <td>${stage.stage}</td>
          <td>${stage.count}</td>
          <td>${stage.percentage}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <h2>Top Skills</h2>
  <table>
    <thead>
      <tr>
        <th>Skill</th>
        <th>Count</th>
      </tr>
    </thead>
    <tbody>
      ${analytics.skills.slice(0, 10).map((skill: any) => `
        <tr>
          <td>${skill.skill}</td>
          <td>${skill.count}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <h2>Match Score Distribution</h2>
  <table>
    <thead>
      <tr>
        <th>Range</th>
        <th>Count</th>
      </tr>
    </thead>
    <tbody>
      ${analytics.matchScores.map((range: any) => `
        <tr>
          <td>${range.range}</td>
          <td>${range.count}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <h2>Growth Summary</h2>
  <p>
    <strong>Average Match Score:</strong> ${analytics.metrics.averageMatchScore}%<br>
    <strong>Active Candidates:</strong> ${analytics.metrics.activeCandidates}<br>
    <strong>Contacted:</strong> ${analytics.metrics.contactedCandidates}<br>
    <strong>Hired:</strong> ${analytics.metrics.hiredCandidates}
  </p>
  
  <div class="footer">
    <p>Oracle Smart Recruitment System - Talent Pool Analytics</p>
    <p>© ${new Date().getFullYear()} All rights reserved.</p>
  </div>
</body>
</html>`;
  
  return html;
}

/**
 * Generate filename for export
 */
export function generateExportFilename(employerId: number, format: "pdf" | "csv"): string {
  const timestamp = new Date().toISOString().split('T')[0];
  return `talent-pool-analytics-${employerId}-${timestamp}.${format}`;
}
