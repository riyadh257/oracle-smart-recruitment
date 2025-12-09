import nodemailer from "nodemailer";
import { getTemplateWithBranding, replaceMergeFields } from "./emailTemplateManagement";
import { sendGmailMessage, htmlToPlainText } from "./gmailIntegration";

/**
 * Email Delivery Service
 * Handles sending emails using SMTP or SendGrid
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

interface TemplateEmailOptions {
  to: string;
  templateId: number;
  mergeData: Record<string, string>;
  from?: string;
}

/**
 * Create email transporter
 * Supports both SMTP and SendGrid
 */
function createTransporter() {
  // Check if SendGrid API key is available
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransporter({
      host: "smtp.sendgrid.net",
      port: 587,
      secure: false,
      auth: {
        user: "apikey",
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  // Check if custom SMTP settings are available
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // For development: use Ethereal email (test email service)
  // In production, this should throw an error
  console.warn("[Email] No email service configured. Using test mode.");
  return null;
}

/**
 * Send a raw HTML email
 * Prioritizes Gmail MCP, falls back to SMTP/SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Try Gmail MCP first (if available)
    const useGmailMCP = process.env.USE_GMAIL_MCP !== "false"; // Default to true
    
    if (useGmailMCP) {
      try {
        const plainTextContent = htmlToPlainText(options.html);
        const gmailResult = await sendGmailMessage({
          to: [options.to],
          subject: options.subject,
          content: plainTextContent,
        });
        
        if (gmailResult.success) {
          console.log("[Email] Sent via Gmail MCP:", gmailResult.messageId);
          return gmailResult;
        }
        
        console.warn("[Email] Gmail MCP failed, falling back to SMTP:", gmailResult.error);
      } catch (gmailError) {
        console.warn("[Email] Gmail MCP error, falling back to SMTP:", gmailError);
      }
    }

    // Fallback to traditional SMTP/SendGrid
    const transporter = createTransporter();

    if (!transporter) {
      // In development mode without email config, log the email instead
      console.log("[Email] Would send email:", {
        to: options.to,
        subject: options.subject,
        htmlPreview: options.html.substring(0, 100) + "...",
      });
      return {
        success: true,
        messageId: `dev-${Date.now()}`,
      };
    }

    const info = await transporter.sendMail({
      from: options.from || process.env.SMTP_FROM || "noreply@oracle-recruitment.com",
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log("[Email] Sent via SMTP:", info.messageId);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("[Email] Failed to send:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send an email using a template
 */
export async function sendTemplateEmail(
  options: TemplateEmailOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Get template with branding
    const template = await getTemplateWithBranding(options.templateId);

    if (!template) {
      throw new Error("Template not found");
    }

    // Replace merge fields in subject and body
    const subject = replaceMergeFields(template.subject, options.mergeData);
    const bodyHtml = replaceMergeFields(template.bodyHtml, options.mergeData);

    // Apply branding wrapper
    const finalHtml = applyBrandingWrapper(bodyHtml, template.branding);

    // Send the email
    return await sendEmail({
      to: options.to,
      subject,
      html: finalHtml,
      from: options.from,
    });
  } catch (error) {
    console.error("[Email] Failed to send template email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Apply branding wrapper to email HTML
 */
function applyBrandingWrapper(bodyHtml: string, branding?: any): string {
  const logoUrl = branding?.logoUrl || "";
  const primaryColor = branding?.primaryColor || "#3B82F6";
  const companyName = branding?.companyName || "Oracle Smart Recruitment";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
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
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .email-header {
      background-color: ${primaryColor};
      padding: 20px;
      text-align: center;
    }
    .email-header img {
      max-width: 150px;
      height: auto;
    }
    .email-body {
      padding: 30px;
    }
    .email-footer {
      background-color: #f9f9f9;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-top: 1px solid #e0e0e0;
    }
    a {
      color: ${primaryColor};
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}">` : `<h1 style="color: white; margin: 0;">${companyName}</h1>`}
    </div>
    <div class="email-body">
      ${bodyHtml}
    </div>
    <div class="email-footer">
      <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
      <p>This email was sent by ${companyName} recruitment system.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Send interview invitation email
 */
export async function sendInterviewInvitation(data: {
  candidateEmail: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  interviewDate: string;
  interviewTime: string;
  meetingUrl: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const html = `
    <p>Dear ${data.candidateName},</p>
    
    <p>We are pleased to invite you for an interview for the <strong>${data.jobTitle}</strong> position at ${data.companyName}.</p>
    
    <p><strong>Interview Details:</strong></p>
    <ul>
      <li>Date: ${data.interviewDate}</li>
      <li>Time: ${data.interviewTime}</li>
      <li>Meeting Link: <a href="${data.meetingUrl}">Join Interview</a></li>
    </ul>
    
    <p>Please confirm your availability at your earliest convenience.</p>
    
    <p>Best regards,<br>${data.companyName} Hiring Team</p>
  `;

  return await sendEmail({
    to: data.candidateEmail,
    subject: `Interview Invitation - ${data.jobTitle} at ${data.companyName}`,
    html,
  });
}

/**
 * Send application received confirmation
 */
export async function sendApplicationConfirmation(data: {
  candidateEmail: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  applicationDate: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const html = `
    <p>Dear ${data.candidateName},</p>
    
    <p>Thank you for applying for the <strong>${data.jobTitle}</strong> position at ${data.companyName}.</p>
    
    <p>We have received your application on ${data.applicationDate} and our team will review it carefully.</p>
    
    <p>We will contact you if your qualifications match our requirements.</p>
    
    <p>Best regards,<br>${data.companyName} Recruitment Team</p>
  `;

  return await sendEmail({
    to: data.candidateEmail,
    subject: `Application Received - ${data.jobTitle}`,
    html,
  });
}

/**
 * Send job match notification
 */
export async function sendJobMatchNotification(data: {
  to: string;
  candidateName: string;
  jobTitle: string;
  jobId: number;
  matchScore: number;
  matchSummary: string;
  topSkills: string[];
  growthOpportunities: string[];
  companyName?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const jobUrl = `${process.env.VITE_APP_URL || 'http://localhost:3000'}/jobs/${data.jobId}`;
  const applyUrl = `${process.env.VITE_APP_URL || 'http://localhost:3000'}/jobs/${data.jobId}/apply`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .match-score { background: #10b981; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .match-score h2 { margin: 0; font-size: 36px; }
        .match-score p { margin: 5px 0 0 0; font-size: 14px; }
        .section { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; }
        .section h3 { margin-top: 0; color: #667eea; }
        .skills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
        .skill-badge { background: #e0e7ff; color: #4338ca; padding: 6px 12px; border-radius: 6px; font-size: 14px; }
        .cta-button { display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 10px 5px; }
        .cta-button:hover { background: #5568d3; }
        ul { padding-left: 20px; }
        li { margin: 8px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">🎯 New Top Job Match!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">A new opportunity that's perfect for you</p>
        </div>
        
        <div class="content">
          <p>Hi ${data.candidateName},</p>
          
          <p>Great news! We've found a new job opportunity that's an excellent match for your profile:</p>
          
          <div class="match-score">
            <h2>${data.matchScore}%</h2>
            <p>AI Match Score</p>
          </div>
          
          <div class="section">
            <h3>📋 ${data.jobTitle}</h3>
            ${data.companyName ? `<p><strong>Company:</strong> ${data.companyName}</p>` : ''}
            <p>${data.matchSummary}</p>
          </div>
          
          ${data.topSkills.length > 0 ? `
          <div class="section">
            <h3>✨ Your Matching Skills</h3>
            <div class="skills">
              ${data.topSkills.map(skill => `<span class="skill-badge">${skill}</span>`).join('')}
            </div>
          </div>
          ` : ''}
          
          ${data.growthOpportunities.length > 0 ? `
          <div class="section">
            <h3>🚀 Growth Opportunities</h3>
            <ul>
              ${data.growthOpportunities.map(opp => `<li>${opp}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${applyUrl}" class="cta-button">Apply Now</a>
            <a href="${jobUrl}" class="cta-button" style="background: #6b7280;">View Details</a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            This notification was sent because you have job match alerts enabled. 
            You can manage your notification preferences in your account settings.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: data.to,
    subject: `🎯 ${data.matchScore}% Match: ${data.jobTitle}`,
    html,
  });
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log("[Email] Running in development mode without email config");
      return true; // Allow development mode
    }

    await transporter.verify();
    console.log("[Email] Configuration verified successfully");
    return true;
  } catch (error) {
    console.error("[Email] Configuration verification failed:", error);
    return false;
  }
}
