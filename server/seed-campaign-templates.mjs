import { drizzle } from "drizzle-orm/mysql2";
import { campaignTemplates } from "../drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

const templates = [
  {
    name: "Welcome Email for New Applicants",
    description: "Automated welcome email sent immediately after a candidate submits their application",
    category: "onboarding",
    campaignType: "onboarding",
    scheduleType: "trigger_based",
    defaultTriggerEvent: "application_received",
    defaultTriggerDelay: 0,
    emailSequence: [
      {
        dayOffset: 0,
        subject: "Thank You for Your Application - {{job_title}} at {{company_name}}",
        bodyHtml: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Thank You for Applying!</h2>
            <p>Dear {{candidate_name}},</p>
            <p>We have received your application for the <strong>{{job_title}}</strong> position at {{company_name}}.</p>
            <p>Our recruitment team will carefully review your application and get back to you within 5-7 business days.</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1f2937;">What Happens Next?</h3>
              <ul style="color: #4b5563;">
                <li>Our team reviews your application</li>
                <li>Qualified candidates will be contacted for an interview</li>
                <li>You can track your application status in your dashboard</li>
              </ul>
            </div>
            <p>In the meantime, feel free to explore more opportunities on our careers page.</p>
            <p>Best regards,<br/>{{company_name}} Recruitment Team</p>
          </div>
        `,
        bodyText: "Dear {{candidate_name}},\n\nWe have received your application for the {{job_title}} position at {{company_name}}.\n\nOur recruitment team will carefully review your application and get back to you within 5-7 business days.\n\nBest regards,\n{{company_name}} Recruitment Team"
      }
    ],
    isBuiltIn: true,
    isActive: true,
    tags: ["welcome", "application", "onboarding"],
    createdBy: 1
  },
  {
    name: "Interview Reminder - 24 Hours Before",
    description: "Reminder email sent 24 hours before a scheduled interview",
    category: "follow_up",
    campaignType: "interview_reminder",
    scheduleType: "trigger_based",
    defaultTriggerEvent: "days_before_interview",
    defaultTriggerDelay: 1,
    emailSequence: [
      {
        dayOffset: 0,
        subject: "Reminder: Interview Tomorrow for {{job_title}} at {{company_name}}",
        bodyHtml: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Interview Reminder</h2>
            <p>Dear {{candidate_name}},</p>
            <p>This is a friendly reminder about your upcoming interview for the <strong>{{job_title}}</strong> position.</p>
            <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
              <h3 style="margin-top: 0; color: #1e40af;">Interview Details</h3>
              <p style="margin: 5px 0;"><strong>Date:</strong> {{interview_date}}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> {{interview_time}}</p>
              <p style="margin: 5px 0;"><strong>Location:</strong> {{interview_location}}</p>
              <p style="margin: 5px 0;"><strong>Interviewer:</strong> {{interviewer_name}}</p>
            </div>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1f2937;">Preparation Tips</h3>
              <ul style="color: #4b5563;">
                <li>Review the job description and company information</li>
                <li>Prepare examples of your relevant experience</li>
                <li>Have questions ready for the interviewer</li>
                <li>Test your internet connection (for virtual interviews)</li>
              </ul>
            </div>
            <p>If you need to reschedule, please contact us as soon as possible.</p>
            <p>We look forward to meeting you!</p>
            <p>Best regards,<br/>{{company_name}} Recruitment Team</p>
          </div>
        `,
        bodyText: "Dear {{candidate_name}},\n\nThis is a reminder about your interview tomorrow for the {{job_title}} position.\n\nDate: {{interview_date}}\nTime: {{interview_time}}\nLocation: {{interview_location}}\n\nPlease contact us if you need to reschedule.\n\nBest regards,\n{{company_name}} Recruitment Team"
      }
    ],
    isBuiltIn: true,
    isActive: true,
    tags: ["interview", "reminder", "24-hours"],
    createdBy: 1
  },
  {
    name: "Interview Reminder - 1 Hour Before",
    description: "Last-minute reminder email sent 1 hour before the interview",
    category: "follow_up",
    campaignType: "interview_reminder",
    scheduleType: "trigger_based",
    defaultTriggerEvent: "days_before_interview",
    defaultTriggerDelay: 0,
    emailSequence: [
      {
        dayOffset: 0,
        subject: "Your Interview Starts in 1 Hour - {{job_title}}",
        bodyHtml: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Interview Starting Soon!</h2>
            <p>Dear {{candidate_name}},</p>
            <p>Your interview for the <strong>{{job_title}}</strong> position starts in approximately <strong>1 hour</strong>.</p>
            <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <h3 style="margin-top: 0; color: #991b1b;">Quick Details</h3>
              <p style="margin: 5px 0;"><strong>Time:</strong> {{interview_time}}</p>
              <p style="margin: 5px 0;"><strong>Location:</strong> {{interview_location}}</p>
              <p style="margin: 5px 0;"><strong>Meeting Link:</strong> {{meeting_link}}</p>
            </div>
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #92400e;">Last-Minute Checklist</h3>
              <ul style="color: #78350f;">
                <li>✓ Resume and portfolio ready</li>
                <li>✓ Quiet environment prepared</li>
                <li>✓ Camera and microphone tested (virtual interviews)</li>
                <li>✓ Notepad and pen ready</li>
              </ul>
            </div>
            <p>Good luck! We're excited to speak with you.</p>
            <p>Best regards,<br/>{{company_name}} Recruitment Team</p>
          </div>
        `,
        bodyText: "Dear {{candidate_name}},\n\nYour interview for the {{job_title}} position starts in 1 hour.\n\nTime: {{interview_time}}\nLocation: {{interview_location}}\n\nGood luck!\n\nBest regards,\n{{company_name}} Recruitment Team"
      }
    ],
    isBuiltIn: true,
    isActive: true,
    tags: ["interview", "reminder", "urgent", "1-hour"],
    createdBy: 1
  },
  {
    name: "Post-Interview Follow-Up",
    description: "Thank you email sent after interview completion",
    category: "follow_up",
    campaignType: "follow_up",
    scheduleType: "trigger_based",
    defaultTriggerEvent: "interview_completed",
    defaultTriggerDelay: 0,
    emailSequence: [
      {
        dayOffset: 0,
        subject: "Thank You for Interviewing - {{job_title}} at {{company_name}}",
        bodyHtml: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Thank You for Your Time</h2>
            <p>Dear {{candidate_name}},</p>
            <p>Thank you for taking the time to interview for the <strong>{{job_title}}</strong> position at {{company_name}}.</p>
            <p>We enjoyed learning more about your experience and qualifications. Your insights during the interview were valuable, and we appreciate your interest in joining our team.</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1f2937;">Next Steps</h3>
              <p style="color: #4b5563;">We are currently reviewing all candidates and will make our decision within the next <strong>{{decision_timeline}}</strong>. We will contact you via email with an update on your application status.</p>
            </div>
            <p>If you have any questions in the meantime, please don't hesitate to reach out.</p>
            <p>Best regards,<br/>{{company_name}} Recruitment Team</p>
          </div>
        `,
        bodyText: "Dear {{candidate_name}},\n\nThank you for interviewing for the {{job_title}} position at {{company_name}}.\n\nWe will review all candidates and contact you within {{decision_timeline}} with an update.\n\nBest regards,\n{{company_name}} Recruitment Team"
      }
    ],
    isBuiltIn: true,
    isActive: true,
    tags: ["follow-up", "thank-you", "post-interview"],
    createdBy: 1
  },
  {
    name: "Application Status Update",
    description: "General status update email for candidates in the pipeline",
    category: "engagement",
    campaignType: "engagement",
    scheduleType: "trigger_based",
    defaultTriggerEvent: "days_after_application",
    defaultTriggerDelay: 7,
    emailSequence: [
      {
        dayOffset: 0,
        subject: "Update on Your Application - {{job_title}}",
        bodyHtml: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Application Status Update</h2>
            <p>Dear {{candidate_name}},</p>
            <p>We wanted to provide you with an update on your application for the <strong>{{job_title}}</strong> position.</p>
            <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1e40af;">Current Status</h3>
              <p style="color: #1e40af; font-size: 18px; font-weight: bold;">{{application_status}}</p>
              <p style="color: #4b5563;">{{status_description}}</p>
            </div>
            <p>We appreciate your patience throughout this process. Your application is important to us, and we're committed to keeping you informed.</p>
            <p>You can also check your application status anytime by logging into your candidate dashboard.</p>
            <p>Best regards,<br/>{{company_name}} Recruitment Team</p>
          </div>
        `,
        bodyText: "Dear {{candidate_name}},\n\nUpdate on your application for {{job_title}}:\n\nStatus: {{application_status}}\n{{status_description}}\n\nBest regards,\n{{company_name}} Recruitment Team"
      }
    ],
    isBuiltIn: true,
    isActive: true,
    tags: ["status-update", "engagement", "pipeline"],
    createdBy: 1
  },
  {
    name: "Job Offer Notification",
    description: "Congratulatory email with job offer details",
    category: "onboarding",
    campaignType: "onboarding",
    scheduleType: "immediate",
    emailSequence: [
      {
        dayOffset: 0,
        subject: "Congratulations! Job Offer - {{job_title}} at {{company_name}}",
        bodyHtml: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">🎉 Congratulations!</h2>
            <p>Dear {{candidate_name}},</p>
            <p>We are delighted to extend an offer for the <strong>{{job_title}}</strong> position at {{company_name}}!</p>
            <div style="background-color: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
              <h3 style="margin-top: 0; color: #166534;">Offer Details</h3>
              <p style="margin: 5px 0;"><strong>Position:</strong> {{job_title}}</p>
              <p style="margin: 5px 0;"><strong>Department:</strong> {{department}}</p>
              <p style="margin: 5px 0;"><strong>Start Date:</strong> {{start_date}}</p>
              <p style="margin: 5px 0;"><strong>Salary:</strong> {{salary_range}}</p>
            </div>
            <p>Please find the detailed offer letter attached to this email. We kindly ask you to review the offer and respond by <strong>{{response_deadline}}</strong>.</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1f2937;">Next Steps</h3>
              <ol style="color: #4b5563;">
                <li>Review the offer letter and benefits package</li>
                <li>Contact us if you have any questions</li>
                <li>Sign and return the offer letter by {{response_deadline}}</li>
                <li>Complete pre-employment requirements</li>
              </ol>
            </div>
            <p>We're excited about the possibility of you joining our team and look forward to your response!</p>
            <p>Best regards,<br/>{{company_name}} Recruitment Team</p>
          </div>
        `,
        bodyText: "Dear {{candidate_name}},\n\nCongratulations! We are pleased to offer you the {{job_title}} position at {{company_name}}.\n\nPlease review the attached offer letter and respond by {{response_deadline}}.\n\nBest regards,\n{{company_name}} Recruitment Team"
      }
    ],
    isBuiltIn: true,
    isActive: true,
    tags: ["offer", "congratulations", "onboarding"],
    createdBy: 1
  },
  {
    name: "Professional Rejection Letter",
    description: "Respectful rejection email for unsuccessful candidates",
    category: "follow_up",
    campaignType: "follow_up",
    scheduleType: "immediate",
    emailSequence: [
      {
        dayOffset: 0,
        subject: "Update on Your Application - {{job_title}} at {{company_name}}",
        bodyHtml: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Thank You for Your Interest</h2>
            <p>Dear {{candidate_name}},</p>
            <p>Thank you for your interest in the <strong>{{job_title}}</strong> position at {{company_name}} and for taking the time to interview with us.</p>
            <p>After careful consideration, we have decided to move forward with another candidate whose qualifications more closely match our current needs for this specific role.</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #4b5563; margin: 0;">We were impressed by your background and experience. We encourage you to apply for future openings that align with your skills and career goals.</p>
            </div>
            <p>We will keep your resume on file and may reach out if a suitable opportunity arises in the future.</p>
            <p>We wish you all the best in your job search and future career endeavors.</p>
            <p>Best regards,<br/>{{company_name}} Recruitment Team</p>
          </div>
        `,
        bodyText: "Dear {{candidate_name}},\n\nThank you for your interest in the {{job_title}} position at {{company_name}}.\n\nAfter careful consideration, we have decided to move forward with another candidate. We were impressed by your background and encourage you to apply for future openings.\n\nBest regards,\n{{company_name}} Recruitment Team"
      }
    ],
    isBuiltIn: true,
    isActive: true,
    tags: ["rejection", "closure", "professional"],
    createdBy: 1
  },
  {
    name: "Request for Additional Information",
    description: "Email requesting missing documents or information from candidates",
    category: "engagement",
    campaignType: "engagement",
    scheduleType: "immediate",
    emailSequence: [
      {
        dayOffset: 0,
        subject: "Additional Information Needed - {{job_title}} Application",
        bodyHtml: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Additional Information Required</h2>
            <p>Dear {{candidate_name}},</p>
            <p>Thank you for your application for the <strong>{{job_title}}</strong> position. We are reviewing your application and need some additional information to proceed.</p>
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h3 style="margin-top: 0; color: #92400e;">Required Information</h3>
              <p style="color: #78350f;">{{required_information}}</p>
            </div>
            <p>Please provide the requested information by <strong>{{deadline}}</strong> to keep your application active.</p>
            <p>You can submit the information by:</p>
            <ul>
              <li>Replying to this email with the attachments</li>
              <li>Uploading documents through your candidate dashboard</li>
            </ul>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <p>Best regards,<br/>{{company_name}} Recruitment Team</p>
          </div>
        `,
        bodyText: "Dear {{candidate_name}},\n\nWe need additional information for your {{job_title}} application:\n\n{{required_information}}\n\nPlease provide by {{deadline}}.\n\nBest regards,\n{{company_name}} Recruitment Team"
      }
    ],
    isBuiltIn: true,
    isActive: true,
    tags: ["information-request", "documents", "engagement"],
    createdBy: 1
  },
  {
    name: "Assessment Invitation",
    description: "Email inviting candidates to complete online assessments",
    category: "engagement",
    campaignType: "engagement",
    scheduleType: "immediate",
    emailSequence: [
      {
        dayOffset: 0,
        subject: "Next Step: Complete Your Assessment - {{job_title}}",
        bodyHtml: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Assessment Invitation</h2>
            <p>Dear {{candidate_name}},</p>
            <p>Congratulations! Your application for the <strong>{{job_title}}</strong> position has progressed to the next stage.</p>
            <p>We would like to invite you to complete an online assessment that will help us better understand your skills and qualifications.</p>
            <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
              <h3 style="margin-top: 0; color: #1e40af;">Assessment Details</h3>
              <p style="margin: 5px 0;"><strong>Type:</strong> {{assessment_type}}</p>
              <p style="margin: 5px 0;"><strong>Duration:</strong> {{duration}} minutes</p>
              <p style="margin: 5px 0;"><strong>Deadline:</strong> {{deadline}}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{assessment_link}}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Start Assessment</a>
            </div>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1f2937;">Important Notes</h3>
              <ul style="color: #4b5563;">
                <li>Complete the assessment in one sitting</li>
                <li>Ensure stable internet connection</li>
                <li>Find a quiet environment without distractions</li>
                <li>Use a desktop or laptop (not mobile)</li>
              </ul>
            </div>
            <p>If you encounter any technical issues, please contact us immediately.</p>
            <p>Best regards,<br/>{{company_name}} Recruitment Team</p>
          </div>
        `,
        bodyText: "Dear {{candidate_name}},\n\nCongratulations! Please complete the online assessment for the {{job_title}} position.\n\nType: {{assessment_type}}\nDuration: {{duration}} minutes\nDeadline: {{deadline}}\n\nLink: {{assessment_link}}\n\nBest regards,\n{{company_name}} Recruitment Team"
      }
    ],
    isBuiltIn: true,
    isActive: true,
    tags: ["assessment", "evaluation", "next-step"],
    createdBy: 1
  },
  {
    name: "Onboarding Welcome Email",
    description: "Welcome email for new hires with onboarding information",
    category: "onboarding",
    campaignType: "onboarding",
    scheduleType: "immediate",
    emailSequence: [
      {
        dayOffset: 0,
        subject: "Welcome to {{company_name}}! Your Onboarding Journey Begins",
        bodyHtml: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">🎉 Welcome to the Team!</h2>
            <p>Dear {{candidate_name}},</p>
            <p>We're thrilled to welcome you to {{company_name}}! Your journey with us begins on <strong>{{start_date}}</strong>, and we're here to make your onboarding experience smooth and enjoyable.</p>
            <div style="background-color: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
              <h3 style="margin-top: 0; color: #166534;">Your First Day</h3>
              <p style="margin: 5px 0;"><strong>Date:</strong> {{start_date}}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> {{start_time}}</p>
              <p style="margin: 5px 0;"><strong>Location:</strong> {{office_location}}</p>
              <p style="margin: 5px 0;"><strong>Report to:</strong> {{manager_name}}</p>
            </div>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1f2937;">Before Your First Day</h3>
              <ul style="color: #4b5563;">
                <li>Complete the pre-employment forms (link below)</li>
                <li>Prepare required documents (ID, certificates)</li>
                <li>Review the employee handbook</li>
                <li>Set up your company email account</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{onboarding_portal}}" style="background-color: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Access Onboarding Portal</a>
            </div>
            <p>If you have any questions before your start date, please don't hesitate to reach out to your HR contact: {{hr_contact}}</p>
            <p>We can't wait to see you on your first day!</p>
            <p>Best regards,<br/>{{company_name}} Team</p>
          </div>
        `,
        bodyText: "Dear {{candidate_name}},\n\nWelcome to {{company_name}}!\n\nYour first day is {{start_date}} at {{start_time}}.\nLocation: {{office_location}}\nReport to: {{manager_name}}\n\nPlease complete pre-employment forms and prepare required documents.\n\nOnboarding Portal: {{onboarding_portal}}\n\nBest regards,\n{{company_name}} Team"
      }
    ],
    isBuiltIn: true,
    isActive: true,
    tags: ["onboarding", "welcome", "first-day"],
    createdBy: 1
  }
];

async function seedTemplates() {
  try {
    console.log("🌱 Seeding campaign templates...");
    
    for (const template of templates) {
      await db.insert(campaignTemplates).values(template);
      console.log(`✓ Created template: ${template.name}`);
    }
    
    console.log(`\n✅ Successfully seeded ${templates.length} campaign templates!`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding templates:", error);
    process.exit(1);
  }
}

seedTemplates();
