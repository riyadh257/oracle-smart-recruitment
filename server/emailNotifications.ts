import { notifyOwner } from "./_core/notification";

/**
 * Email notification service for Oracle Smart Recruitment
 * Uses the built-in notification API to send alerts
 */

interface NotificationPayload {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  message: string;
  actionUrl?: string;
}

/**
 * Send application status change notification to candidate
 */
export async function notifyApplicationStatusChange(
  candidateName: string,
  candidateEmail: string,
  jobTitle: string,
  companyName: string,
  newStatus: string
): Promise<boolean> {
  const statusMessages: Record<string, string> = {
    submitted: "Your application has been successfully submitted",
    screening: "Your application is under review",
    interviewing: "Congratulations! You've been selected for an interview",
    offered: "Great news! You've received a job offer",
    rejected: "Unfortunately, your application was not selected this time",
  };

  const message = `
Hello ${candidateName},

${statusMessages[newStatus] || "Your application status has been updated"} for the position of ${jobTitle} at ${companyName}.

Current Status: ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}

${newStatus === "interviewing" ? "Please check your dashboard for interview details and scheduling options." : ""}
${newStatus === "offered" ? "Please review the offer details in your dashboard and respond at your earliest convenience." : ""}

Best regards,
Oracle Smart Recruitment Team
  `.trim();

  try {
    // In production, this would send to the candidate's email
    // For now, we notify the owner as a demonstration
    await notifyOwner({
      title: `Application Status Update: ${candidateName} - ${jobTitle}`,
      content: message,
    });
    return true;
  } catch (error) {
    console.error("Failed to send application status notification:", error);
    return false;
  }
}

/**
 * Send new job match alert to candidate
 */
export async function notifyNewJobMatch(
  candidateName: string,
  candidateEmail: string,
  jobTitle: string,
  companyName: string,
  matchScore: number,
  jobId: number
): Promise<boolean> {
  const message = `
Hello ${candidateName},

We found a great job match for you!

Position: ${jobTitle}
Company: ${companyName}
Match Score: ${matchScore}% (Excellent fit!)

This position aligns perfectly with your skills, experience, and career preferences based on our AI analysis of 10,000+ attributes.

View the full job details and apply now to take advantage of this opportunity.

Best regards,
Oracle Smart Recruitment Team
  `.trim();

  try {
    await notifyOwner({
      title: `New Job Match Alert: ${matchScore}% match for ${candidateName}`,
      content: message,
    });
    return true;
  } catch (error) {
    console.error("Failed to send job match notification:", error);
    return false;
  }
}

/**
 * Send interview scheduling notification
 */
export async function notifyInterviewScheduled(
  candidateName: string,
  candidateEmail: string,
  jobTitle: string,
  companyName: string,
  interviewDate: Date,
  interviewType: string
): Promise<boolean> {
  const message = `
Hello ${candidateName},

Your interview has been scheduled!

Position: ${jobTitle}
Company: ${companyName}
Date & Time: ${interviewDate.toLocaleString()}
Interview Type: ${interviewType}

Please mark your calendar and prepare for the interview. We recommend:
- Reviewing the job description and company information
- Preparing examples of your relevant experience
- Having questions ready for the interviewer

Good luck!

Best regards,
Oracle Smart Recruitment Team
  `.trim();

  try {
    await notifyOwner({
      title: `Interview Scheduled: ${candidateName} - ${jobTitle}`,
      content: message,
    });
    return true;
  } catch (error) {
    console.error("Failed to send interview notification:", error);
    return false;
  }
}

/**
 * Send new application notification to employer
 */
export async function notifyEmployerNewApplication(
  employerName: string,
  employerEmail: string,
  candidateName: string,
  jobTitle: string,
  matchScore: number,
  applicationId: number
): Promise<boolean> {
  const message = `
Hello ${employerName},

You have received a new application!

Candidate: ${candidateName}
Position: ${jobTitle}
AI Match Score: ${matchScore}%

${matchScore >= 80 ? "🌟 This is a high-quality match! We recommend reviewing this application promptly." : ""}

Key Highlights:
- Overall Match: ${matchScore}%
- Application includes detailed profile and optional cover letter
- AI analysis shows strong alignment with job requirements

Review the application in your employer dashboard to view detailed match breakdowns across skills, culture fit, work wellbeing, and more.

Best regards,
Oracle Smart Recruitment Team
  `.trim();

  try {
    await notifyOwner({
      title: `New Application: ${candidateName} (${matchScore}% match) - ${jobTitle}`,
      content: message,
    });
    return true;
  } catch (error) {
    console.error("Failed to send employer application notification:", error);
    return false;
  }
}

