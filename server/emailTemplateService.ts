import * as db from "./db";
import { EmailTemplate, EmailBranding } from "../drizzle/schema";

/**
 * Email Template Service
 * Handles customizable email templates with merge fields and branding
 */

export interface MergeFields {
  candidateName?: string;
  candidateEmail?: string;
  employerName?: string;
  companyName?: string;
  jobTitle?: string;
  interviewDate?: string;
  interviewTime?: string;
  meetingUrl?: string;
  applicationStatus?: string;
  matchScore?: number;
  customFields?: Record<string, string>;
}

/**
 * Replace merge fields in template content
 */
export function replaceMergeFields(content: string, fields: MergeFields): string {
  let result = content;
  
  const replacements: Record<string, string> = {
    "{{candidateName}}": fields.candidateName || "[Candidate Name]",
    "{{candidateEmail}}": fields.candidateEmail || "[Candidate Email]",
    "{{employerName}}": fields.employerName || "[Employer Name]",
    "{{companyName}}": fields.companyName || "[Company Name]",
    "{{jobTitle}}": fields.jobTitle || "[Job Title]",
    "{{interviewDate}}": fields.interviewDate || "[Interview Date]",
    "{{interviewTime}}": fields.interviewTime || "[Interview Time]",
    "{{meetingUrl}}": fields.meetingUrl || "[Meeting URL]",
    "{{applicationStatus}}": fields.applicationStatus || "[Status]",
    "{{matchScore}}": fields.matchScore?.toString() || "[Match Score]",
  };
  
  // Replace standard merge fields
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(placeholder, "g"), value);
  }
  
  // Replace custom fields
  if (fields.customFields) {
    for (const [key, value] of Object.entries(fields.customFields)) {
      result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
    }
  }
  
  return result;
}

/**
 * Apply branding to email HTML
 */
