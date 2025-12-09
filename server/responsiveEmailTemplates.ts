/**
 * Mobile-Responsive Email Templates
 * Optimized for 60%+ mobile email opens
 * 
 * Design principles:
 * - Single column layout for mobile
 * - Large touch-friendly buttons (min 44px height)
 * - Readable font sizes (min 14px body, 22px headings)
 * - Optimized images with max-width
 * - Tested on Gmail, Outlook, Apple Mail, Yahoo
 */

export interface EmailTemplateOptions {
  companyName?: string;
  companyLogo?: string;
  primaryColor?: string;
  trackingPixelUrl?: string;
}

/**
 * Base responsive email template
 * Provides consistent structure and styling
 */
function getBaseTemplate(content: string, options: EmailTemplateOptions = {}): string {
  const {
    companyName = "Oracle Smart Recruitment",
    companyLogo = "",
    primaryColor = "#0ea5e9",
    trackingPixelUrl = "",
  } = options;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${companyName}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
  <style>
    /* Reset styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    
    /* Base styles */
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f3f4f6;
    }
    
    /* Container */
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    
    /* Header */
    .header {
      background-color: ${primaryColor};
      padding: 24px 20px;
      text-align: center;
    }
    
    .logo {
      max-width: 180px;
      height: auto;
    }
    
    /* Content */
    .content {
      padding: 32px 20px;
      color: #374151;
      font-size: 16px;
      line-height: 1.6;
    }
    
    .content h1 {
      color: #111827;
      font-size: 24px;
      font-weight: 700;
      margin: 0 0 16px 0;
      line-height: 1.3;
    }
    
    .content h2 {
      color: #1f2937;
      font-size: 20px;
      font-weight: 600;
      margin: 24px 0 12px 0;
    }
    
    .content p {
      margin: 0 0 16px 0;
    }
    
    /* Button */
    .button {
      display: inline-block;
      padding: 14px 32px;
      background-color: ${primaryColor};
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      margin: 16px 0;
      min-height: 44px;
      line-height: 1.5;
    }
    
    .button:hover {
      opacity: 0.9;
    }
    
    /* Info box */
    .info-box {
      background-color: #f9fafb;
      border-left: 4px solid ${primaryColor};
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    
    /* Footer */
    .footer {
      background-color: #f9fafb;
      padding: 24px 20px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      line-height: 1.5;
    }
    
    .footer a {
      color: #6b7280;
      text-decoration: underline;
    }
    
    /* Mobile responsive */
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
      }
      
      .content {
        padding: 24px 16px !important;
      }
      
      .content h1 {
        font-size: 22px !important;
      }
      
      .content h2 {
        font-size: 18px !important;
      }
      
      .button {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box;
        text-align: center;
      }
      
      .footer {
        padding: 20px 16px !important;
      }
    }
  </style>
</head>
<body>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td style="padding: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="email-container">
          <!-- Header -->
          <tr>
            <td class="header">
              ${companyLogo ? `<img src="${companyLogo}" alt="${companyName}" class="logo">` : `<h1 style="color: #ffffff; margin: 0; font-size: 24px;">${companyName}</h1>`}
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="content">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td class="footer">
              <p style="margin: 0 0 8px 0;">&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
              <p style="margin: 0;">
                <a href="{{unsubscribe_url}}">Unsubscribe</a> | 
                <a href="{{preferences_url}}">Email Preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  
  ${trackingPixelUrl ? `<img src="${trackingPixelUrl}" width="1" height="1" alt="" style="display:block;">` : ""}
