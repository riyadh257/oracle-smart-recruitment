import nodemailer from "nodemailer";
import { ENV } from "./_core/env";

/**
 * Weekly Analytics Reports Service
 * Generates and sends automated weekly analytics reports to employers
 */

export async function generateWeeklyReportEmail(employerId: number, analytics: any): Promise<string> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 30px 20px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    .metric-card {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #3B82F6;
    }
    .metric-label {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 5px;
      text-transform: uppercase;
    }
    .metric-value {
      font-size: 28px;
      font-weight: bold;
      color: #1f2937;
    }
    .section {
      margin: 30px 0;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 15px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 5px;
    }
    .insight {
      background: #eff6ff;
      border-left: 4px solid #3B82F6;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #3B82F6;
      color: white !important;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
      margin: 10px 0;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background-color: #f8f9fa;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Weekly Talent Pool Report</h1>
      <p style="margin: 5px 0 0 0; opacity: 0.9;">Week of ${new Date().toLocaleDateString()}</p>
    </div>
    
    <div class="content">
      <p>Here's your weekly talent pool performance summary:</p>
      
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Total Candidates</div>
          <div class="metric-value">${analytics.metrics.totalCandidates}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Growth Rate</div>
          <div class="metric-value">${analytics.metrics.growthRate > 0 ? '+' : ''}${analytics.metrics.growthRate}%</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Engagement</div>
          <div class="metric-value">${analytics.metrics.engagementRate}%</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Conversion</div>
          <div class="metric-value">${analytics.metrics.conversionRate}%</div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">📈 Key Insights</div>
        ${generateInsights(analytics)}
      </div>
      
      <div class="section">
        <div class="section-title">🎯 Top Skills in Your Pool</div>
        <table>
          <thead>
            <tr>
              <th>Skill</th>
              <th>Candidates</th>
            </tr>
          </thead>
          <tbody>
            ${analytics.skills.slice(0, 5).map((skill: any) => `
              <tr>
                <td>${skill.skill}</td>
                <td>${skill.count}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="section">
        <div class="section-title">🔄 Conversion Funnel</div>
        <table>
          <thead>
            <tr>
              <th>Stage</th>
              <th>Count</th>
              <th>Rate</th>
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
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="/employer/talent-pool/analytics" class="button">View Full Analytics Dashboard</a>
      </div>
    </div>
    
    <div class="footer">
      <p>Oracle Smart Recruitment System</p>
      <p>This is an automated weekly report. To manage your email preferences, visit your account settings.</p>
    </div>
  </div>
</body>
</html>`;
  
  return html;
}

function generateInsights(analytics: any): string {
  const insights: string[] = [];
  
  // Growth insight
  if (analytics.metrics.growthRate > 10) {
    insights.push(`<div class="insight">🚀 <strong>Strong Growth:</strong> Your talent pool grew by ${analytics.metrics.growthRate}% this month. Keep up the momentum!</div>`);
  } else if (analytics.metrics.growthRate < 0) {
    insights.push(`<div class="insight">⚠️ <strong>Declining Pool:</strong> Your talent pool decreased by ${Math.abs(analytics.metrics.growthRate)}%. Consider expanding your sourcing efforts.</div>`);
  }
  
  // Engagement insight
  if (analytics.metrics.engagementRate < 30) {
    insights.push(`<div class="insight">💡 <strong>Low Engagement:</strong> Only ${analytics.metrics.engagementRate}% of candidates have been contacted. Reach out to more candidates to improve conversion.</div>`);
  } else if (analytics.metrics.engagementRate > 70) {
    insights.push(`<div class="insight">✨ <strong>High Engagement:</strong> ${analytics.metrics.engagementRate}% engagement rate shows strong candidate outreach!</div>`);
  }
  
  // Conversion insight
  if (analytics.metrics.conversionRate > 5) {
    insights.push(`<div class="insight">🎯 <strong>Excellent Conversion:</strong> ${analytics.metrics.conversionRate}% of your talent pool has been hired. Great job!</div>`);
  }
  
  // Match score insight
  if (analytics.metrics.averageMatchScore >= 80) {
    insights.push(`<div class="insight">⭐ <strong>High Quality Pool:</strong> Average match score of ${analytics.metrics.averageMatchScore}% indicates excellent candidate quality.</div>`);
  }
  
  if (insights.length === 0) {
    insights.push(`<div class="insight">📊 Your talent pool is performing steadily. Continue engaging with candidates to improve conversion rates.</div>`);
  }
  
  return insights.join('');
}

export async function sendWeeklyAnalyticsEmail(
  recipientEmail: string,
  companyName: string,
  htmlContent: string
): Promise<void> {
  // Create transporter (using built-in SMTP or service)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: process.env.SMTP_USER ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    } : undefined,
  });
  
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@oracle-recruitment.com",
      to: recipientEmail,
      subject: `📊 Weekly Talent Pool Report - ${companyName}`,
      html: htmlContent,
    });
    
    console.log(`[Weekly Report] Sent to ${recipientEmail}`);
  } catch (error) {
    console.error(`[Weekly Report] Failed to send to ${recipientEmail}:`, error);
    throw error;
  }
}