export function applyBranding(htmlContent: string, branding: EmailBranding): string {
  let result = htmlContent;
  
  // Wrap content in branded template if not already wrapped
  if (!result.includes("<!DOCTYPE html>")) {
    result = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: ${branding.fontFamily};
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .email-header {
      background-color: ${branding.primaryColor};
      padding: 30px 20px;
      text-align: center;
    }
    .email-header img {
      max-width: 200px;
      height: auto;
    }
    .email-body {
      padding: 30px 20px;
    }
    .email-footer {
      background-color: #f8f8f8;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-top: 1px solid #e0e0e0;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: ${branding.primaryColor};
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
      margin: 10px 0;
    }
    .button:hover {
      background-color: ${branding.secondaryColor};
    }
    a {
      color: ${branding.primaryColor};
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      ${branding.logoUrl ? `<img src="${branding.logoUrl}" alt="${branding.companyName || 'Company Logo'}" />` : `<h1 style="color: white; margin: 0;">${branding.companyName || 'Company'}</h1>`}
    </div>
    <div class="email-body">
      ${result}
    </div>
    <div class="email-footer">
      ${branding.footerText || `© ${new Date().getFullYear()} ${branding.companyName || 'Company'}. All rights reserved.`}
      ${branding.socialLinks ? `
        <div style="margin-top: 10px;">
          ${Object.entries(branding.socialLinks).map(([platform, url]) => 
            `<a href="${url}" style="margin: 0 5px; color: #666;">${platform}</a>`
          ).join(' | ')}
        </div>
      ` : ''}
    </div>
  </div>
</body>
</html>`;
  }
  
  return result;
}

/**
 * Get default templates for common scenarios
 */
export function getDefaultTemplates(): Partial<EmailTemplate>[] {
  return [
    {
      name: "Interview Invitation",
      type: "interview_invite",
      subject: "Interview Invitation for {{jobTitle}} at {{companyName}}",
      bodyHtml: `
        <h2>You're Invited to Interview!</h2>
        <p>Dear {{candidateName}},</p>
        <p>We are pleased to invite you to interview for the <strong>{{jobTitle}}</strong> position at {{companyName}}.</p>
        <p><strong>Interview Details:</strong></p>
        <ul>
          <li>Date: {{interviewDate}}</li>
          <li>Time: {{interviewTime}}</li>
          <li>Meeting Link: <a href="{{meetingUrl}}">Join Interview</a></li>
        </ul>
        <p>Please confirm your attendance by replying to this email.</p>
        <a href="{{meetingUrl}}" class="button">Join Interview</a>
        <p>We look forward to speaking with you!</p>
        <p>Best regards,<br>{{employerName}}<br>{{companyName}}</p>
      `,
      bodyText: `Dear {{candidateName}},

We are pleased to invite you to interview for the {{jobTitle}} position at {{companyName}}.

Interview Details:
- Date: {{interviewDate}}
- Time: {{interviewTime}}
- Meeting Link: {{meetingUrl}}

Please confirm your attendance by replying to this email.

We look forward to speaking with you!

Best regards,
{{employerName}}
{{companyName}}`,
      isDefault: true,
    },
    {
      name: "Interview Reminder",
      type: "interview_reminder",
      subject: "Reminder: Interview Tomorrow for {{jobTitle}}",
      bodyHtml: `
        <h2>Interview Reminder</h2>
        <p>Dear {{candidateName}},</p>
        <p>This is a friendly reminder about your upcoming interview for the <strong>{{jobTitle}}</strong> position at {{companyName}}.</p>
        <p><strong>Interview Details:</strong></p>
        <ul>
          <li>Date: {{interviewDate}}</li>
          <li>Time: {{interviewTime}}</li>
          <li>Meeting Link: <a href="{{meetingUrl}}">Join Interview</a></li>
        </ul>
        <p>We recommend joining a few minutes early to test your connection.</p>
        <a href="{{meetingUrl}}" class="button">Join Interview</a>
        <p>See you soon!</p>
        <p>Best regards,<br>{{employerName}}<br>{{companyName}}</p>
      `,
      bodyText: `Dear {{candidateName}},

This is a friendly reminder about your upcoming interview for the {{jobTitle}} position at {{companyName}}.

Interview Details:
- Date: {{interviewDate}}
- Time: {{interviewTime}}
- Meeting Link: {{meetingUrl}}

We recommend joining a few minutes early to test your connection.

See you soon!

Best regards,
{{employerName}}
{{companyName}}`,
      isDefault: true,
    },
    {
      name: "Application Received",
      type: "application_received",
      subject: "Application Received for {{jobTitle}}",
      bodyHtml: `
        <h2>Application Received</h2>
        <p>Dear {{candidateName}},</p>
        <p>Thank you for applying to the <strong>{{jobTitle}}</strong> position at {{companyName}}.</p>
        <p>We have received your application and our team is currently reviewing it. We will be in touch soon regarding the next steps.</p>
        <p>In the meantime, feel free to learn more about our company and culture on our website.</p>
        <p>Best regards,<br>{{employerName}}<br>{{companyName}}</p>
      `,
      bodyText: `Dear {{candidateName}},

Thank you for applying to the {{jobTitle}} position at {{companyName}}.

We have received your application and our team is currently reviewing it. We will be in touch soon regarding the next steps.

Best regards,
{{employerName}}
{{companyName}}`,
      isDefault: true,
    },
    {
      name: "Job Match Notification",
      type: "job_match",
      subject: "New Job Match: {{jobTitle}} ({{matchScore}}% Match)",
      bodyHtml: `
        <h2>We Found a Great Match for You!</h2>
        <p>Dear {{candidateName}},</p>
        <p>Based on your profile and preferences, we found a job that matches your skills and experience:</p>
        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">{{jobTitle}}</h3>
          <p><strong>Company:</strong> {{companyName}}</p>
          <p><strong>Match Score:</strong> {{matchScore}}%</p>
        </div>
        <p>This position aligns well with your background. Would you like to apply?</p>
        <a href="#" class="button">View Job Details</a>
        <p>Best regards,<br>Oracle Smart Recruitment Team</p>
      `,
      bodyText: `Dear {{candidateName}},

Based on your profile and preferences, we found a job that matches your skills and experience:

Job Title: {{jobTitle}}
Company: {{companyName}}
Match Score: {{matchScore}}%

This position aligns well with your background. Would you like to apply?

Best regards,
Oracle Smart Recruitment Team`,
      isDefault: true,
    },
  ];
}

/**
 * Render email from template with merge fields and branding
 */
export async function renderEmail(
  templateId: number,
  mergeFields: MergeFields,
  employerId: number
): Promise<{ subject: string; html: string; text: string }> {
  const template = await db.getEmailTemplateById(templateId);
  if (!template) {
    throw new Error("Template not found");
  }
  
  const branding = await db.getEmailBrandingByEmployerId(employerId);
  
  // Replace merge fields in subject and body
  const subject = replaceMergeFields(template.subject, mergeFields);
  let html = replaceMergeFields(template.bodyHtml, mergeFields);
  const text = template.bodyText ? replaceMergeFields(template.bodyText, mergeFields) : "";
  
  // Apply branding if available
  if (branding) {
    html = applyBranding(html, branding);
  }
  
  return { subject, html, text };
}