</body>
</html>
  `.trim();
}

/**
 * Invoice email template
 */
export function generateInvoiceEmail(params: {
  companyName: string;
  period: string;
  amount: number;
  dueDate: string;
  downloadUrl: string;
  trackingPixelUrl?: string;
  primaryColor?: string;
}): string {
  const content = `
    <h1>Your Invoice is Ready</h1>
    <p>Dear ${params.companyName} Team,</p>
    <p>Your invoice for <strong>${params.period}</strong> has been generated and is ready for review.</p>
    
    <div class="info-box">
      <p style="margin: 0 0 8px 0;"><strong>Invoice Summary</strong></p>
      <p style="margin: 0 0 4px 0;">Period: ${params.period}</p>
      <p style="margin: 0 0 4px 0;">Amount Due: <strong>$${params.amount.toFixed(2)}</strong></p>
      <p style="margin: 0;">Due Date: ${params.dueDate}</p>
    </div>
    
    <p style="text-align: center;">
      <a href="${params.downloadUrl}" class="button">Download Invoice (PDF)</a>
    </p>
    
    <p>Thank you for using Oracle Smart Recruitment! If you have any questions about your invoice, please don't hesitate to reach out.</p>
  `;

  return getBaseTemplate(content, {
    companyName: "Oracle Smart Recruitment",
    primaryColor: params.primaryColor,
    trackingPixelUrl: params.trackingPixelUrl,
  });
}

/**
 * Weekly report email template
 */
export function generateWeeklyReportEmail(params: {
  companyName: string;
  period: string;
  newApplications: number;
  scheduledInterviews: number;
  activeJobs: number;
  dashboardUrl: string;
  trackingPixelUrl?: string;
  primaryColor?: string;
}): string {
  const content = `
    <h1>Weekly Recruitment Summary</h1>
    <p>Dear ${params.companyName} Team,</p>
    <p>Here's your recruitment activity for <strong>${params.period}</strong>:</p>
    
    <div class="info-box">
      <p style="margin: 0 0 12px 0;"><strong>Key Metrics</strong></p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <strong>New Applications</strong>
          </td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
            <strong style="font-size: 20px; color: ${params.primaryColor || "#0ea5e9"};">${params.newApplications}</strong>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <strong>Scheduled Interviews</strong>
          </td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
            <strong style="font-size: 20px; color: ${params.primaryColor || "#0ea5e9"};">${params.scheduledInterviews}</strong>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <strong>Active Job Postings</strong>
          </td>
          <td style="padding: 8px 0; text-align: right;">
            <strong style="font-size: 20px; color: ${params.primaryColor || "#0ea5e9"};">${params.activeJobs}</strong>
          </td>
        </tr>
      </table>
    </div>
    
    <p style="text-align: center;">
      <a href="${params.dashboardUrl}" class="button">View Detailed Analytics</a>
    </p>
    
    <p>Keep up the great work! Your recruitment efforts are making a difference.</p>
  `;

  return getBaseTemplate(content, {
    companyName: "Oracle Smart Recruitment",
    primaryColor: params.primaryColor,
    trackingPixelUrl: params.trackingPixelUrl,
  });
}

/**
 * Interview invitation email template
 */
export function generateInterviewInviteEmail(params: {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  interviewDate: string;
  interviewTime: string;
  interviewType: string;
  meetingLink?: string;
  trackingPixelUrl?: string;
  primaryColor?: string;
}): string {
  const content = `
    <h1>Interview Invitation</h1>
    <p>Dear ${params.candidateName},</p>
    <p>Congratulations! We're excited to invite you to interview for the <strong>${params.jobTitle}</strong> position at ${params.companyName}.</p>
    
    <div class="info-box">
      <p style="margin: 0 0 8px 0;"><strong>Interview Details</strong></p>
      <p style="margin: 0 0 4px 0;">Date: ${params.interviewDate}</p>
      <p style="margin: 0 0 4px 0;">Time: ${params.interviewTime}</p>
      <p style="margin: 0;">Type: ${params.interviewType}</p>
    </div>
    
    ${params.meetingLink ? `
    <p style="text-align: center;">
      <a href="${params.meetingLink}" class="button">Join Interview</a>
    </p>
    ` : ""}
    
    <p>Please confirm your attendance and let us know if you have any questions. We look forward to speaking with you!</p>
  `;

  return getBaseTemplate(content, {
    companyName: params.companyName,
    primaryColor: params.primaryColor,
    trackingPixelUrl: params.trackingPixelUrl,
  });
}

/**
 * Application confirmation email template
 */
export function generateApplicationConfirmationEmail(params: {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  applicationUrl: string;
  trackingPixelUrl?: string;
  primaryColor?: string;
}): string {
  const content = `
    <h1>Application Received</h1>
    <p>Dear ${params.candidateName},</p>
    <p>Thank you for applying to the <strong>${params.jobTitle}</strong> position at ${params.companyName}!</p>
    
    <p>We've received your application and our team is currently reviewing it. We'll be in touch soon with next steps.</p>
    
    <p style="text-align: center;">
      <a href="${params.applicationUrl}" class="button">Track Application Status</a>
    </p>
    
    <p>In the meantime, feel free to explore more opportunities on our platform.</p>
  `;

  return getBaseTemplate(content, {
    companyName: "Oracle Smart Recruitment",
    primaryColor: params.primaryColor,
    trackingPixelUrl: params.trackingPixelUrl,
  });
}