/**
 * Send weekly job match digest to candidate
 */
export async function sendWeeklyJobMatchDigest(
  candidateName: string,
  candidateEmail: string,
  matchedJobs: Array<{ title: string; company: string; matchScore: number; id: number }>
): Promise<boolean> {
  if (matchedJobs.length === 0) {
    return true; // No jobs to notify about
  }

  const jobList = matchedJobs
    .map(
      (job, index) =>
        `${index + 1}. ${job.title} at ${job.company} (${job.matchScore}% match)`
    )
    .join("\n");

  const message = `
Hello ${candidateName},

Your Weekly Job Match Digest

We found ${matchedJobs.length} new job${matchedJobs.length > 1 ? "s" : ""} that match your profile this week:

${jobList}

These positions were selected by our AI matching engine based on your skills, experience, preferences, and career goals.

Log in to your dashboard to view full details and apply with one click.

Best regards,
Oracle Smart Recruitment Team
  `.trim();

  try {
    await notifyOwner({
      title: `Weekly Job Digest: ${matchedJobs.length} new matches for ${candidateName}`,
      content: message,
    });
    return true;
  } catch (error) {
    console.error("Failed to send weekly digest:", error);
    return false;
  }
}

/**
 * Send reminder to complete profile
 */
export async function notifyProfileIncomplete(
  candidateName: string,
  candidateEmail: string,
  completionPercentage: number
): Promise<boolean> {
  const message = `
Hello ${candidateName},

Complete Your Profile for Better Matches

Your profile is currently ${completionPercentage}% complete. Completing your profile will help our AI matching engine find the perfect opportunities for you.

Missing information may include:
- Work preferences and desired work settings
- Salary expectations
- Skills and experience details
- Career goals and aspirations

A complete profile increases your match scores by up to 30% and helps employers find you more easily.

Complete your profile now to unlock better job matches!

Best regards,
Oracle Smart Recruitment Team
  `.trim();

  try {
    await notifyOwner({
      title: `Profile Reminder: ${candidateName} (${completionPercentage}% complete)`,
      content: message,
    });
    return true;
  } catch (error) {
    console.error("Failed to send profile reminder:", error);
    return false;
  }
}


/**
 * Send interview reminder notification (24 hours before)
 */
export async function notifyInterviewReminder(
  candidateName: string,
  candidateEmail: string,
  jobTitle: string,
  companyName: string,
  interviewDate: Date,
  meetingUrl?: string
): Promise<boolean> {
  const message = `
Hello ${candidateName},

Reminder: Your interview is coming up soon!

Position: ${jobTitle}
Company: ${companyName}
Date & Time: ${interviewDate.toLocaleString()}
${meetingUrl ? `Meeting Link: ${meetingUrl}` : ""}

Preparation Tips:
- Review the job description and company information
- Prepare examples of your relevant experience
- Test your internet connection and video/audio setup
- Have questions ready for the interviewer
- Arrive 5 minutes early

We wish you the best of luck!

Best regards,
Oracle Smart Recruitment Team
  `.trim();

  try {
    await notifyOwner({
      title: `Interview Reminder: ${candidateName} - ${jobTitle} (Tomorrow)`,
      content: message,
    });
    return true;
  } catch (error) {
    console.error("Failed to send interview reminder:", error);
    return false;
  }
}

/**
 * Send calendar invite for interview
 */
