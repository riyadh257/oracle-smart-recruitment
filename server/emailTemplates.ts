/**
 * Professional Email Template Library
 * Pre-designed, mobile-responsive email templates for recruitment
 */

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  category: "interview" | "application" | "offer" | "rejection" | "general";
  subject: string;
  bodyHtml: string;
  bodyText: string;
  variables: string[]; // Available template variables like {{candidateName}}, {{jobTitle}}
  preview: string; // Short preview text
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "interview-invite-professional",
    name: "Professional Interview Invitation",
    description: "Clean, professional design for interview invitations",
    category: "interview",
    subject: "Interview Invitation - {{jobTitle}} at {{companyName}}",
    preview: "We're excited to invite you for an interview...",
    variables: ["candidateName", "jobTitle", "companyName", "interviewDate", "interviewTime", "interviewLocation", "interviewerName"],
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Interview Invitation</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Dear <strong>{{candidateName}}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                We were impressed by your application for the <strong>{{jobTitle}}</strong> position at {{companyName}}. We would like to invite you for an interview to discuss this opportunity further.
              </p>
              
              <!-- Interview Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0; background-color: #f8f9fa; border-left: 4px solid #667eea; border-radius: 4px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px; color: #667eea; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Interview Details</p>
                    <p style="margin: 0 0 8px; color: #333333; font-size: 15px;"><strong>Date:</strong> {{interviewDate}}</p>
                    <p style="margin: 0 0 8px; color: #333333; font-size: 15px;"><strong>Time:</strong> {{interviewTime}}</p>
                    <p style="margin: 0 0 8px; color: #333333; font-size: 15px;"><strong>Location:</strong> {{interviewLocation}}</p>
                    <p style="margin: 0; color: #333333; font-size: 15px;"><strong>Interviewer:</strong> {{interviewerName}}</p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 30px; color: #333333; font-size: 16px; line-height: 1.6;">
                Please confirm your attendance by clicking the button below. If you have any questions or need to reschedule, feel free to reach out.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding: 10px 0;">
                    <a href="{{confirmLink}}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">Confirm Interview</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                We look forward to meeting you!
              </p>
              
              <p style="margin: 20px 0 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Best regards,<br>
                <strong>{{companyName}} Recruitment Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © 2024 {{companyName}}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    bodyText: `Dear {{candidateName}},

We were impressed by your application for the {{jobTitle}} position at {{companyName}}. We would like to invite you for an interview to discuss this opportunity further.

Interview Details:
- Date: {{interviewDate}}
- Time: {{interviewTime}}
- Location: {{interviewLocation}}
- Interviewer: {{interviewerName}}

Please confirm your attendance by visiting: {{confirmLink}}

We look forward to meeting you!

Best regards,
{{companyName}} Recruitment Team`,
  },
  
  {
    id: "application-received-modern",
    name: "Modern Application Confirmation",
    description: "Contemporary design confirming application receipt",
    category: "application",
    subject: "Application Received - {{jobTitle}}",
    preview: "Thank you for applying to {{companyName}}...",
    variables: ["candidateName", "jobTitle", "companyName", "applicationDate"],
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Received</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f0f2f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0f2f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          <!-- Header with Icon -->
          <tr>
            <td style="padding: 50px 30px 30px; text-align: center; background: linear-gradient(135deg, #00b4d8 0%, #0077b6 100%);">
              <div style="width: 80px; height: 80px; margin: 0 auto 20px; background-color: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">✓</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">Application Received!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 18px; line-height: 1.6;">
                Hi <strong>{{candidateName}}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; color: #555555; font-size: 16px; line-height: 1.7;">
                Thank you for applying for the <strong>{{jobTitle}}</strong> position at {{companyName}}. We've successfully received your application on <strong>{{applicationDate}}</strong>.
              </p>
              
              <!-- Status Card -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0; background: linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%); border-radius: 8px;">
                <tr>
                  <td style="padding: 25px; text-align: center;">
                    <p style="margin: 0 0 10px; color: #00838f; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Application Status</p>
                    <p style="margin: 0; color: #006064; font-size: 24px; font-weight: 700;">Under Review</p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px; color: #555555; font-size: 16px; line-height: 1.7;">
                Our recruitment team is currently reviewing your application. We'll be in touch soon with next steps.
              </p>
              
              <p style="margin: 0 0 30px; color: #555555; font-size: 16px; line-height: 1.7;">
                In the meantime, feel free to explore more about our company and culture on our website.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding: 10px 0;">
                    <a href="{{trackApplicationLink}}" style="display: inline-block; padding: 14px 35px; background: linear-gradient(135deg, #00b4d8 0%, #0077b6 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 600;">Track Your Application</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Best of luck,<br>
                <strong>{{companyName}} Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 25px 30px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 10px; color: #999999; font-size: 12px;">
                This is an automated message. Please do not reply to this email.
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © 2024 {{companyName}}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    bodyText: `Hi {{candidateName}},

Thank you for applying for the {{jobTitle}} position at {{companyName}}. We've successfully received your application on {{applicationDate}}.

Application Status: Under Review

Our recruitment team is currently reviewing your application. We'll be in touch soon with next steps.

Track your application: {{trackApplicationLink}}

Best of luck,
{{companyName}} Team`,
  },
  
  {
    id: "job-offer-elegant",
    name: "Elegant Job Offer",
    description: "Sophisticated design for job offer letters",
    category: "offer",
    subject: "Job Offer - {{jobTitle}} at {{companyName}}",
    preview: "Congratulations! We're delighted to offer you...",
    variables: ["candidateName", "jobTitle", "companyName", "salary", "startDate", "offerExpiryDate"],
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Job Offer</title>
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', serif; background-color: #fafafa;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border: 2px solid #d4af37; border-radius: 4px;">
          <!-- Header -->
          <tr>
            <td style="padding: 50px 40px 30px; text-align: center; border-bottom: 2px solid #d4af37;">
              <h1 style="margin: 0 0 10px; color: #1a1a1a; font-size: 36px; font-weight: 400; letter-spacing: 1px;">Congratulations!</h1>
              <p style="margin: 0; color: #666666; font-size: 18px; font-style: italic;">We're delighted to extend you an offer</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 25px; color: #333333; font-size: 17px; line-height: 1.8;">
                Dear <strong>{{candidateName}}</strong>,
              </p>
              
              <p style="margin: 0 0 25px; color: #333333; font-size: 17px; line-height: 1.8;">
                On behalf of {{companyName}}, I am pleased to offer you the position of <strong>{{jobTitle}}</strong>. We were thoroughly impressed by your qualifications and believe you will be an excellent addition to our team.
              </p>
              
              <!-- Offer Details -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 35px 0; background-color: #f9f9f9; border-left: 4px solid #d4af37;">
                <tr>
                  <td style="padding: 30px;">
                    <p style="margin: 0 0 15px; color: #d4af37; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">Offer Details</p>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 15px; width: 40%;">Position:</td>
                        <td style="padding: 8px 0; color: #1a1a1a; font-size: 15px; font-weight: 600;">{{jobTitle}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 15px;">Annual Salary:</td>
                        <td style="padding: 8px 0; color: #1a1a1a; font-size: 15px; font-weight: 600;">{{salary}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 15px;">Start Date:</td>
                        <td style="padding: 8px 0; color: #1a1a1a; font-size: 15px; font-weight: 600;">{{startDate}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 15px;">Offer Valid Until:</td>
                        <td style="padding: 8px 0; color: #1a1a1a; font-size: 15px; font-weight: 600;">{{offerExpiryDate}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 25px; color: #333333; font-size: 17px; line-height: 1.8;">
                Please review the attached offer letter for complete details regarding compensation, benefits, and terms of employment.
              </p>
              
              <p style="margin: 0 0 35px; color: #333333; font-size: 17px; line-height: 1.8;">
                To accept this offer, please click the button below by <strong>{{offerExpiryDate}}</strong>. If you have any questions, please don't hesitate to reach out.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding: 10px 0;">
                    <a href="{{acceptOfferLink}}" style="display: inline-block; padding: 16px 45px; background-color: #d4af37; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Accept Offer</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 35px 0 0; color: #333333; font-size: 17px; line-height: 1.8;">
                We are excited about the prospect of you joining our team and look forward to your positive response.
              </p>
              
              <p style="margin: 25px 0 0; color: #333333; font-size: 17px; line-height: 1.8;">
                Warm regards,<br>
                <strong>{{companyName}} Hiring Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f5f5f5; border-top: 2px solid #d4af37; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © 2024 {{companyName}}. Confidential and Proprietary.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    bodyText: `Dear {{candidateName}},

On behalf of {{companyName}}, I am pleased to offer you the position of {{jobTitle}}. We were thoroughly impressed by your qualifications and believe you will be an excellent addition to our team.

Offer Details:
- Position: {{jobTitle}}
- Annual Salary: {{salary}}
- Start Date: {{startDate}}
- Offer Valid Until: {{offerExpiryDate}}

Please review the attached offer letter for complete details regarding compensation, benefits, and terms of employment.

To accept this offer, please visit: {{acceptOfferLink}}

We are excited about the prospect of you joining our team and look forward to your positive response.

Warm regards,
{{companyName}} Hiring Team`,
  },
  
  {
    id: "rejection-polite",
    name: "Polite Rejection Letter",
    description: "Respectful rejection with encouragement for future opportunities",
    category: "rejection",
    subject: "Update on Your Application - {{jobTitle}}",
    preview: "Thank you for your interest in {{companyName}}...",
    variables: ["candidateName", "jobTitle", "companyName"],
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="padding: 50px 40px; text-align: center; border-bottom: 1px solid #e0e0e0;">
              <h1 style="margin: 0 0 10px; color: #333333; font-size: 28px; font-weight: 600;">Application Update</h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.7;">
                Dear <strong>{{candidateName}}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; color: #555555; font-size: 16px; line-height: 1.7;">
                Thank you for taking the time to apply for the <strong>{{jobTitle}}</strong> position at {{companyName}} and for your interest in joining our team.
              </p>
              
              <p style="margin: 0 0 20px; color: #555555; font-size: 16px; line-height: 1.7;">
                After careful consideration of all applications, we have decided to move forward with other candidates whose qualifications more closely match our current needs for this particular role.
              </p>
              
              <p style="margin: 0 0 20px; color: #555555; font-size: 16px; line-height: 1.7;">
                We were impressed by your background and experience. We encourage you to apply for future openings that align with your skills and career goals. We will keep your resume on file and reach out if a suitable opportunity arises.
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0; background-color: #f8f9fa; border-radius: 6px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">Stay connected with us</p>
                    <a href="{{careerPageLink}}" style="display: inline-block; padding: 12px 30px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 600;">View Open Positions</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px; color: #555555; font-size: 16px; line-height: 1.7;">
                We wish you the very best in your job search and future career endeavors.
              </p>
              
              <p style="margin: 0; color: #333333; font-size: 16px; line-height: 1.7;">
                Sincerely,<br>
                <strong>{{companyName}} Recruitment Team</strong>
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 25px 40px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © 2024 {{companyName}}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    bodyText: `Dear {{candidateName}},

Thank you for taking the time to apply for the {{jobTitle}} position at {{companyName}} and for your interest in joining our team.

After careful consideration of all applications, we have decided to move forward with other candidates whose qualifications more closely match our current needs for this particular role.

We were impressed by your background and experience. We encourage you to apply for future openings that align with your skills and career goals.

View open positions: {{careerPageLink}}

We wish you the very best in your job search and future career endeavors.

Sincerely,
{{companyName}} Recruitment Team`,
  },
  
  {
    id: "interview-reminder-24h",
    name: "Interview Reminder (24 Hours)",
    description: "Friendly reminder sent 24 hours before the interview",
    category: "interview",
    subject: "Reminder: Interview Tomorrow - {{jobTitle}}",
    preview: "This is a friendly reminder about your interview tomorrow...",
    variables: ["candidateName", "jobTitle", "companyName", "interviewDate", "interviewTime", "interviewLocation", "interviewerName"],
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f0f4f8;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0f4f8;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); border-radius: 10px 10px 0 0;">
              <div style="width: 60px; height: 60px; margin: 0 auto 15px; background-color: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 30px;">🔔</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 600;">Interview Reminder</h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 35px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hi <strong>{{candidateName}}</strong>,
              </p>
              
              <p style="margin: 0 0 25px; color: #555555; font-size: 16px; line-height: 1.7;">
                This is a friendly reminder that your interview for the <strong>{{jobTitle}}</strong> position at {{companyName}} is scheduled for <strong>tomorrow</strong>.
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 25px 0; background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-radius: 8px;">
                <tr>
                  <td style="padding: 25px;">
                    <p style="margin: 0 0 12px; color: #1976d2; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Interview Details</p>
                    <p style="margin: 0 0 8px; color: #333333; font-size: 15px;"><strong>📅 Date:</strong> {{interviewDate}}</p>
                    <p style="margin: 0 0 8px; color: #333333; font-size: 15px;"><strong>🕐 Time:</strong> {{interviewTime}}</p>
                    <p style="margin: 0 0 8px; color: #333333; font-size: 15px;"><strong>📍 Location:</strong> {{interviewLocation}}</p>
                    <p style="margin: 0; color: #333333; font-size: 15px;"><strong>👤 Interviewer:</strong> {{interviewerName}}</p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px; color: #555555; font-size: 16px; line-height: 1.7;">
                <strong>Quick Tips:</strong>
              </p>
              <ul style="margin: 0 0 25px; padding-left: 20px; color: #555555; font-size: 15px; line-height: 1.7;">
                <li style="margin-bottom: 8px;">Plan to arrive 10-15 minutes early</li>
                <li style="margin-bottom: 8px;">Bring a copy of your resume and any relevant work samples</li>
                <li style="margin-bottom: 8px;">Prepare questions about the role and our company</li>
                <li>Dress professionally and be yourself!</li>
              </ul>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding: 10px 0;">
                    <a href="{{addToCalendarLink}}" style="display: inline-block; padding: 14px 35px; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 600;">Add to Calendar</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 25px 0 0; color: #555555; font-size: 16px; line-height: 1.7;">
                If you need to reschedule or have any questions, please let us know as soon as possible.
              </p>
              
              <p style="margin: 20px 0 0; color: #333333; font-size: 16px; line-height: 1.7;">
                Looking forward to meeting you!<br>
                <strong>{{companyName}} Team</strong>
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 25px 30px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © 2024 {{companyName}}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    bodyText: `Hi {{candidateName}},

This is a friendly reminder that your interview for the {{jobTitle}} position at {{companyName}} is scheduled for tomorrow.

Interview Details:
📅 Date: {{interviewDate}}
🕐 Time: {{interviewTime}}
📍 Location: {{interviewLocation}}
👤 Interviewer: {{interviewerName}}

Quick Tips:
- Plan to arrive 10-15 minutes early
- Bring a copy of your resume and any relevant work samples
- Prepare questions about the role and our company
- Dress professionally and be yourself!

Add to calendar: {{addToCalendarLink}}

If you need to reschedule or have any questions, please let us know as soon as possible.

Looking forward to meeting you!
{{companyName}} Team`,
  },
  
  {
    id: "follow-up-post-interview",
    name: "Post-Interview Follow-Up",
    description: "Thank you message after interview with next steps",
    category: "general",
    subject: "Thank You for Interviewing - {{jobTitle}}",
    preview: "Thank you for taking the time to interview with us...",
    variables: ["candidateName", "jobTitle", "companyName", "interviewerName", "nextStepsTimeline"],
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #fafafa;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding: 45px 35px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 30px; font-weight: 600;">Thank You!</h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 35px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 17px; line-height: 1.7;">
                Dear <strong>{{candidateName}}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; color: #555555; font-size: 16px; line-height: 1.7;">
                Thank you for taking the time to interview for the <strong>{{jobTitle}}</strong> position at {{companyName}}. It was a pleasure speaking with you and learning more about your experience and qualifications.
              </p>
              
              <p style="margin: 0 0 20px; color: #555555; font-size: 16px; line-height: 1.7;">
                We were impressed by your background and enthusiasm for this opportunity. Your insights during our conversation reinforced our interest in your candidacy.
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0; background-color: #f8f9fa; border-left: 4px solid #667eea; border-radius: 4px;">
                <tr>
                  <td style="padding: 25px;">
                    <p style="margin: 0 0 10px; color: #667eea; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Next Steps</p>
                    <p style="margin: 0; color: #333333; font-size: 15px; line-height: 1.7;">
                      We are currently reviewing all candidates and will provide an update on next steps within <strong>{{nextStepsTimeline}}</strong>. We appreciate your patience during this process.
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 25px; color: #555555; font-size: 16px; line-height: 1.7;">
                If you have any questions in the meantime, please don't hesitate to reach out.
              </p>
              
              <p style="margin: 0; color: #333333; font-size: 16px; line-height: 1.7;">
                Best regards,<br>
                <strong>{{interviewerName}}</strong><br>
                {{companyName}}
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 25px 35px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © 2024 {{companyName}}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    bodyText: `Dear {{candidateName}},

Thank you for taking the time to interview for the {{jobTitle}} position at {{companyName}}. It was a pleasure speaking with you and learning more about your experience and qualifications.

We were impressed by your background and enthusiasm for this opportunity. Your insights during our conversation reinforced our interest in your candidacy.

Next Steps:
We are currently reviewing all candidates and will provide an update on next steps within {{nextStepsTimeline}}. We appreciate your patience during this process.

If you have any questions in the meantime, please don't hesitate to reach out.

Best regards,
{{interviewerName}}
{{companyName}}`,
  },
  
  {
    id: "onboarding-welcome",
    name: "Welcome to the Team",
    description: "Warm welcome message for new hires with onboarding information",
    category: "general",
    subject: "Welcome to {{companyName}}! 🎉",
    preview: "We're thrilled to welcome you to the team...",
    variables: ["candidateName", "jobTitle", "companyName", "startDate", "managerName", "onboardingPortalLink"],
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f0f4f8;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0f4f8;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 50px 35px; text-align: center; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);">
              <div style="font-size: 60px; margin-bottom: 15px;">🎉</div>
              <h1 style="margin: 0 0 10px; color: #ffffff; font-size: 32px; font-weight: 700;">Welcome to the Team!</h1>
              <p style="margin: 0; color: #ffffff; font-size: 18px; opacity: 0.95;">We're excited to have you join us</p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 35px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 18px; line-height: 1.7;">
                Dear <strong>{{candidateName}}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; color: #555555; font-size: 16px; line-height: 1.7;">
                Congratulations and welcome to {{companyName}}! We're thrilled to have you joining us as our new <strong>{{jobTitle}}</strong> starting on <strong>{{startDate}}</strong>.
              </p>
              
              <p style="margin: 0 0 30px; color: #555555; font-size: 16px; line-height: 1.7;">
                Your skills and experience will be a valuable addition to our team, and we're excited to see the contributions you'll make.
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0; background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-radius: 8px;">
                <tr>
                  <td style="padding: 30px;">
                    <p style="margin: 0 0 15px; color: #2e7d32; font-size: 16px; font-weight: 600;">📋 Before Your First Day</p>
                    <ul style="margin: 0; padding-left: 20px; color: #333333; font-size: 15px; line-height: 1.8;">
                      <li style="margin-bottom: 8px;">Complete your onboarding paperwork in our portal</li>
                      <li style="margin-bottom: 8px;">Review your benefits package and make selections</li>
                      <li style="margin-bottom: 8px;">Set up your workspace preferences</li>
                      <li>Prepare any questions for your manager</li>
                    </ul>
                  </td>
                </tr>
              </table>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding: 15px 0;">
                    <a href="{{onboardingPortalLink}}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">Access Onboarding Portal</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 20px; color: #555555; font-size: 16px; line-height: 1.7;">
                Your manager, <strong>{{managerName}}</strong>, will reach out soon to discuss your first week and answer any questions you may have.
              </p>
              
              <p style="margin: 0 0 20px; color: #555555; font-size: 16px; line-height: 1.7;">
                We're here to support you every step of the way. Welcome aboard!
              </p>
              
              <p style="margin: 0; color: #333333; font-size: 16px; line-height: 1.7;">
                Warmest welcome,<br>
                <strong>The {{companyName}} Team</strong>
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 25px 35px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © 2024 {{companyName}}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    bodyText: `Dear {{candidateName}},

Congratulations and welcome to {{companyName}}! We're thrilled to have you joining us as our new {{jobTitle}} starting on {{startDate}}.

Your skills and experience will be a valuable addition to our team, and we're excited to see the contributions you'll make.

📋 Before Your First Day:
- Complete your onboarding paperwork in our portal
- Review your benefits package and make selections
- Set up your workspace preferences
- Prepare any questions for your manager

Access onboarding portal: {{onboardingPortalLink}}

Your manager, {{managerName}}, will reach out soon to discuss your first week and answer any questions you may have.

We're here to support you every step of the way. Welcome aboard!

Warmest welcome,
The {{companyName}} Team`,
  },
];

/**
 * Get all email templates
 */
export function getAllTemplates(): EmailTemplate[] {
  return EMAIL_TEMPLATES;
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): EmailTemplate | undefined {
  return EMAIL_TEMPLATES.find((t: any) => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: EmailTemplate["category"]): EmailTemplate[] {
  return EMAIL_TEMPLATES.filter((t: any) => t.category === category);
}

/**
 * Replace template variables with actual values
 */
export function fillTemplate(template: EmailTemplate, variables: Record<string, string>): { subject: string; bodyHtml: string; bodyText: string } {
  let subject = template.subject;
  let bodyHtml = template.bodyHtml;
  let bodyText = template.bodyText;
  
  // Replace all variables
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    subject = subject.replace(new RegExp(placeholder, 'g'), value);
    bodyHtml = bodyHtml.replace(new RegExp(placeholder, 'g'), value);
    bodyText = bodyText.replace(new RegExp(placeholder, 'g'), value);
  }
  
  return { subject, bodyHtml, bodyText };
}
