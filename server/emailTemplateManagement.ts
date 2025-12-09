import { getDb } from "./db";
import { emailTemplates, emailBranding, employers } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Email Template Management System
 * Handles template CRUD, preview, versioning, and approval workflow
 */

interface MergeField {
  key: string;
  label: string;
  example: string;
}

// Available merge fields for email templates
export const MERGE_FIELDS: Record<string, MergeField[]> = {
  interview_invite: [
    { key: "{{candidate_name}}", label: "Candidate Name", example: "John Doe" },
    { key: "{{company_name}}", label: "Company Name", example: "Acme Corp" },
    { key: "{{job_title}}", label: "Job Title", example: "Software Engineer" },
    { key: "{{interview_date}}", label: "Interview Date", example: "December 15, 2024" },
    { key: "{{interview_time}}", label: "Interview Time", example: "2:00 PM" },
    { key: "{{meeting_url}}", label: "Meeting URL", example: "https://meet.example.com/abc123" },
    { key: "{{interviewer_name}}", label: "Interviewer Name", example: "Jane Smith" },
  ],
  application_received: [
    { key: "{{candidate_name}}", label: "Candidate Name", example: "John Doe" },
    { key: "{{company_name}}", label: "Company Name", example: "Acme Corp" },
    { key: "{{job_title}}", label: "Job Title", example: "Software Engineer" },
    { key: "{{application_date}}", label: "Application Date", example: "December 10, 2024" },
  ],
  job_match: [
    { key: "{{candidate_name}}", label: "Candidate Name", example: "John Doe" },
    { key: "{{job_title}}", label: "Job Title", example: "Software Engineer" },
    { key: "{{company_name}}", label: "Company Name", example: "Acme Corp" },
    { key: "{{match_score}}", label: "Match Score", example: "95%" },
    { key: "{{job_url}}", label: "Job URL", example: "https://example.com/jobs/123" },
  ],
  rejection: [
    { key: "{{candidate_name}}", label: "Candidate Name", example: "John Doe" },
    { key: "{{company_name}}", label: "Company Name", example: "Acme Corp" },
    { key: "{{job_title}}", label: "Job Title", example: "Software Engineer" },
  ],
  offer: [
    { key: "{{candidate_name}}", label: "Candidate Name", example: "John Doe" },
    { key: "{{company_name}}", label: "Company Name", example: "Acme Corp" },
    { key: "{{job_title}}", label: "Job Title", example: "Software Engineer" },
    { key: "{{salary}}", label: "Salary", example: "$120,000" },
    { key: "{{start_date}}", label: "Start Date", example: "January 15, 2025" },
  ],
};

/**
 * Replace merge fields with sample or actual data
 */
export function replaceMergeFields(
  template: string,
  data: Record<string, string>
): string {
  let result = template;
  
  Object.entries(data).forEach(([key, value]) => {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(pattern, value);
  });
  
  return result;
}

/**
 * Generate preview HTML with branding applied
 */