export async function sendInterviewCalendarInvite(
  candidateName: string,
  candidateEmail: string,
  employerName: string,
  jobTitle: string,
  companyName: string,
  interviewDate: Date,
  duration: number,
  meetingUrl?: string,
  notes?: string,
  interviewId?: number,
  baseUrl?: string
): Promise<boolean> {
  const endTime = new Date(interviewDate.getTime() + duration * 60 * 1000);
  
  // Generate QR code for mobile feedback if interviewId is provided
  let qrCodeSection = "";
  if (interviewId && baseUrl) {
    try {
      const { generateFeedbackQRCode } = await import("./qrCodeGenerator");
      const qrCodeDataUrl = await generateFeedbackQRCode(interviewId, baseUrl);
      const feedbackUrl = `${baseUrl}/mobile/feedback/${interviewId}`;
      qrCodeSection = `

📱 Mobile Feedback Access:
Scan this QR code or visit the link below to submit feedback from your mobile device:
${feedbackUrl}

[QR Code: ${qrCodeDataUrl}]
`;
    } catch (error) {
      console.error("Failed to generate QR code for email:", error);
    }
  }
  
  const message = `
Calendar Invite: Interview Scheduled

Candidate: ${candidateName}
Position: ${jobTitle}
Company: ${companyName}
Interviewer: ${employerName}

Date: ${interviewDate.toLocaleDateString()}
Time: ${interviewDate.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}
Duration: ${duration} minutes
${meetingUrl ? `Meeting Link: ${meetingUrl}` : "Location: TBD"}

${notes ? `Notes: ${notes}` : ""}${qrCodeSection}

This interview has been scheduled through Oracle Smart Recruitment System.

Please add this to your calendar and ensure you're available at the scheduled time.

Best regards,
Oracle Smart Recruitment Team
  `.trim();

  try {
    await notifyOwner({
      title: `Calendar Invite: ${candidateName} - ${jobTitle} Interview`,
      content: message,
    });
    return true;
  } catch (error) {
    console.error("Failed to send calendar invite:", error);
    return false;
  }
}

/**
 * Notify employer about scheduled interview
 */
export async function notifyEmployerInterviewScheduled(
  employerName: string,
  employerEmail: string,
  candidateName: string,
  jobTitle: string,
  interviewDate: Date,
  meetingUrl?: string
): Promise<boolean> {
  const message = `
Hello ${employerName},

An interview has been scheduled with a candidate.

Candidate: ${candidateName}
Position: ${jobTitle}
Date & Time: ${interviewDate.toLocaleString()}
${meetingUrl ? `Meeting Link: ${meetingUrl}` : ""}

The candidate has been notified and will receive a reminder 24 hours before the interview.

You can view the candidate's profile and application details in your employer dashboard.

Best regards,
Oracle Smart Recruitment Team
  `.trim();

  try {
    await notifyOwner({
      title: `Interview Scheduled: ${candidateName} - ${jobTitle}`,
      content: message,
    });
    return true;
  } catch (error) {
    console.error("Failed to notify employer about interview:", error);
    return false;
  }
}

/**
 * Send interview cancellation notification
 */
export async function notifyInterviewCancellation(
  candidateName: string,
  candidateEmail: string,
  jobTitle: string,
  companyName: string,
  reason?: string
): Promise<boolean> {
  const message = `
Hello ${candidateName},

We regret to inform you that your scheduled interview has been cancelled.

Position: ${jobTitle}
Company: ${companyName}
${reason ? `Reason: ${reason}` : ""}

${!reason || reason.includes("reschedul") ? "The employer may reach out to reschedule at a later time." : ""}

If you have any questions, please contact the employer directly through the platform.

Best regards,
Oracle Smart Recruitment Team
  `.trim();

  try {
    await notifyOwner({
      title: `Interview Cancelled: ${candidateName} - ${jobTitle}`,
      content: message,
    });
    return true;
  } catch (error) {
    console.error("Failed to send cancellation notification:", error);
    return false;
  }
}

/**
 * Send interview rescheduling notification
 */
export async function notifyInterviewRescheduled(
  candidateName: string,
  candidateEmail: string,
  jobTitle: string,
  companyName: string,
  oldDate: Date,
  newDate: Date,
  meetingUrl?: string
): Promise<boolean> {
  const message = `
Hello ${candidateName},

Your interview has been rescheduled.

Position: ${jobTitle}
Company: ${companyName}

Previous Date & Time: ${oldDate.toLocaleString()}
New Date & Time: ${newDate.toLocaleString()}
${meetingUrl ? `Meeting Link: ${meetingUrl}` : ""}

Please update your calendar accordingly. You will receive a reminder 24 hours before the new interview time.

Best regards,
Oracle Smart Recruitment Team
  `.trim();

  try {
    await notifyOwner({
      title: `Interview Rescheduled: ${candidateName} - ${jobTitle}`,
      content: message,
    });
    return true;
  } catch (error) {
    console.error("Failed to send rescheduling notification:", error);
    return false;
  }
}
