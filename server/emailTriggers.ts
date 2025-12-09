import { getDb } from "./db";
import { candidates } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Email Trigger System for Pipeline Automation
 * Handles automated email sending for various pipeline events
 */

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

// Email templates for different automation scenarios
export const emailTemplates: Record<string, EmailTemplate> = {
  auto_rejection: {
    id: "auto_rejection",
    name: "Auto-Rejection Notification",
    subject: "Update on Your Application",
    body: `
Dear {{candidateName}},

Thank you for your interest in the {{positionTitle}} position at our company.

After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.

We appreciate the time you invested in the application process and wish you the best in your job search.

Best regards,
{{companyName}} Recruitment Team
    `.trim(),
    variables: ["candidateName", "positionTitle", "companyName"],
  },
  
  screening_follow_up: {
    id: "screening_follow_up",
    name: "Post-Screening Follow-up",
    subject: "Next Steps in Your Application",
    body: `
Dear {{candidateName}},

Thank you for completing the screening process for the {{positionTitle}} position.

We're currently reviewing all applications and will be in touch within the next few days regarding next steps.

If you have any questions in the meantime, please don't hesitate to reach out.

Best regards,
{{companyName}} Recruitment Team
    `.trim(),
    variables: ["candidateName", "positionTitle", "companyName"],
  },
  
  interview_reminder: {
    id: "interview_reminder",
    name: "Interview Reminder",
    subject: "Reminder: Interview Tomorrow",
    body: `
Dear {{candidateName}},

This is a friendly reminder about your interview scheduled for tomorrow:

Date & Time: {{interviewDateTime}}
Duration: {{interviewDuration}} minutes
Location: {{interviewLocation}}
Interviewer: {{interviewerName}}

Please arrive 10 minutes early and bring a copy of your resume.

If you need to reschedule, please let us know as soon as possible.

Best regards,
{{companyName}} Recruitment Team
    `.trim(),
    variables: [
      "candidateName",
      "interviewDateTime",
      "interviewDuration",
      "interviewLocation",
      "interviewerName",
      "companyName",
    ],
  },
  
  feedback_reminder: {
    id: "feedback_reminder",
    name: "Feedback Submission Reminder",
    subject: "Action Required: Submit Interview Feedback",
    body: `
Dear {{interviewerName}},

This is a reminder to submit your feedback for the interview with {{candidateName}} that took place on {{interviewDate}}.

Timely feedback is crucial for maintaining a positive candidate experience and making informed hiring decisions.

Please submit your feedback at your earliest convenience:
{{feedbackLink}}

Thank you for your cooperation.

Best regards,
Recruitment Team
    `.trim(),
    variables: [
      "interviewerName",
      "candidateName",
      "interviewDate",
      "feedbackLink",
    ],
  },
  
  offer_extended: {
    id: "offer_extended",
    name: "Job Offer Extended",
    subject: "Congratulations! Job Offer from {{companyName}}",
    body: `
Dear {{candidateName}},

We are pleased to extend an offer for the {{positionTitle}} position at {{companyName}}.

After careful consideration of your qualifications and interview performance, we believe you would be an excellent addition to our team.

Please review the attached offer letter for details regarding:
- Start date
- Compensation and benefits
- Terms and conditions

We would appreciate your response within {{responseDeadline}} days.

If you have any questions, please don't hesitate to contact us.

Congratulations again, and we look forward to welcoming you to the team!

Best regards,
{{companyName}} Recruitment Team
    `.trim(),
    variables: [
      "candidateName",
      "positionTitle",
      "companyName",
      "responseDeadline",
    ],
  },
};

/**
 * Render email template with variables
 */
export function renderTemplate(
  templateId: string,
  variables: Record<string, string>
): { subject: string; body: string } | null {
  const template = emailTemplates[templateId];
  if (!template) {
    console.error(`[Email Triggers] Template not found: ${templateId}`);
    return null;
  }

  let subject = template.subject;
  let body = template.body;

  // Replace variables
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    subject = subject.replace(new RegExp(placeholder, "g"), value);
    body = body.replace(new RegExp(placeholder, "g"), value);
  }

  return { subject, body };
}

/**
 * Send email for pipeline automation event
 */
export async function sendAutomationEmail(
  candidateId: number,
  templateId: string,
  variables: Record<string, string>
): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Email Triggers] Database not available");
    return false;
  }

  try {
    // Get candidate details
    const candidateResults = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, candidateId))
      .limit(1);

    if (candidateResults.length === 0) {
      console.error(`[Email Triggers] Candidate not found: ${candidateId}`);
      return false;
    }

    const candidate = candidateResults[0];

    // Render template
    const email = renderTemplate(templateId, {
      candidateName: candidate.fullName,
      ...variables,
    });

    if (!email) {
      return false;
    }

    // In a real implementation, this would integrate with an email service
    // For now, we'll log the email
    console.log(`[Email Triggers] Sending email to ${candidate.email}`);
    console.log(`Subject: ${email.subject}`);
    console.log(`Body:\n${email.body}`);

    // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
    // await emailService.send({
    //   to: candidate.email,
    //   subject: email.subject,
    //   body: email.body,
    // });

    return true;
  } catch (error) {
    console.error(`[Email Triggers] Error sending email:`, error);
    return false;
  }
}

/**
 * Queue email for batch sending
 */
interface EmailQueue {
  candidateId: number;
  templateId: string;
  variables: Record<string, string>;
  scheduledFor: Date;
}

const emailQueue: EmailQueue[] = [];

export function queueEmail(
  candidateId: number,
  templateId: string,
  variables: Record<string, string>,
  scheduledFor: Date = new Date()
): void {
  emailQueue.push({
    candidateId,
    templateId,
    variables,
    scheduledFor,
  });

  console.log(
    `[Email Triggers] Queued email ${templateId} for candidate ${candidateId}`
  );
}

/**
 * Process queued emails
 */
export async function processEmailQueue(): Promise<{
  sent: number;
  failed: number;
}> {
  let sent = 0;
  let failed = 0;

  const now = new Date();
  const toProcess = emailQueue.filter((email) => email.scheduledFor <= now);

  for (const email of toProcess) {
    try {
      const success = await sendAutomationEmail(
        email.candidateId,
        email.templateId,
        email.variables
      );

      if (success) {
        sent++;
        // Remove from queue
        const index = emailQueue.indexOf(email);
        if (index > -1) {
          emailQueue.splice(index, 1);
        }
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`[Email Triggers] Error processing queued email:`, error);
      failed++;
    }
  }

  return { sent, failed };
}

/**
 * Get available email templates
 */
export function getEmailTemplates(): EmailTemplate[] {
  return Object.values(emailTemplates);
}

/**
 * Get template by ID
 */
export function getEmailTemplate(templateId: string): EmailTemplate | null {
  return emailTemplates[templateId] || null;
}
