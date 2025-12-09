/**
 * Matching Digest Email Templates
 * Generate email digests for candidate matching notifications
 */

interface CandidateMatch {
  candidateId: number;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  overallMatchScore: number;
  technicalScore: number;
  cultureScore: number;
  wellbeingScore: number;
  topSkills: string[];
  experienceYears: number;
  location: string;
  availability: string;
}

interface MatchingDigestData {
  employerName: string;
  periodStart: Date;
  periodEnd: Date;
  totalMatches: number;
  highPriorityMatches: number;
  matches: CandidateMatch[];
  dashboardUrl: string;
}

/**
 * Generate HTML email for matching digest
 */
export function generateMatchingDigestEmail(data: MatchingDigestData, trackingId?: string): string {
  const periodText = `${data.periodStart.toLocaleDateString()} - ${data.periodEnd.toLocaleDateString()}`;
  
  // Generate tracking URLs
  const baseUrl = data.dashboardUrl;
  const trackingPixelUrl = trackingId ? `${baseUrl}/api/email/track/open/${trackingId}` : "";
  const getTrackedUrl = (url: string) => trackingId ? `${baseUrl}/api/email/track/click/${trackingId}?url=${encodeURIComponent(url)}` : url;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Candidate Matching Digest</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
      font-weight: 600;
    }
    .header p {
      margin: 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .summary {
      background-color: #f8f9fa;
      padding: 20px;
      border-bottom: 1px solid #e0e0e0;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-top: 15px;
    }
    .summary-item {
      background: white;
      padding: 15px;
      border-radius: 6px;
      text-align: center;
      border: 1px solid #e0e0e0;
    }
    .summary-item .number {
      font-size: 32px;
      font-weight: bold;
      color: #667eea;
      margin: 0;
    }
    .summary-item .label {
      font-size: 12px;
      color: #666;
      margin-top: 5px;
    }
    .content {
      padding: 20px;
    }
    .candidate-card {
      background: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      transition: box-shadow 0.2s;
    }
    .candidate-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .candidate-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 15px;
    }
    .candidate-info h3 {
      margin: 0 0 5px 0;
      font-size: 18px;
      color: #333;
    }
    .candidate-info .job-title {
      color: #666;
      font-size: 14px;
      margin: 0;
    }
    .match-score {
      text-align: center;
      min-width: 80px;
    }
    .match-score .score {
      font-size: 32px;
      font-weight: bold;
      color: #667eea;
      line-height: 1;
    }
    .match-score .label {
      font-size: 11px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .score-breakdown {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin: 15px 0;
    }
    .score-item {
      text-align: center;
      padding: 10px;
      background: #f8f9fa;
      border-radius: 6px;
    }
    .score-item .score-value {
      font-size: 20px;
      font-weight: 600;
      color: #333;
    }
    .score-item .score-label {
      font-size: 11px;
      color: #666;
      margin-top: 2px;
    }
    .candidate-details {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin: 15px 0;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 6px;
    }
    .detail-item {
      font-size: 13px;
    }
    .detail-item .label {
      color: #666;
      font-weight: 500;
    }
    .detail-item .value {
      color: #333;
      margin-left: 5px;
    }
    .skills {
      margin-top: 15px;
    }
    .skills-label {
      font-size: 12px;
      color: #666;
      font-weight: 500;
      margin-bottom: 8px;
    }
    .skill-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .skill-tag {
      background: #e8eaf6;
      color: #667eea;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    .priority-badge {
      display: inline-block;
      background: #ff6b6b;
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-left: 10px;
    }
    .cta-button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin-top: 10px;
      text-align: center;
    }
    .cta-button:hover {
      background: #5568d3;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #e0e0e0;
    }
    .footer p {
      margin: 5px 0;
      font-size: 12px;
      color: #666;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>🎯 Candidate Matching Digest</h1>
      <p>New matches for ${data.employerName}</p>
      <p>${periodText}</p>
    </div>

    <!-- Summary -->
    <div class="summary">
      <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #333;">Matching Summary</h2>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="number">${data.totalMatches}</div>
          <div class="label">Total Matches</div>
        </div>
        <div class="summary-item">
          <div class="number">${data.highPriorityMatches}</div>
          <div class="label">High Priority</div>
        </div>
      </div>
    </div>

    <!-- Candidate Matches -->
    <div class="content">
      <h2 style="margin: 0 0 20px 0; font-size: 18px; color: #333;">Top Candidate Matches</h2>
      
      ${data.matches.map((match) => `
        <div class="candidate-card">
          <div class="candidate-header">
            <div class="candidate-info">
              <h3>
                ${match.candidateName}
                ${match.overallMatchScore >= 80 ? '<span class="priority-badge">High Priority</span>' : ''}
              </h3>
              <p class="job-title">${match.jobTitle}</p>
            </div>
            <div class="match-score">
              <div class="score">${match.overallMatchScore}%</div>
              <div class="label">Match</div>
            </div>
          </div>

          <div class="score-breakdown">
            <div class="score-item">
              <div class="score-value">${match.technicalScore}%</div>
              <div class="score-label">Technical</div>
            </div>
            <div class="score-item">
              <div class="score-value">${match.cultureScore}%</div>
              <div class="score-label">Culture Fit</div>
            </div>
            <div class="score-item">
              <div class="score-value">${match.wellbeingScore}%</div>
              <div class="score-label">Wellbeing</div>
            </div>
          </div>

          <div class="candidate-details">
            <div class="detail-item">
              <span class="label">Experience:</span>
              <span class="value">${match.experienceYears} years</span>
            </div>
            <div class="detail-item">
              <span class="label">Location:</span>
              <span class="value">${match.location}</span>
            </div>
            <div class="detail-item">
              <span class="label">Email:</span>
              <span class="value">${match.candidateEmail}</span>
            </div>
            <div class="detail-item">
              <span class="label">Availability:</span>
              <span class="value">${match.availability}</span>
            </div>
          </div>

          ${match.topSkills.length > 0 ? `
            <div class="skills">
              <div class="skills-label">Top Skills</div>
              <div class="skill-tags">
                ${match.topSkills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
              </div>
            </div>
          ` : ''}

          <a href="${getTrackedUrl(`${data.dashboardUrl}/candidates/${match.candidateId}`)}" class="cta-button">View Full Profile</a>
        </div>
      `).join('')}

      ${data.matches.length === 0 ? `
        <div style="text-align: center; padding: 40px 20px; color: #666;">
          <p>No new matches found in this period.</p>
          <p style="font-size: 14px;">Adjust your matching preferences to receive more candidates.</p>
        </div>
      ` : ''}
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>Oracle Smart Recruitment System</strong></p>
      <p>
        <a href="${getTrackedUrl(`${data.dashboardUrl}/settings/matching-preferences`)}">Update Matching Preferences</a> |
        <a href="${getTrackedUrl(`${data.dashboardUrl}/settings/notifications`)}">Notification Settings</a>
      </p>
      ${trackingPixelUrl ? `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none" alt="" />` : ""}
      <p>You're receiving this email because you have matching notifications enabled.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version for email clients that don't support HTML
 */
export function generateMatchingDigestPlainText(data: MatchingDigestData, trackingId?: string): string {
  const periodText = `${data.periodStart.toLocaleDateString()} - ${data.periodEnd.toLocaleDateString()}`;
  
  // Generate tracking URLs
  const baseUrl = data.dashboardUrl;
  const getTrackedUrl = (url: string) => trackingId ? `${baseUrl}/api/email/track/click/${trackingId}?url=${encodeURIComponent(url)}` : url;

  let text = `
CANDIDATE MATCHING DIGEST
${data.employerName}
${periodText}

SUMMARY
-------
Total Matches: ${data.totalMatches}
High Priority: ${data.highPriorityMatches}

TOP CANDIDATE MATCHES
---------------------

`;

  data.matches.forEach((match, index) => {
    text += `
${index + 1}. ${match.candidateName}${match.overallMatchScore >= 80 ? ' [HIGH PRIORITY]' : ''}
   Job: ${match.jobTitle}
   Overall Match: ${match.overallMatchScore}%
   
   Score Breakdown:
   - Technical: ${match.technicalScore}%
   - Culture Fit: ${match.cultureScore}%
   - Wellbeing: ${match.wellbeingScore}%
   
   Details:
   - Experience: ${match.experienceYears} years
   - Location: ${match.location}
   - Email: ${match.candidateEmail}
   - Availability: ${match.availability}
   
   Top Skills: ${match.topSkills.join(', ')}
   
   View Profile: ${data.dashboardUrl}/candidates/${match.candidateId}

`;
  });

  if (data.matches.length === 0) {
    text += `
No new matches found in this period.
Adjust your matching preferences to receive more candidates.
`;
  }

  text += `
---
Oracle Smart Recruitment System
Update Matching Preferences: ${data.dashboardUrl}/settings/matching-preferences
Notification Settings: ${data.dashboardUrl}/settings/notifications
`;

  return text.trim();
}