export async function generateTemplatePreview(
  employerId: number,
  templateType: string,
  subject: string,
  bodyHtml: string
): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get employer branding
  const brandingResult = await db
    .select()
    .from(emailBranding)
    .where(eq(emailBranding.employerId, employerId))
    .limit(1);

  const branding = brandingResult[0] || {
    logoUrl: null,
    primaryColor: "#3B82F6",
    secondaryColor: "#1E40AF",
    fontFamily: "Arial, sans-serif",
    companyName: "Your Company",
    footerText: "© 2024 Your Company. All rights reserved.",
    socialLinks: {},
  };

  // Get sample merge field data
  const mergeFields = MERGE_FIELDS[templateType] || [];
  const sampleData: Record<string, string> = {};
  mergeFields.forEach((field) => {
    const key = field.key.replace(/\{\{|\}\}/g, '');
    sampleData[key] = field.example;
  });

  // Replace merge fields with sample data
  const previewSubject = replaceMergeFields(subject, sampleData);
  const previewBody = replaceMergeFields(bodyHtml, sampleData);

  // Wrap in branded template
  const previewHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: ${branding.fontFamily};
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .email-header {
      background-color: ${branding.primaryColor};
      color: #ffffff;
      padding: 30px 20px;
      text-align: center;
    }
    .email-logo {
      max-width: 200px;
      max-height: 80px;
      margin-bottom: 10px;
    }
    .email-subject {
      font-size: 14px;
      font-weight: bold;
      color: #666;
      padding: 15px 20px;
      background-color: #f9f9f9;
      border-bottom: 1px solid #e0e0e0;
    }
    .email-body {
      padding: 30px 20px;
      line-height: 1.6;
      color: #333;
    }
    .email-footer {
      background-color: ${branding.secondaryColor};
      color: #ffffff;
      padding: 20px;
      text-align: center;
      font-size: 12px;
    }
    .email-footer a {
      color: #ffffff;
      text-decoration: underline;
      margin: 0 10px;
    }
    .preview-banner {
      background-color: #FFA500;
      color: #ffffff;
      padding: 10px;
      text-align: center;
      font-weight: bold;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="preview-banner">
    📧 EMAIL PREVIEW - This is how your email will appear to recipients
  </div>
  <div class="email-container">
    <div class="email-header">
      ${branding.logoUrl ? `<img src="${branding.logoUrl}" alt="${branding.companyName}" class="email-logo">` : `<h1>${branding.companyName}</h1>`}
    </div>
    <div class="email-subject">
      Subject: ${previewSubject}
    </div>
    <div class="email-body">
      ${previewBody}
    </div>
    <div class="email-footer">
      <p>${branding.footerText}</p>
      ${Object.entries(branding.socialLinks || {}).map(([platform, url]) => 
        `<a href="${url}" target="_blank">${platform}</a>`
      ).join(' ')}
    </div>
  </div>
</body>
</html>
  `;

  return previewHtml;
}

/**
 * Create a new version of a template (versioning system)
 */
export async function createTemplateVersion(
  templateId: number,
  employerId: number,
  changes: {
    subject?: string;
    bodyHtml?: string;
    bodyText?: string;
  },
  changedBy: number,
  changeNotes?: string
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get current template
  const currentTemplate = await db
    .select()
    .from(emailTemplates)
    .where(and(
      eq(emailTemplates.id, templateId),
      eq(emailTemplates.employerId, employerId)
    ))
    .limit(1);

  if (!currentTemplate[0]) {
    throw new Error("Template not found");
  }

  // Create version record (simplified - store in JSON for now)
  // In production, you'd have a separate templateVersions table
  const versionData = {
    templateId,
    version: Date.now(),
    previousData: {
      subject: currentTemplate[0].subject,
      bodyHtml: currentTemplate[0].bodyHtml,
      bodyText: currentTemplate[0].bodyText,
    },
    newData: changes,
    changedBy,
    changeNotes,
    createdAt: new Date(),
  };

  // Update the template with new content
  await db
    .update(emailTemplates)
    .set({
      ...changes,
      updatedAt: new Date(),
    })
    .where(eq(emailTemplates.id, templateId));

  // Return version number (timestamp)
  return versionData.version;
}

/**
 * Get template by ID with branding
 */
export async function getTemplateWithBranding(
  templateId: number,
  employerId: number
): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const template = await db
    .select()
    .from(emailTemplates)
    .where(and(
      eq(emailTemplates.id, templateId),
      eq(emailTemplates.employerId, employerId)
    ))
    .limit(1);

  if (!template[0]) {
    throw new Error("Template not found");
  }

  const brandingResult = await db
    .select()
    .from(emailBranding)
    .where(eq(emailBranding.employerId, employerId))
    .limit(1);

  return {
    template: template[0],
    branding: brandingResult[0] || null,
    mergeFields: MERGE_FIELDS[template[0].type] || [],
  };
}

/**
 * List all templates for an employer
 */
export async function listEmployerTemplates(employerId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.employerId, employerId))
    .orderBy(desc(emailTemplates.updatedAt));
}

/**
 * Create default templates for a new employer
 */
export async function createDefaultTemplates(employerId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const defaultTemplates = [
    {
      employerId,
      name: "Interview Invitation",
      type: "interview_invite" as const,
      subject: "Interview Invitation - {{job_title}} at {{company_name}}",
      bodyHtml: `
        <p>Dear {{candidate_name}},</p>
        <p>We are pleased to invite you for an interview for the <strong>{{job_title}}</strong> position at {{company_name}}.</p>
        <p><strong>Interview Details:</strong></p>
        <ul>
          <li>Date: {{interview_date}}</li>
          <li>Time: {{interview_time}}</li>
          <li>Meeting Link: <a href="{{meeting_url}}">Join Interview</a></li>
        </ul>
        <p>Please confirm your availability at your earliest convenience.</p>
        <p>Best regards,<br>{{company_name}} Hiring Team</p>
      `,
      bodyText: "Dear {{candidate_name}}, We are pleased to invite you for an interview...",
      isDefault: true,
      isActive: true,
    },
    {
      employerId,
      name: "Application Received",
      type: "application_received" as const,
      subject: "Application Received - {{job_title}}",
      bodyHtml: `
        <p>Dear {{candidate_name}},</p>
        <p>Thank you for applying for the <strong>{{job_title}}</strong> position at {{company_name}}.</p>
        <p>We have received your application on {{application_date}} and our team will review it carefully.</p>
        <p>We will contact you if your qualifications match our requirements.</p>
        <p>Best regards,<br>{{company_name}} Recruitment Team</p>
      `,
      bodyText: "Dear {{candidate_name}}, Thank you for applying...",
      isDefault: true,
      isActive: true,
    },
  ];

  for (const template of defaultTemplates) {
    await db.insert(emailTemplates).values(template);
  }
}
