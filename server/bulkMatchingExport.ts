import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { jobs, candidates } from "../drizzle/schema";
import { calculateAIMatch } from "./aiMatching";

export interface BulkMatchJob {
  jobId: number;
  jobTitle: string;
  candidateMatches: Array<{
    candidateId: number;
    candidateName: string;
    candidateEmail: string;
    overallScore: number;
    technicalScore: number;
    cultureFitScore: number;
    wellbeingScore: number;
    burnoutRisk: number;
    explanation: string;
  }>;
}

export async function runBulkMatching(jobIds: number[], topN: number = 20): Promise<BulkMatchJob[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const results: BulkMatchJob[] = [];

  // Get all candidates once
  const allCandidates = await db.select().from(candidates);

  // Process each job
  for (const jobId of jobIds) {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    
    if (!job) continue;

    const candidateMatches = [];

    // Match each candidate against this job
    for (const candidate of allCandidates) {
      try {
        const match = await calculateAIMatch(jobId, candidate.id);
        
        candidateMatches.push({
          candidateId: candidate.id,
          candidateName: candidate.name || "Unknown",
          candidateEmail: candidate.email || "",
          overallScore: match.overallScore,
          technicalScore: match.technicalScore || 0,
          cultureFitScore: match.cultureFitScore || 0,
          wellbeingScore: match.wellbeingScore || 0,
          burnoutRisk: match.burnoutRisk || 0,
          explanation: match.explanation || "",
        });
      } catch (error) {
        console.error(`Failed to match candidate ${candidate.id} with job ${jobId}:`, error);
      }
    }

    // Sort by overall score descending
    candidateMatches.sort((a, b) => b.overallScore - a.overallScore);

    results.push({
      jobId,
      jobTitle: job.title,
      candidateMatches: candidateMatches.slice(0, topN),
    });
  }

  return results;
}

export function generateMatchCSV(bulkResults: BulkMatchJob[]): string {
  const rows: string[] = [
    "Job ID,Job Title,Candidate ID,Candidate Name,Candidate Email,Overall Score,Technical Score,Culture Fit Score,Wellbeing Score,Burnout Risk"
  ];

  for (const jobResult of bulkResults) {
    for (const match of jobResult.candidateMatches) {
      rows.push([
        jobResult.jobId,
        `"${jobResult.jobTitle.replace(/"/g, '""')}"`,
        match.candidateId,
        `"${match.candidateName.replace(/"/g, '""')}"`,
        match.candidateEmail,
        match.overallScore,
        match.technicalScore,
        match.cultureFitScore,
        match.wellbeingScore,
        match.burnoutRisk,
      ].join(","));
    }
  }

  return rows.join("\n");
}

export function generateMatchPDFHTML(bulkResults: BulkMatchJob[]): string {
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    h1 {
      color: #1a56db;
      border-bottom: 3px solid #1a56db;
      padding-bottom: 10px;
    }
    h2 {
      color: #374151;
      margin-top: 30px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 12px;
    }
    th {
      background-color: #f3f4f6;
      padding: 10px 8px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #d1d5db;
    }
    td {
      padding: 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    .score-high {
      color: #059669;
      font-weight: 600;
    }
    .score-medium {
      color: #d97706;
      font-weight: 600;
    }
    .score-low {
      color: #dc2626;
      font-weight: 600;
    }
    .summary {
      background-color: #eff6ff;
      padding: 15px;
      border-left: 4px solid #1a56db;
      margin: 20px 0;
    }
    .page-break {
      page-break-after: always;
    }
  </style>
</head>
<body>
  <h1>Bulk AI Matching Results</h1>
  <div class="summary">
    <strong>Report Generated:</strong> ${new Date().toLocaleString()}<br>
    <strong>Total Jobs Analyzed:</strong> ${bulkResults.length}<br>
    <strong>Total Matches:</strong> ${bulkResults.reduce((sum, job) => sum + job.candidateMatches.length, 0)}
  </div>
`;

  bulkResults.forEach((jobResult, jobIndex) => {
    html += `
  <h2>Job ${jobIndex + 1}: ${jobResult.jobTitle} (ID: ${jobResult.jobId})</h2>
  <table>
    <thead>
      <tr>
        <th>Rank</th>
        <th>Candidate</th>
        <th>Email</th>
        <th>Overall</th>
        <th>Technical</th>
        <th>Culture</th>
        <th>Wellbeing</th>
        <th>Burnout</th>
      </tr>
    </thead>
    <tbody>
`;

    jobResult.candidateMatches.forEach((match, index) => {
      const scoreClass = match.overallScore >= 80 ? 'score-high' : 
                        match.overallScore >= 60 ? 'score-medium' : 'score-low';
      
      html += `
      <tr>
        <td>${index + 1}</td>
        <td>${match.candidateName}</td>
        <td>${match.candidateEmail}</td>
        <td class="${scoreClass}">${match.overallScore}%</td>
        <td>${match.technicalScore}%</td>
        <td>${match.cultureFitScore}%</td>
        <td>${match.wellbeingScore}%</td>
        <td>${match.burnoutRisk}%</td>
      </tr>
`;
    });

    html += `
    </tbody>
  </table>
`;

    // Add page break after each job except the last one
    if (jobIndex < bulkResults.length - 1) {
      html += '<div class="page-break"></div>';
    }
  });

  html += `
</body>
</html>
`;

  return html;
}
