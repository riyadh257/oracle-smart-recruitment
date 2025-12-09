import { getDb } from "./db";
import { eq, and, gte, sql } from "drizzle-orm";
import { candidates, jobs, applications, employers, employerMatchingPreferences } from "../drizzle/schema";
import { generateMatchingDigestEmail, generateMatchingDigestPlainText } from "./matchingDigestEmail";
import { generateTrackingId, trackEmailSent } from "./emailEngagementTracking";
import { sendEmail } from "./emailDelivery";

/**
 * Matching Digest Service
 * Generates and sends periodic digest emails for candidate matches
 */

interface DigestCandidate {
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

/**
 * Generate and send daily matching digest for an employer
 */
export async function sendDailyMatchingDigest(employerId: number): Promise<{
  success: boolean;
  matchCount: number;
  error?: string;
}> {
  try {
    const db = await getDb();
    if (!db) {
      return { success: false, matchCount: 0, error: "Database not available" };
    }

    // Get employer details
    const employer = await db
      .select()
      .from(employers)
      .where(eq(employers.id, employerId))
      .limit(1);

    if (employer.length === 0) {
      return { success: false, matchCount: 0, error: "Employer not found" };
    }

    const employerData = employer[0];

    // Get employer matching preferences
    const preferences = await db
      .select()
      .from(employerMatchingPreferences)
      .where(eq(employerMatchingPreferences.employerId, employerId))
      .limit(1);

    // Skip if notifications are disabled
    if (preferences.length > 0 && !preferences[0].enableAutoNotifications) {
      return { success: true, matchCount: 0, error: "Notifications disabled" };
    }

    // Skip if frequency is not daily
    if (preferences.length > 0 && preferences[0].notificationFrequency !== "daily_digest") {
      return { success: true, matchCount: 0, error: "Not daily frequency" };
    }

    const minOverallScore = preferences.length > 0 ? preferences[0].minOverallMatchScore : 60;

    // Get matches from the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const matches = await db
      .select({
        candidateId: candidates.id,
        candidateName: candidates.name,
        candidateEmail: candidates.email,
        jobTitle: jobs.title,
        overallScore: applications.aiMatchScore,
        technicalScore: applications.aiMatchScore, // Use overall score as proxy
        cultureScore: applications.aiMatchScore, // Use overall score as proxy
        wellbeingScore: applications.aiMatchScore, // Use overall score as proxy
        skills: candidates.skills,
        experience: candidates.experienceYears,
        location: candidates.location,
        availability: candidates.availability,
      })
      .from(applications)
      .innerJoin(candidates, eq(applications.candidateId, candidates.id))
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(
        and(
          eq(jobs.employerId, employerId),
          gte(applications.appliedAt, yesterday),
          sql`${applications.aiMatchScore} >= ${minOverallScore}`
        )
      )
      .orderBy(sql`${applications.aiMatchScore} DESC`)
      .limit(10); // Top 10 matches

    // Format matches for email
    const digestCandidates: DigestCandidate[] = matches.map((match) => ({
      candidateId: match.candidateId,
      candidateName: match.candidateName || "Unknown",
      candidateEmail: match.candidateEmail || "",
      jobTitle: match.jobTitle,
      overallMatchScore: match.overallScore || 0,
      technicalScore: match.technicalScore || 0,
      cultureScore: match.cultureScore || 0,
      wellbeingScore: match.wellbeingScore || 0,
      topSkills: Array.isArray(match.skills) ? match.skills.slice(0, 5) : [],
      experienceYears: match.experience || 0,
      location: match.location || "Not specified",
      availability: match.availability || "Not specified",
    }));

    const highPriorityCount = digestCandidates.filter((c) => c.overallMatchScore >= 80).length;

    // Generate email content
    const dashboardUrl = process.env.VITE_APP_URL || "https://oracle-recruitment.manus.space";
    const emailData = {
      employerName: employerData.companyName,
      periodStart: yesterday,
      periodEnd: new Date(),
      totalMatches: digestCandidates.length,
      highPriorityMatches: highPriorityCount,
      matches: digestCandidates,
      dashboardUrl,
    };

    // Generate tracking ID for email engagement
    const trackingId = generateTrackingId();
    
    const htmlContent = generateMatchingDigestEmail(emailData, trackingId);
    const textContent = generateMatchingDigestPlainText(emailData, trackingId);

    // Send email
    if (employerData.email) {
      await sendEmail({
        to: employerData.email,
        subject: `Daily Matching Digest: ${digestCandidates.length} New Candidate${digestCandidates.length !== 1 ? "s" : ""}`,
        html: htmlContent,
        text: textContent,
      });
      
      // Track email sent
      await trackEmailSent({
        employerId,
        emailType: "job_match",
        recipientEmail: employerData.email,
        subject: `Daily Matching Digest: ${digestCandidates.length} New Candidate${digestCandidates.length !== 1 ? "s" : ""}`,
        trackingId,
      });
    }

    return {
      success: true,
      matchCount: digestCandidates.length,
    };
  } catch (error) {
    console.error("Error sending daily matching digest:", error);
    return {
      success: false,
      matchCount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate and send weekly matching digest for an employer
 */
export async function sendWeeklyMatchingDigest(employerId: number): Promise<{
  success: boolean;
  matchCount: number;
  error?: string;
}> {
  try {
    const db = await getDb();
    if (!db) {
      return { success: false, matchCount: 0, error: "Database not available" };
    }

    // Get employer details
    const employer = await db
      .select()
      .from(employers)
      .where(eq(employers.id, employerId))
      .limit(1);

    if (employer.length === 0) {
      return { success: false, matchCount: 0, error: "Employer not found" };
    }

    const employerData = employer[0];

    // Get employer matching preferences
    const preferences = await db
      .select()
      .from(employerMatchingPreferences)
      .where(eq(employerMatchingPreferences.employerId, employerId))
      .limit(1);

    // Skip if notifications are disabled
    if (preferences.length > 0 && !preferences[0].enableAutoNotifications) {
      return { success: true, matchCount: 0, error: "Notifications disabled" };
    }

    // Skip if frequency is not weekly
    if (preferences.length > 0 && preferences[0].notificationFrequency !== "weekly_digest") {
      return { success: true, matchCount: 0, error: "Not weekly frequency" };
    }

    const minOverallScore = preferences.length > 0 ? preferences[0].minOverallMatchScore : 60;

    // Get matches from the last 7 days
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const matches = await db
      .select({
        candidateId: candidates.id,
        candidateName: candidates.name,
        candidateEmail: candidates.email,
        jobTitle: jobs.title,
        overallScore: applications.aiMatchScore,
        technicalScore: applications.aiMatchScore, // Use overall score as proxy
        cultureScore: applications.aiMatchScore, // Use overall score as proxy
        wellbeingScore: applications.aiMatchScore, // Use overall score as proxy
        skills: candidates.skills,
        experience: candidates.experienceYears,
        location: candidates.location,
        availability: candidates.availability,
      })
      .from(applications)
      .innerJoin(candidates, eq(applications.candidateId, candidates.id))
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(
        and(
          eq(jobs.employerId, employerId),
          gte(applications.appliedAt, lastWeek),
          sql`${applications.aiMatchScore} >= ${minOverallScore}`
        )
      )
      .orderBy(sql`${applications.aiMatchScore} DESC`)
      .limit(20); // Top 20 matches for weekly

    // Format matches for email
    const digestCandidates: DigestCandidate[] = matches.map((match) => ({
      candidateId: match.candidateId,
      candidateName: match.candidateName || "Unknown",
      candidateEmail: match.candidateEmail || "",
      jobTitle: match.jobTitle,
      overallMatchScore: match.overallScore || 0,
      technicalScore: match.technicalScore || 0,
      cultureScore: match.cultureScore || 0,
      wellbeingScore: match.wellbeingScore || 0,
      topSkills: Array.isArray(match.skills) ? match.skills.slice(0, 5) : [],
      experienceYears: match.experience || 0,
      location: match.location || "Not specified",
      availability: match.availability || "Not specified",
    }));

    const highPriorityCount = digestCandidates.filter((c) => c.overallMatchScore >= 80).length;

    // Generate email content
    const dashboardUrl = process.env.VITE_APP_URL || "https://oracle-recruitment.manus.space";
    const emailData = {
      employerName: employerData.companyName,
      periodStart: lastWeek,
      periodEnd: new Date(),
      totalMatches: digestCandidates.length,
      highPriorityMatches: highPriorityCount,
      matches: digestCandidates,
      dashboardUrl,
    };

    // Generate tracking ID for email engagement
    const trackingId = generateTrackingId();
    
    const htmlContent = generateMatchingDigestEmail(emailData, trackingId);
    const textContent = generateMatchingDigestPlainText(emailData, trackingId);

    // Send email
    if (employerData.email) {
      await sendEmail({
        to: employerData.email,
        subject: `Weekly Matching Digest: ${digestCandidates.length} New Candidate${digestCandidates.length !== 1 ? "s" : ""}`,
        html: htmlContent,
        text: textContent,
      });
      
      // Track email sent
      await trackEmailSent({
        employerId,
        emailType: "job_match",
        recipientEmail: employerData.email,
        subject: `Weekly Matching Digest: ${digestCandidates.length} New Candidate${digestCandidates.length !== 1 ? "s" : ""}`,
        trackingId,
      });
    }

    return {
      success: true,
      matchCount: digestCandidates.length,
    };
  } catch (error) {
    console.error("Error sending weekly matching digest:", error);
    return {
      success: false,
      matchCount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send matching digests to all employers based on their preferences
 */
export async function sendAllMatchingDigests(frequency: "daily_digest" | "weekly_digest"): Promise<{
  totalSent: number;
  totalMatches: number;
  errors: string[];
}> {
  const db = await getDb();
  if (!db) {
    return { totalSent: 0, totalMatches: 0, errors: ["Database not available"] };
  }

  // Get all employers with matching preferences for this frequency
  const employersWithPrefs = await db
    .select({
      employerId: employerMatchingPreferences.employerId,
    })
    .from(employerMatchingPreferences)
    .where(
      and(
        eq(employerMatchingPreferences.enableAutoNotifications, true),
        eq(employerMatchingPreferences.notificationFrequency, frequency)
      )
    );

  let totalSent = 0;
  let totalMatches = 0;
  const errors: string[] = [];

  for (const pref of employersWithPrefs) {
    try {
      const result =
        frequency === "daily_digest"
          ? await sendDailyMatchingDigest(pref.employerId)
          : await sendWeeklyMatchingDigest(pref.employerId);

      if (result.success) {
        totalSent++;
        totalMatches += result.matchCount;
      } else if (result.error && result.error !== "Notifications disabled" && result.error !== "Not daily frequency" && result.error !== "Not weekly frequency") {
        errors.push(`Employer ${pref.employerId}: ${result.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Employer ${pref.employerId}: ${errorMessage}`);
    }
  }

  return { totalSent, totalMatches, errors };
}
