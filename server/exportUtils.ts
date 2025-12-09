/**
 * Export Utilities
 * Provides CSV and PDF export functionality for analytics and candidate data
 */

/**
 * Convert array of objects to CSV format
 */
export function convertToCSV(data: Record<string, any>[], headers?: string[]): string {
  if (data.length === 0) {
    return "";
  }

  // Use provided headers or extract from first object
  const columnHeaders = headers || Object.keys(data[0]);

  // Create CSV header row
  const headerRow = columnHeaders.map(escapeCSVValue).join(",");

  // Create data rows
  const dataRows = data.map((row) => {
    return columnHeaders
      .map((header) => {
        const value = row[header];
        return escapeCSVValue(value);
      })
      .join(",");
  });

  return [headerRow, ...dataRows].join("\n");
}

/**
 * Escape and format a value for CSV
 */
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }

  // Convert to string
  let stringValue = String(value);

  // Handle dates
  if (value instanceof Date) {
    stringValue = value.toISOString();
  }

  // Handle arrays and objects
  if (typeof value === "object" && !(value instanceof Date)) {
    stringValue = JSON.stringify(value);
  }

  // Escape quotes and wrap in quotes if necessary
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    stringValue = `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Generate PDF from HTML content using WeasyPrint
 * Note: This requires WeasyPrint to be installed in the environment
 */
export async function generatePDFFromHTML(html: string): Promise<Buffer> {
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const fs = await import("fs");
  const path = await import("path");
  const os = await import("os");

  const execAsync = promisify(exec);

  // Create temporary files
  const tempDir = os.tmpdir();
  const htmlFile = path.join(tempDir, `export-${Date.now()}.html`);
  const pdfFile = path.join(tempDir, `export-${Date.now()}.pdf`);

  try {
    // Write HTML to temp file
    await fs.promises.writeFile(htmlFile, html, "utf8");

    // Convert HTML to PDF using WeasyPrint
    await execAsync(`weasyprint ${htmlFile} ${pdfFile}`);

    // Read PDF file
    const pdfBuffer = await fs.promises.readFile(pdfFile);

    // Clean up temp files
    await fs.promises.unlink(htmlFile).catch(() => {});
    await fs.promises.unlink(pdfFile).catch(() => {});

    return pdfBuffer;
  } catch (error) {
    // Clean up on error
    await fs.promises.unlink(htmlFile).catch(() => {});
    await fs.promises.unlink(pdfFile).catch(() => {});
    throw error;
  }
}

/**
 * Generate HTML template for analytics PDF export
 */
export function generateAnalyticsPDFHTML(data: {
  title: string;
  generatedAt: string;
  metrics: Array<{ label: string; value: string | number }>;
  charts?: Array<{ title: string; description: string }>;
}): string {
  const { title, generatedAt, metrics, charts = [] } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 40px;
      background: #ffffff;
    }
    
    .header {
      border-bottom: 3px solid #667eea;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .header h1 {
      font-size: 32px;
      color: #1a202c;
      margin-bottom: 10px;
    }
    
    .header .meta {
      color: #718096;
      font-size: 14px;
    }
    
    .metrics {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 40px;
    }
    
    .metric-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      background: #f7fafc;
    }
    
    .metric-card .label {
      font-size: 14px;
      color: #718096;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .metric-card .value {
      font-size: 28px;
      font-weight: 600;
      color: #1a202c;
    }
    
    .section {
      margin-bottom: 40px;
    }
    
    .section h2 {
      font-size: 24px;
      color: #1a202c;
      margin-bottom: 20px;
      border-left: 4px solid #667eea;
      padding-left: 15px;
    }
    
    .chart-placeholder {
      border: 2px dashed #cbd5e0;
      border-radius: 8px;
      padding: 40px;
      text-align: center;
      color: #718096;
      background: #f7fafc;
      margin-bottom: 20px;
    }
    
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #a0aec0;
      font-size: 12px;
    }
    
    @page {
      size: A4;
      margin: 2cm;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <div class="meta">Generated on ${generatedAt}</div>
  </div>
  
  <div class="metrics">
    ${metrics
      .map(
        (metric) => `
      <div class="metric-card">
        <div class="label">${metric.label}</div>
        <div class="value">${metric.value}</div>
      </div>
    `
      )
      .join("")}
  </div>
  
  ${
    charts.length > 0
      ? `
  <div class="section">
    <h2>Visualizations</h2>
    ${charts
      .map(
        (chart) => `
      <div class="chart-placeholder">
        <h3>${chart.title}</h3>
        <p>${chart.description}</p>
      </div>
    `
      )
      .join("")}
  </div>
  `
      : ""
  }
  
  <div class="footer">
    <p>Oracle Smart Recruitment System - Analytics Report</p>
    <p>This report was automatically generated and contains confidential information.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate HTML template for candidates list PDF export
 */
export function generateCandidatesPDFHTML(data: {
  title: string;
  generatedAt: string;
  candidates: Array<{
    name: string;
    email: string;
    skills: string[];
    experience: number;
    location: string;
    status: string;
  }>;
}): string {
  const { title, generatedAt, candidates } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 40px;
      background: #ffffff;
    }
    
    .header {
      border-bottom: 3px solid #667eea;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .header h1 {
      font-size: 32px;
      color: #1a202c;
      margin-bottom: 10px;
    }
    
    .header .meta {
      color: #718096;
      font-size: 14px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    thead {
      background: #f7fafc;
    }
    
    th {
      text-align: left;
      padding: 12px;
      font-weight: 600;
      color: #1a202c;
      border-bottom: 2px solid #e2e8f0;
      font-size: 14px;
    }
    
    td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 13px;
    }
    
    tr:hover {
      background: #f7fafc;
    }
    
    .skills {
      font-size: 11px;
      color: #718096;
    }
    
    .status {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }
    
    .status.active {
      background: #c6f6d5;
      color: #22543d;
    }
    
    .status.inactive {
      background: #fed7d7;
      color: #742a2a;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #a0aec0;
      font-size: 12px;
    }
    
    @page {
      size: A4 landscape;
      margin: 2cm;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <div class="meta">Generated on ${generatedAt} | Total Candidates: ${candidates.length}</div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Skills</th>
        <th>Experience</th>
        <th>Location</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${candidates
        .map(
          (candidate) => `
        <tr>
          <td><strong>${candidate.name}</strong></td>
          <td>${candidate.email}</td>
          <td class="skills">${candidate.skills.slice(0, 3).join(", ")}${candidate.skills.length > 3 ? "..." : ""}</td>
          <td>${candidate.experience} years</td>
          <td>${candidate.location}</td>
          <td><span class="status ${candidate.status.toLowerCase()}">${candidate.status}</span></td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>
  
  <div class="footer">
    <p>Oracle Smart Recruitment System - Candidates Report</p>
    <p>This report contains confidential candidate information.</p>
  </div>
</body>
</html>
  `.trim();
}
