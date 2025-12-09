import { eq, sql, desc, asc, and, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  candidates,
  employers,
  jobs,
  applications,
  coachingSessions,
  shifts,
  employeeSkills,
  billingRecords,
  atsIntegrations,
  type Candidate,
  type Employer,
  type Job,
  type Application,
  savedJobs,
  talentPool,
  emailTemplates,
  emailBranding,
  type InsertEmailTemplate,
  type InsertEmailBranding,
  videoInterviews,
  emailAbTests,
  emailAbVariants,
  type EmailAbTest,
  type InsertEmailAbTest,
  type EmailAbVariant,
  type InsertEmailAbVariant,
  emailAnalytics,
  type EmailAnalytics,
  type InsertEmailAnalytics,
  betaSignups,
  betaOnboardingProgress,
  betaFeedback,
  type BetaSignup,
  type InsertBetaSignup,
  type BetaOnboardingProgress,
  type InsertBetaOnboardingProgress,
  type BetaFeedback,
  type InsertBetaFeedback,
  mhrsdSyncStatus,
  workPermits,
  complianceReports,
  type MhrsdSyncStatus,
  type InsertMhrsdSyncStatus,
  type WorkPermit,
  type InsertWorkPermit,
  type ComplianceReport,
  type InsertComplianceReport,
  resumeParseResults,
  jobDescriptionAnalysis,
  nlpTrainingData,
  type ResumeParseResult,
  type InsertResumeParseResult,
  type JobDescriptionAnalysis,
  type InsertJobDescriptionAnalysis,
  type NlpTrainingData,
  type InsertNlpTrainingData,
  apiCredentials,
  syncJobs,
  apiLogs,
  qiwaCompanies,
  mhrsdRegulations,
  datasets,
  trainingJobs,
  modelInferences,
  type ApiCredential,
  type InsertApiCredential,
  type SyncJob,
  type InsertSyncJob,
  type ApiLog,
  type InsertApiLog,
  type QiwaCompany,
  type InsertQiwaCompany,
  type MhrsdRegulation,
  type InsertMhrsdRegulation,
  type Dataset,
  type InsertDataset,
  type TrainingJob,
  type InsertTrainingJob,
  type ModelInference,
  type InsertModelInference,
  emailCampaigns,
  campaignTriggers,
  campaignExecutions,
  campaignPerformanceSnapshots,
  emailCampaignVariants,
  type EmailCampaign,
  type InsertEmailCampaign,
  type CampaignExecution,
  type InsertCampaignExecution,
  type EmailCampaignVariant,
  type InsertEmailCampaignVariant,
  interviews,
  interviewFeedback,
  feedbackTemplates,
  type InterviewFeedback,
  type InsertInterviewFeedback,
  type FeedbackTemplate,
  type InsertFeedbackTemplate,
  abTestInsights,
  templatePerformanceMetrics,
  templatePerformanceAlertConfig,
  templatePerformanceAlertHistory,
  campaignSchedulePredictions,
  scheduledCampaignQueue,
  campaignSendTimeAnalytics
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// User Management
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// Candidate Management
// ============================================================================

export async function getCandidateByUserId(userId: number): Promise<Candidate | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(candidates).where(eq(candidates.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCandidateById(id: number): Promise<Candidate | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(candidates).where(eq(candidates.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllCandidates(): Promise<Candidate[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(candidates);
}

export async function createCandidate(data: typeof candidates.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(candidates).values(data);
  return result;
}

export async function updateCandidate(id: number, data: Partial<typeof candidates.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(candidates).set(data).where(eq(candidates.id, id));
}

export async function bulkUpdateCandidateStatus(candidateIds: number[], status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const results = [];
  for (const candidateId of candidateIds) {
    try {
      await db.update(candidates)
        .set({ profileStatus: status as any })
        .where(eq(candidates.id, candidateId));
      results.push({ candidateId, success: true });
    } catch (error) {
      results.push({ candidateId, success: false, error: String(error) });
    }
  }
  return results;
}

export async function bulkScheduleInterviews(
  candidateIds: number[],
  interviewData: {
    scheduledAt: Date;
    duration: number;
    location?: string;
    notes?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const results = [];
  for (const candidateId of candidateIds) {
    try {
      // Find or create an application for this candidate
      const candidateApps = await db.select()
        .from(applications)
        .where(eq(applications.candidateId, candidateId))
        .limit(1);
      
      let applicationId: number;
      if (candidateApps.length > 0) {
        applicationId = candidateApps[0].id;
      } else {
        // Create a placeholder application if none exists
        const result = await db.insert(applications).values({
          candidateId,
          jobId: 1, // Placeholder job ID
          status: "interview",
        });
        applicationId = result[0].insertId;
      }
      
      // Create interview
      await db.insert(interviews).values({
        applicationId,
        candidateId,
        scheduledAt: interviewData.scheduledAt,
        duration: interviewData.duration,
        location: interviewData.location,
        notes: interviewData.notes,
        status: "scheduled",
      });
      
      results.push({ candidateId, success: true });
    } catch (error) {
      results.push({ candidateId, success: false, error: String(error) });
    }
  }
  return results;
}

export async function bulkSendEmailToCandidate(
  candidateIds: number[],
  emailData: {
    subject: string;
    message: string;
    templateId?: number;
    userId: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const results = [];
  for (const candidateId of candidateIds) {
    try {
      // Get candidate details
      const candidate = await db.select()
        .from(candidates)
        .where(eq(candidates.id, candidateId))
        .limit(1);
      
      if (candidate.length === 0) {
        results.push({ candidateId, success: false, error: "Candidate not found" });
        continue;
      }
      
      const candidateData = candidate[0];
      if (!candidateData.email) {
        results.push({ candidateId, success: false, error: "No email address" });
        continue;
      }
      
      // Personalize message with candidate data
      let personalizedMessage = emailData.message;
      personalizedMessage = personalizedMessage.replace(/{{candidateName}}/g, candidateData.name || "Candidate");
      personalizedMessage = personalizedMessage.replace(/{{jobTitle}}/g, "the position");
      personalizedMessage = personalizedMessage.replace(/{{companyName}}/g, "our company");
      
      // Send email via Gmail MCP
      const { sendEmailViaGmail } = await import("./gmailMcpService");
      const emailResult = await sendEmailViaGmail({
        to: [candidateData.email],
        subject: emailData.subject,
        content: personalizedMessage,
      });
      
      if (emailResult.success) {
        results.push({ 
          candidateId, 
          success: true, 
          email: candidateData.email,
          messageId: emailResult.messageId 
        });
      } else {
        results.push({ 
          candidateId, 
          success: false, 
          error: emailResult.error || "Failed to send email" 
        });
      }
    } catch (error) {
      results.push({ candidateId, success: false, error: String(error) });
    }
  }
  return results;
}

// ============================================================================
// Employer Management
// ============================================================================

export async function getEmployerByUserId(userId: number): Promise<Employer | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(employers).where(eq(employers.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getEmployerById(id: number): Promise<Employer | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(employers).where(eq(employers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllEmployers(): Promise<Employer[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(employers);
}

export async function createEmployer(data: typeof employers.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(employers).values(data);
  return result;
}

export async function updateEmployer(id: number, data: Partial<typeof employers.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(employers).set(data).where(eq(employers.id, id));
}

// ============================================================================
// Job Management
// ============================================================================

export async function getJobById(id: number): Promise<Job | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getJobsByEmployerId(employerId: number): Promise<Job[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(jobs).where(eq(jobs.employerId, employerId));
}

export async function getAllActiveJobs(): Promise<Job[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(jobs).where(eq(jobs.status, "active"));
}

export async function createJob(data: typeof jobs.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(jobs).values(data);
  const insertId = Number(result[0].insertId);
  
  // Return the newly created job
  if (insertId) {
    return await getJobById(insertId);
  }
  return null;
}

export async function updateJob(id: number, data: Partial<typeof jobs.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(jobs).set(data).where(eq(jobs.id, id));
}

// ============================================================================
// Application Management
// ============================================================================

export async function getApplicationById(id: number): Promise<Application | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getApplicationsByJobId(jobId: number): Promise<Application[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(applications).where(eq(applications.jobId, jobId));
}

export async function getApplicationsByCandidateId(candidateId: number): Promise<Application[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(applications).where(eq(applications.candidateId, candidateId));
}

export async function createApplication(data: typeof applications.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(applications).values(data);
  return result;
}

export async function updateApplication(id: number, data: Partial<typeof applications.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(applications).set(data).where(eq(applications.id, id));
}

export async function bulkWithdrawApplications(candidateId: number, applicationIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(applications)
    .set({ withdrawnAt: new Date() })
    .where(
      and(
        eq(applications.candidateId, candidateId),
        inArray(applications.id, applicationIds)
      )
    );
}

export async function bulkToggleFavoriteApplications(candidateId: number, applicationIds: number[], isFavorite: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(applications)
    .set({ isFavorite })
    .where(
      and(
        eq(applications.candidateId, candidateId),
        inArray(applications.id, applicationIds)
      )
    );
}

// ============================================================================
// Coaching Sessions
// ============================================================================

export async function createCoachingSession(data: typeof coachingSessions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(coachingSessions).values(data);
  return result;
}

export async function getCoachingSessionsByCandidateId(candidateId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(coachingSessions).where(eq(coachingSessions.candidateId, candidateId));
}

// ============================================================================
// B2B SaaS - Shifts
// ============================================================================

export async function createShift(data: typeof shifts.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(shifts).values(data);
  return result;
}

export async function getShiftsByEmployerId(employerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(shifts).where(eq(shifts.employerId, employerId));
}

// ============================================================================
// B2B SaaS - Employee Skills
// ============================================================================

export async function createEmployeeSkill(data: typeof employeeSkills.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(employeeSkills).values(data);
  return result;
}

export async function getEmployeeSkillsByEmployerId(employerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(employeeSkills).where(eq(employeeSkills.employerId, employerId));
}

// ============================================================================
// Billing
// ============================================================================

export async function createBillingRecord(data: typeof billingRecords.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(billingRecords).values(data);
  return result;
}

export async function getBillingRecordsByEmployerId(employerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(billingRecords).where(eq(billingRecords.employerId, employerId));
}

// ============================================================================
// ATS Integration
// ============================================================================

export async function createAtsIntegration(data: typeof atsIntegrations.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(atsIntegrations).values(data);
  return result;
}

export async function getAtsIntegrationsByEmployerId(employerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(atsIntegrations).where(eq(atsIntegrations.employerId, employerId));
}

export async function updateAtsIntegration(id: number, data: Partial<typeof atsIntegrations.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(atsIntegrations).set(data).where(eq(atsIntegrations.id, id));
}

// ============================================================================
// Saved Jobs
// ============================================================================

export async function saveJob(candidateId: number, jobId: number, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(savedJobs).values({
    candidateId,
    jobId,
    notes: notes || null
  }).onDuplicateKeyUpdate({
    set: { notes: notes || null }
  });
  return result;
}

export async function unsaveJob(candidateId: number, jobId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(savedJobs).where(
    and(
      eq(savedJobs.candidateId, candidateId),
      eq(savedJobs.jobId, jobId)
    )
  );
}

export async function getSavedJobsByCandidateId(candidateId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      savedJob: savedJobs,
      job: jobs,
      employer: employers
    })
    .from(savedJobs)
    .innerJoin(jobs, eq(savedJobs.jobId, jobs.id))
    .innerJoin(employers, eq(jobs.employerId, employers.id))
    .where(eq(savedJobs.candidateId, candidateId))
    .orderBy(desc(savedJobs.createdAt));
  
  return result;
}

export async function isJobSaved(candidateId: number, jobId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db
    .select()
    .from(savedJobs)
    .where(
      and(
        eq(savedJobs.candidateId, candidateId),
        eq(savedJobs.jobId, jobId)
      )
    )
    .limit(1);
  
  return result.length > 0;
}

// ============================================================================
// Talent Pool
// ============================================================================

export async function addToTalentPool(
  employerId: number,
  candidateId: number,
  data: {
    tags?: string[];
    notes?: string;
    matchScore?: number;
    addedFromJobId?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(talentPool).values({
    employerId,
    candidateId,
    tags: data.tags || null,
    notes: data.notes || null,
    matchScore: data.matchScore || null,
    addedFromJobId: data.addedFromJobId || null,
    status: 'active'
  }).onDuplicateKeyUpdate({
    set: {
      tags: data.tags || null,
      notes: data.notes || null,
      matchScore: data.matchScore || null,
      updatedAt: new Date()
    }
  });
  return result;
}

export async function removeFromTalentPool(employerId: number, candidateId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(talentPool).where(
    and(
      eq(talentPool.employerId, employerId),
      eq(talentPool.candidateId, candidateId)
    )
  );
}

export async function getTalentPoolByEmployerId(employerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      talentPoolEntry: talentPool,
      candidate: candidates
    })
    .from(talentPool)
    .innerJoin(candidates, eq(talentPool.candidateId, candidates.id))
    .where(eq(talentPool.employerId, employerId))
    .orderBy(desc(talentPool.updatedAt));
  
  return result;
}

export async function updateTalentPoolEntry(
  employerId: number,
  candidateId: number,
  data: {
    tags?: string[];
    notes?: string;
    status?: 'active' | 'contacted' | 'hired' | 'not_interested';
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(talentPool)
    .set({
      ...data,
      updatedAt: new Date()
    })
    .where(
      and(
        eq(talentPool.employerId, employerId),
        eq(talentPool.candidateId, candidateId)
      )
    );
}

export async function isInTalentPool(employerId: number, candidateId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db
    .select()
    .from(talentPool)
    .where(
      and(
        eq(talentPool.employerId, employerId),
        eq(talentPool.candidateId, candidateId)
      )
    )
    .limit(1);
  
  return result.length > 0;
}

// ============================================================================
// Video Interviews
// ============================================================================

export async function createVideoInterview(data: typeof videoInterviews.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(videoInterviews).values(data);
  return result;
}

export async function getVideoInterviewsByApplicationId(applicationId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(videoInterviews)
    .where(eq(videoInterviews.applicationId, applicationId))
    .orderBy(desc(videoInterviews.createdAt));
}

export async function getVideoInterviewsByCandidateId(candidateId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      interview: videoInterviews,
      job: jobs,
      employer: employers
    })
    .from(videoInterviews)
    .innerJoin(jobs, eq(videoInterviews.jobId, jobs.id))
    .innerJoin(employers, eq(jobs.employerId, employers.id))
    .where(eq(videoInterviews.candidateId, candidateId))
    .orderBy(desc(videoInterviews.scheduledTime));
  
  return result;
}

export async function getVideoInterviewsByEmployerId(employerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      interview: videoInterviews,
      candidate: candidates,
      job: jobs
    })
    .from(videoInterviews)
    .innerJoin(candidates, eq(videoInterviews.candidateId, candidates.id))
    .innerJoin(jobs, eq(videoInterviews.jobId, jobs.id))
    .where(eq(videoInterviews.employerId, employerId))
    .orderBy(desc(videoInterviews.scheduledTime));
  
  return result;
}

export async function updateVideoInterview(id: number, data: Partial<typeof videoInterviews.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(videoInterviews).set({
    ...data,
    updatedAt: new Date()
  }).where(eq(videoInterviews.id, id));
}

// ============================================================================
// Job Similarity & Notifications
// ============================================================================

export async function getAllSavedJobs() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(savedJobs)
    .orderBy(desc(savedJobs.createdAt));
  
  return result;
}

export async function getRecentJobs(hoursBack: number = 24) {
  const db = await getDb();
  if (!db) return [];
  
  const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  
  const result = await db
    .select()
    .from(jobs)
    .where(
      and(
        eq(jobs.status, 'active'),
        sql`${jobs.createdAt} >= ${cutoffTime}`
      )
    )
    .orderBy(desc(jobs.createdAt));
  
  return result;
}

export async function getActiveJobs() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(jobs)
    .where(eq(jobs.status, 'active'))
    .orderBy(desc(jobs.createdAt));
  
  return result;
}

export async function searchTalentPool(
  employerId: number,
  filters: {
    skills?: string[];
    minExperience?: number;
    maxExperience?: number;
    location?: string;
    minMatchScore?: number;
    status?: string;
    tags?: string[];
  }
) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db
    .select({
      talentPoolEntry: talentPool,
      candidate: candidates
    })
    .from(talentPool)
    .innerJoin(candidates, eq(talentPool.candidateId, candidates.id))
    .where(eq(talentPool.employerId, employerId));
  
  // Build conditions array
  const conditions = [eq(talentPool.employerId, employerId)];
  
  if (filters.minMatchScore !== undefined) {
    conditions.push(sql`${talentPool.matchScore} >= ${filters.minMatchScore}`);
  }
  
  if (filters.status) {
    conditions.push(eq(talentPool.status, filters.status as any));
  }
  
  if (filters.minExperience !== undefined) {
    conditions.push(sql`${candidates.yearsOfExperience} >= ${filters.minExperience}`);
  }
  
  if (filters.maxExperience !== undefined) {
    conditions.push(sql`${candidates.yearsOfExperience} <= ${filters.maxExperience}`);
  }
  
  if (filters.location) {
    conditions.push(sql`${candidates.location} LIKE ${`%${filters.location}%`}`);
  }
  
  // Apply all conditions
  const result = await db
    .select({
      talentPoolEntry: talentPool,
      candidate: candidates
    })
    .from(talentPool)
    .innerJoin(candidates, eq(talentPool.candidateId, candidates.id))
    .where(and(...conditions))
    .orderBy(desc(talentPool.matchScore));
  
  // Filter by skills and tags in memory (JSON fields)
  let filteredResults = result;
  
  if (filters.skills && filters.skills.length > 0) {
    filteredResults = filteredResults.filter((item: any) => {
      const candidateSkills = item.candidate.technicalSkills || [];
      return filters.skills!.some((skill: any) => 
        candidateSkills.some((cs: string) => 
          cs.toLowerCase().includes(skill.toLowerCase())
        )
      );
    });
  }
  
  if (filters.tags && filters.tags.length > 0) {
    filteredResults = filteredResults.filter((item: any) => {
      const entryTags = item.talentPoolEntry.tags || [];
      return filters.tags!.some((tag: any) => 
        entryTags.some((et: string) => 
          et.toLowerCase().includes(tag.toLowerCase())
        )
      );
    });
  }
  
  return filteredResults;
}


// ============================================================================
// Scheduled Tasks Support
// ============================================================================

export async function getInterviewsInTimeRange(startTime: Date, endTime: Date) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(videoInterviews)
    .where(
      and(
        sql`${videoInterviews.scheduledTime} >= ${startTime}`,
        sql`${videoInterviews.scheduledTime} <= ${endTime}`,
        eq(videoInterviews.status, 'scheduled')
      )
    );
  
  return result;
}

export async function markInterviewReminderSent(interviewId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(videoInterviews)
    .set({ reminderSent: true })
    .where(eq(videoInterviews.id, interviewId));
}


// ============================================================================
// Email Templates
// ============================================================================

export async function getEmailTemplateById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.id, id))
    .limit(1);
  
  return result[0] || null;
}

export async function getEmailTemplatesByEmployerId(employerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.employerId, employerId));
}

export async function getEmailTemplateByType(employerId: number, type: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(emailTemplates)
    .where(
      and(
        eq(emailTemplates.employerId, employerId),
        eq(emailTemplates.type, type as any),
        eq(emailTemplates.isActive, 1)
      )
    )
    .limit(1);
  
  return result[0] || null;
}

export async function createEmailTemplate(template: InsertEmailTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(emailTemplates).values(template);
}

export async function updateEmailTemplate(id: number, updates: Partial<InsertEmailTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(emailTemplates)
    .set(updates)
    .where(eq(emailTemplates.id, id));
}

export async function deleteEmailTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
}

export async function getEmailBrandingByEmployerId(employerId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(emailBranding)
    .where(eq(emailBranding.employerId, employerId))
    .limit(1);
  
  return result[0] || null;
}

export async function upsertEmailBranding(branding: InsertEmailBranding) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(emailBranding)
    .values(branding)
    .onDuplicateKeyUpdate({
      set: {
        logoUrl: branding.logoUrl,
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
        fontFamily: branding.fontFamily,
        companyName: branding.companyName,
        footerText: branding.footerText,
        socialLinks: branding.socialLinks,
      },
    });
}


export async function getAllEmployersWithTalentPool() {
  const db = await getDb();
  if (!db) return [];
  
  // Get distinct employer IDs from talent pool
  const employerIds = await db
    .selectDistinct({ employerId: talentPool.employerId })
    .from(talentPool);
  
  // Get employer details
  const employerDetails = [];
  for (const { employerId } of employerIds) {
    const employer = await getEmployerById(employerId);
    if (employer) {
      employerDetails.push(employer);
    }
  }
  
  return employerDetails;
}

// ============================================================================
// A/B Testing for Email Templates
// ============================================================================

export async function createAbTest(test: InsertEmailAbTest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(emailAbTests).values(test);
  return result[0].insertId;
}

export async function getAbTestById(testId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(emailAbTests).where(eq(emailAbTests.id, testId));
  return result[0] || null;
}

export async function getAbTestsByEmployer(employerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(emailAbTests).where(eq(emailAbTests.employerId, employerId));
}

export async function updateAbTest(testId: number, updates: Partial<EmailAbTest>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(emailAbTests).set(updates).where(eq(emailAbTests.id, testId));
}

export async function createAbVariant(variant: InsertEmailAbVariant) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(emailAbVariants).values(variant);
  return result[0].insertId;
}

export async function getAbVariantsByTestId(testId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(emailAbVariants).where(eq(emailAbVariants.testId, testId));
}

export async function updateAbVariant(variantId: number, updates: Partial<EmailAbVariant>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(emailAbVariants).set(updates).where(eq(emailAbVariants.id, variantId));
}

// ============================================================================
// Email Analytics
// ============================================================================

export async function createEmailAnalytics(analytics: InsertEmailAnalytics) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(emailAnalytics).values(analytics);
  return result[0].insertId;
}

export async function getEmailAnalyticsByTrackingId(trackingId: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(emailAnalytics).where(eq(emailAnalytics.trackingId, trackingId));
  return result[0] || null;
}

export async function updateEmailAnalytics(trackingId: string, updates: Partial<EmailAnalytics>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(emailAnalytics).set(updates).where(eq(emailAnalytics.trackingId, trackingId));
}

export async function getEmailAnalyticsByEmployer(employerId: number, dateRange?: { start: Date; end: Date }) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(emailAnalytics).where(eq(emailAnalytics.employerId, employerId));
  
  if (dateRange) {
    query = query.where(
      and(
        gte(emailAnalytics.sentAt, dateRange.start),
        lte(emailAnalytics.sentAt, dateRange.end)
      )
    );
  }
  
  return await query;
}

export async function getEmailAnalyticsSummary(employerId: number, dateRange?: { start: Date; end: Date }) {
  const db = await getDb();
  if (!db) return {
    totalSent: 0,
    totalDelivered: 0,
    totalOpened: 0,
    totalClicked: 0,
    openRate: 0,
    clickRate: 0,
  };
  
  const analytics = await getEmailAnalyticsByEmployer(employerId, dateRange);
  
  const totalSent = analytics.length;
  const totalDelivered = analytics.filter((a: any) => a.deliveredAt).length;
  const totalOpened = analytics.filter((a: any) => a.openedAt).length;
  const totalClicked = analytics.filter((a: any) => a.clickedAt).length;
  
  const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
  const clickRate = totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0;
  
  return {
    totalSent,
    totalDelivered,
    totalOpened,
    totalClicked,
    openRate: Math.round(openRate * 100) / 100,
    clickRate: Math.round(clickRate * 100) / 100,
  };
}

export async function getEmailAnalyticsByType(employerId: number, emailType: string, dateRange?: { start: Date; end: Date }) {
  const db = await getDb();
  if (!db) return [];
  
  let conditions = [
    eq(emailAnalytics.employerId, employerId),
    eq(emailAnalytics.emailType, emailType as any)
  ];
  
  if (dateRange) {
    conditions.push(
      gte(emailAnalytics.sentAt, dateRange.start),
      lte(emailAnalytics.sentAt, dateRange.end)
    );
  }
  
  return await db.select().from(emailAnalytics).where(and(...conditions));
}

export async function getAbVariantById(variantId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(emailAbVariants).where(eq(emailAbVariants.id, variantId));
  return result[0] || null;
}

// ============================================================================
// Beta Program Infrastructure
// ============================================================================

export async function createBetaSignup(data: InsertBetaSignup) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(betaSignups).values(data);
  return result[0];
}

export async function getAllBetaSignups() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(betaSignups).orderBy(desc(betaSignups.createdAt));
}

export async function getBetaSignupById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(betaSignups).where(eq(betaSignups.id, id));
  return result[0] || null;
}

export async function getBetaSignupByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(betaSignups).where(eq(betaSignups.contactEmail, email));
  return result[0] || null;
}

export async function updateBetaSignup(id: number, data: Partial<InsertBetaSignup>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(betaSignups).set(data).where(eq(betaSignups.id, id));
}

export async function createBetaOnboardingProgress(data: InsertBetaOnboardingProgress) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(betaOnboardingProgress).values(data);
  return result[0];
}

export async function getBetaOnboardingProgressBySignupId(signupId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(betaOnboardingProgress).where(eq(betaOnboardingProgress.signupId, signupId));
  return result[0] || null;
}

export async function updateBetaOnboardingProgress(signupId: number, data: Partial<InsertBetaOnboardingProgress>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(betaOnboardingProgress).set(data).where(eq(betaOnboardingProgress.signupId, signupId));
}

export async function createBetaFeedback(data: InsertBetaFeedback) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(betaFeedback).values(data);
  return result[0];
}

export async function getBetaFeedbackBySignupId(signupId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(betaFeedback).where(eq(betaFeedback.signupId, signupId)).orderBy(desc(betaFeedback.createdAt));
}

export async function getAllBetaFeedback() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(betaFeedback).orderBy(desc(betaFeedback.createdAt));
}

export async function updateBetaFeedback(id: number, data: Partial<InsertBetaFeedback>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(betaFeedback).set(data).where(eq(betaFeedback.id, id));
}

// ============================================================================
// MHRSD/Qiwa UI Widgets
// ============================================================================

export async function createMhrsdSyncStatus(data: InsertMhrsdSyncStatus) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(mhrsdSyncStatus).values(data);
  return result[0];
}

export async function getMhrsdSyncStatusByEmployerId(employerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(mhrsdSyncStatus).where(eq(mhrsdSyncStatus.employerId, employerId)).orderBy(desc(mhrsdSyncStatus.createdAt));
}

export async function getLatestMhrsdSyncStatus(employerId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(mhrsdSyncStatus)
    .where(eq(mhrsdSyncStatus.employerId, employerId))
    .orderBy(desc(mhrsdSyncStatus.createdAt))
    .limit(1);
  return result[0] || null;
}

export async function updateMhrsdSyncStatus(id: number, data: Partial<InsertMhrsdSyncStatus>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(mhrsdSyncStatus).set(data).where(eq(mhrsdSyncStatus.id, id));
}

export async function createWorkPermit(data: InsertWorkPermit) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(workPermits).values(data);
  return result[0];
}

export async function getWorkPermitsByEmployerId(employerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(workPermits).where(eq(workPermits.employerId, employerId)).orderBy(desc(workPermits.createdAt));
}

export async function getExpiringWorkPermits(employerId: number, daysAhead: number = 30) {
  const db = await getDb();
  if (!db) return [];
  
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  
  return await db.select().from(workPermits)
    .where(
      and(
        eq(workPermits.employerId, employerId),
        eq(workPermits.status, 'active'),
        lte(workPermits.expiryDate, futureDate)
      )
    )
    .orderBy(workPermits.expiryDate);
}

export async function updateWorkPermit(id: number, data: Partial<InsertWorkPermit>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(workPermits).set(data).where(eq(workPermits.id, id));
}

export async function deleteWorkPermit(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(workPermits).where(eq(workPermits.id, id));
}

export async function createComplianceReport(data: InsertComplianceReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(complianceReports).values(data);
  return result[0];
}

export async function getComplianceReportsByEmployerId(employerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(complianceReports).where(eq(complianceReports.employerId, employerId)).orderBy(desc(complianceReports.createdAt));
}

export async function updateComplianceReport(id: number, data: Partial<InsertComplianceReport>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(complianceReports).set(data).where(eq(complianceReports.id, id));
}

// ============================================================================
// Advanced Arabic NLP
// ============================================================================

export async function createResumeParseResult(data: InsertResumeParseResult) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(resumeParseResults).values(data);
  return result[0];
}

export async function getResumeParseResultByCandidateId(candidateId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(resumeParseResults).where(eq(resumeParseResults.candidateId, candidateId)).orderBy(desc(resumeParseResults.createdAt));
}

export async function getLatestResumeParseResult(candidateId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(resumeParseResults)
    .where(eq(resumeParseResults.candidateId, candidateId))
    .orderBy(desc(resumeParseResults.createdAt))
    .limit(1);
  return result[0] || null;
}

export async function updateResumeParseResult(id: number, data: Partial<InsertResumeParseResult>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(resumeParseResults).set(data).where(eq(resumeParseResults.id, id));
}

export async function createJobDescriptionAnalysis(data: InsertJobDescriptionAnalysis) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(jobDescriptionAnalysis).values(data);
  return result[0];
}

export async function getJobDescriptionAnalysisByJobId(jobId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(jobDescriptionAnalysis).where(eq(jobDescriptionAnalysis.jobId, jobId)).orderBy(desc(jobDescriptionAnalysis.createdAt));
}

export async function getLatestJobDescriptionAnalysis(jobId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(jobDescriptionAnalysis)
    .where(eq(jobDescriptionAnalysis.jobId, jobId))
    .orderBy(desc(jobDescriptionAnalysis.createdAt))
    .limit(1);
  return result[0] || null;
}

export async function updateJobDescriptionAnalysis(id: number, data: Partial<InsertJobDescriptionAnalysis>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(jobDescriptionAnalysis).set(data).where(eq(jobDescriptionAnalysis.id, id));
}

export async function createNlpTrainingData(data: InsertNlpTrainingData) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(nlpTrainingData).values(data);
  return result[0];
}

export async function getNlpTrainingDataByType(dataType: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(nlpTrainingData).where(eq(nlpTrainingData.dataType, dataType as any)).orderBy(desc(nlpTrainingData.createdAt));
}

export async function getAllNlpTrainingData() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(nlpTrainingData).orderBy(desc(nlpTrainingData.createdAt));
}

export async function updateNlpTrainingData(id: number, data: Partial<InsertNlpTrainingData>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(nlpTrainingData).set(data).where(eq(nlpTrainingData.id, id));
}

// ============================================================================
// API Integration Management
// ============================================================================

export async function getAllApiCredentials() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(apiCredentials).orderBy(desc(apiCredentials.createdAt));
}

export async function getApiCredentialByService(serviceName: string, environment: string = 'production') {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(apiCredentials)
    .where(and(
      eq(apiCredentials.serviceName, serviceName as any),
      eq(apiCredentials.environment, environment as any)
    ))
    .limit(1);
  return result[0] || null;
}

export async function createApiCredential(data: InsertApiCredential) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(apiCredentials).values(data);
  return result[0];
}

export async function updateApiCredential(id: number, data: Partial<InsertApiCredential>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(apiCredentials).set({
    ...data,
    updatedAt: new Date()
  }).where(eq(apiCredentials.id, id));
}

export async function getAllSyncJobs() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(syncJobs).orderBy(desc(syncJobs.createdAt));
}

export async function getSyncJobsByType(jobType: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(syncJobs)
    .where(eq(syncJobs.jobType, jobType as any))
    .orderBy(desc(syncJobs.createdAt));
}

export async function createSyncJob(data: InsertSyncJob) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(syncJobs).values(data);
  return result[0];
}

export async function updateSyncJob(id: number, data: Partial<InsertSyncJob>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(syncJobs).set({
    ...data,
    updatedAt: new Date()
  }).where(eq(syncJobs.id, id));
}

export async function getApiLogsByService(serviceName: string, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(apiLogs)
    .where(eq(apiLogs.serviceName, serviceName as any))
    .orderBy(desc(apiLogs.createdAt))
    .limit(limit);
}

export async function createApiLog(data: InsertApiLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(apiLogs).values(data);
  return result[0];
}

// ============================================================================
// Qiwa & MHRSD Data
// ============================================================================

export async function getAllQiwaCompanies() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(qiwaCompanies).orderBy(desc(qiwaCompanies.lastSyncedAt));
}

export async function getQiwaCompanyById(qiwaCompanyId: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(qiwaCompanies)
    .where(eq(qiwaCompanies.qiwaCompanyId, qiwaCompanyId))
    .limit(1);
  return result[0] || null;
}

export async function upsertQiwaCompany(data: InsertQiwaCompany) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(qiwaCompanies).values(data).onDuplicateKeyUpdate({
    set: {
      ...data,
      lastSyncedAt: new Date(),
      updatedAt: new Date()
    }
  });
}

export async function getAllMhrsdRegulations() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(mhrsdRegulations).orderBy(desc(mhrsdRegulations.lastSyncedAt));
}

export async function getMhrsdRegulationById(regulationId: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(mhrsdRegulations)
    .where(eq(mhrsdRegulations.regulationId, regulationId))
    .limit(1);
  return result[0] || null;
}

export async function upsertMhrsdRegulation(data: InsertMhrsdRegulation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(mhrsdRegulations).values(data).onDuplicateKeyUpdate({
    set: {
      ...data,
      lastSyncedAt: new Date(),
      updatedAt: new Date()
    }
  });
}

// ============================================================================
// NLP Model Training & Datasets
// ============================================================================

export async function getAllDatasets() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(datasets).orderBy(desc(datasets.createdAt));
}

export async function getDatasetById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(datasets).where(eq(datasets.id, id)).limit(1);
  return result[0] || null;
}

export async function createDataset(data: InsertDataset) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(datasets).values(data);
  return result[0];
}

export async function updateDataset(id: number, data: Partial<InsertDataset>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(datasets).set({
    ...data,
    updatedAt: new Date()
  }).where(eq(datasets.id, id));
}

export async function getAllTrainingJobs() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(trainingJobs).orderBy(desc(trainingJobs.createdAt));
}

export async function getTrainingJobById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(trainingJobs).where(eq(trainingJobs.id, id)).limit(1);
  return result[0] || null;
}

export async function getProductionModelByType(modelType: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(trainingJobs)
    .where(and(
      eq(trainingJobs.modelType, modelType as any),
      eq(trainingJobs.isProduction, 1)
    ))
    .orderBy(desc(trainingJobs.deployedAt))
    .limit(1);
  return result[0] || null;
}

export async function createTrainingJob(data: InsertTrainingJob) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(trainingJobs).values(data);
  return result[0];
}

export async function updateTrainingJob(id: number, data: Partial<InsertTrainingJob>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(trainingJobs).set({
    ...data,
    updatedAt: new Date()
  }).where(eq(trainingJobs.id, id));
}

export async function createModelInference(data: InsertModelInference) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(modelInferences).values(data);
  return result[0];
}

export async function getModelInferencesByType(inferenceType: string, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(modelInferences)
    .where(eq(modelInferences.inferenceType, inferenceType as any))
    .orderBy(desc(modelInferences.createdAt))
    .limit(limit);
}

// Interview Management Functions
export async function getInterviewById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select({
    interview: interviews,
    candidate: candidates,
    application: applications,
  })
    .from(interviews)
    .leftJoin(candidates, eq(interviews.candidateId, candidates.id))
    .leftJoin(applications, eq(interviews.applicationId, applications.id))
    .where(eq(interviews.id, id))
    .limit(1);
  
  if (result.length === 0) return null;
  
  return {
    ...result[0].interview,
    candidate: result[0].candidate,
    application: result[0].application,
  };
}

export async function listInterviews(filters: {
  candidateId?: number;
  employerId?: number;
  status?: "scheduled" | "completed" | "cancelled";
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(interviews);
  
  // Note: This is a simplified version. In production, you'd need to join with
  // applications table to filter by employerId
  if (filters.candidateId) {
    query = query.where(eq(interviews.candidateId, filters.candidateId)) as any;
  }
  if (filters.status) {
    query = query.where(eq(interviews.status, filters.status)) as any;
  }
  
  return await query;
}

export async function createInterview(data: {
  applicationId: number;
  scheduledAt: Date;
  duration: number;
  location?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get application to extract candidateId and employerId
  const app = await db.select().from(applications)
    .where(eq(applications.id, data.applicationId))
    .limit(1);
  
  if (app.length === 0) {
    throw new Error("Application not found");
  }
  
  const result = await db.insert(interviews).values({
    applicationId: data.applicationId,
    candidateId: app[0].candidateId,
    scheduledAt: data.scheduledAt,
    duration: data.duration,
    location: data.location,
    notes: data.notes,
    status: "scheduled",
  });
  
  return result[0];
}

export async function updateInterview(id: number, data: {
  scheduledAt?: Date;
  status?: "scheduled" | "completed" | "cancelled";
  feedback?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(interviews).set({
    ...data,
    updatedAt: new Date(),
  }).where(eq(interviews.id, id));
}

/**
 * Check for interview scheduling conflicts
 * Returns conflicts and suggested alternative times
 */
export async function checkInterviewConflicts(params: {
  candidateId: number;
  scheduledTime: Date;
  duration: number;
  excludeInterviewId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { candidateId, scheduledTime, duration, excludeInterviewId } = params;
  
  // Calculate the time range for this interview
  const interviewStart = scheduledTime.getTime();
  const interviewEnd = interviewStart + (duration * 60 * 1000); // duration in minutes

  // Find all interviews for this candidate
  let query = db.select()
    .from(videoInterviews)
    .where(eq(videoInterviews.candidateId, candidateId));

  const candidateInterviews = await query;

  // Check for conflicts
  const conflicts = candidateInterviews.filter((interview) => {
    // Skip the interview being updated
    if (excludeInterviewId && interview.id === excludeInterviewId) {
      return false;
    }

    // Skip cancelled interviews
    if (interview.status === "cancelled") {
      return false;
    }

    // Check if times overlap
    const existingStart = new Date(interview.scheduledTime).getTime();
    const existingEnd = existingStart + ((interview.duration || 30) * 60 * 1000);

    // Overlap occurs if:
    // - New interview starts during existing interview
    // - New interview ends during existing interview
    // - New interview completely contains existing interview
    const overlaps = 
      (interviewStart >= existingStart && interviewStart < existingEnd) ||
      (interviewEnd > existingStart && interviewEnd <= existingEnd) ||
      (interviewStart <= existingStart && interviewEnd >= existingEnd);

    return overlaps;
  });

  // Generate suggested alternative times if there are conflicts
  const suggestedTimes: Date[] = [];
  
  if (conflicts.length > 0) {
    const requestedDate = new Date(scheduledTime);
    const baseDate = new Date(requestedDate);
    baseDate.setHours(9, 0, 0, 0); // Start at 9 AM

    // Try to find 3 alternative slots on the same day
    for (let hour = 9; hour <= 17 && suggestedTimes.length < 3; hour++) {
      for (let minute = 0; minute < 60 && suggestedTimes.length < 3; minute += 30) {
        const candidateTime = new Date(baseDate);
        candidateTime.setHours(hour, minute, 0, 0);
        
        const candidateStart = candidateTime.getTime();
        const candidateEnd = candidateStart + (duration * 60 * 1000);

        // Check if this time conflicts with any existing interviews
        const hasConflict = candidateInterviews.some((interview) => {
          if (interview.status === "cancelled") return false;
          
          const existingStart = new Date(interview.scheduledTime).getTime();
          const existingEnd = existingStart + ((interview.duration || 30) * 60 * 1000);

          return (
            (candidateStart >= existingStart && candidateStart < existingEnd) ||
            (candidateEnd > existingStart && candidateEnd <= existingEnd) ||
            (candidateStart <= existingStart && candidateEnd >= existingEnd)
          );
        });

        if (!hasConflict) {
          suggestedTimes.push(candidateTime);
        }
      }
    }

    // If we couldn't find 3 slots on the same day, try the next day
    if (suggestedTimes.length < 3) {
      const nextDay = new Date(baseDate);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(9, 0, 0, 0);

      for (let hour = 9; hour <= 17 && suggestedTimes.length < 3; hour++) {
        for (let minute = 0; minute < 60 && suggestedTimes.length < 3; minute += 30) {
          const candidateTime = new Date(nextDay);
          candidateTime.setHours(hour, minute, 0, 0);
          
          const candidateStart = candidateTime.getTime();
          const candidateEnd = candidateStart + (duration * 60 * 1000);

          const hasConflict = candidateInterviews.some((interview) => {
            if (interview.status === "cancelled") return false;
            
            const existingStart = new Date(interview.scheduledTime).getTime();
            const existingEnd = existingStart + ((interview.duration || 30) * 60 * 1000);

            return (
              (candidateStart >= existingStart && candidateStart < existingEnd) ||
              (candidateEnd > existingStart && candidateEnd <= existingEnd) ||
              (candidateStart <= existingStart && candidateEnd >= existingEnd)
            );
          });

          if (!hasConflict) {
            suggestedTimes.push(candidateTime);
          }
        }
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts: conflicts.map((c) => ({
      id: c.id,
      scheduledTime: c.scheduledTime,
      duration: c.duration,
      status: c.status,
    })),
    suggestedTimes,
  };
}

// ============================================================================
// Email Campaign Management
// ============================================================================

export async function getAllCampaigns(employerId: number): Promise<EmailCampaign[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(emailCampaigns)
    .where(eq(emailCampaigns.employerId, employerId))
    .orderBy(desc(emailCampaigns.createdAt));
}

export async function getCampaignById(id: number): Promise<EmailCampaign | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(emailCampaigns).where(eq(emailCampaigns.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCampaign(data: InsertEmailCampaign) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(emailCampaigns).values(data);
  const insertId = Number(result[0].insertId);
  
  if (insertId) {
    return await getCampaignById(insertId);
  }
  return null;
}

export async function updateCampaign(id: number, data: Partial<InsertEmailCampaign>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(emailCampaigns).set(data).where(eq(emailCampaigns.id, id));
}

export async function deleteCampaign(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(emailCampaigns).where(eq(emailCampaigns.id, id));
}

export async function getCampaignVariants(campaignId: number): Promise<EmailCampaignVariant[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(emailCampaignVariants)
    .where(eq(emailCampaignVariants.campaignId, campaignId));
}

export async function createCampaignVariant(data: InsertEmailCampaignVariant) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(emailCampaignVariants).values(data);
}

export async function getCampaignExecutions(campaignId: number): Promise<CampaignExecution[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(campaignExecutions)
    .where(eq(campaignExecutions.campaignId, campaignId))
    .orderBy(desc(campaignExecutions.createdAt));
}

export async function getCampaignAnalytics(employerId: number) {
  const db = await getDb();
  if (!db) return {
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalSent: 0,
    totalOpened: 0,
    totalClicked: 0,
    avgOpenRate: 0,
    avgClickRate: 0
  };
  
  const campaigns = await db.select().from(emailCampaigns)
    .where(eq(emailCampaigns.employerId, employerId));
  
  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  
  // Get performance data from snapshots
  const snapshots = await db.select().from(campaignPerformanceSnapshots)
    .where(sql`${campaignPerformanceSnapshots.campaignId} IN (SELECT id FROM ${emailCampaigns} WHERE ${emailCampaigns.employerId} = ${employerId})`)
    .orderBy(desc(campaignPerformanceSnapshots.snapshotAt));
  
  const totalSent = snapshots.reduce((sum, s) => sum + (s.totalSent || 0), 0);
  const totalOpened = snapshots.reduce((sum, s) => sum + (s.totalOpened || 0), 0);
  const totalClicked = snapshots.reduce((sum, s) => sum + (s.totalClicked || 0), 0);
  
  const avgOpenRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
  const avgClickRate = totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0;
  
  return {
    totalCampaigns: campaigns.length,
    activeCampaigns: activeCampaigns.length,
    totalSent,
    totalOpened,
    totalClicked,
    avgOpenRate,
    avgClickRate
  };
}

// ============================================================================
// Candidate Analytics
// ============================================================================

export async function getCandidateAnalytics(employerId: number) {
  const db = await getDb();
  if (!db) return {
    totalCandidates: 0,
    activeCandidates: 0,
    screenedCandidates: 0,
    avgProfileScore: 0
  };
  
  // Get all candidates for this employer (through applications)
  const candidateIds = await db.select({ candidateId: applications.candidateId })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(eq(jobs.employerId, employerId));
  
  const uniqueCandidateIds = [...new Set(candidateIds.map(c => c.candidateId))];
  
  if (uniqueCandidateIds.length === 0) {
    return {
      totalCandidates: 0,
      activeCandidates: 0,
      screenedCandidates: 0,
      avgProfileScore: 0
    };
  }
  
  const candidateData = await db.select().from(candidates)
    .where(sql`${candidates.id} IN (${sql.join(uniqueCandidateIds.map(id => sql`${id}`), sql`, `)})`);
  
  const activeCandidates = candidateData.filter(c => c.isAvailable && c.profileStatus === 'active');
  const screenedCandidates = candidateData.filter(c => c.aiProfileScore !== null);
  const avgProfileScore = screenedCandidates.length > 0
    ? Math.round(screenedCandidates.reduce((sum, c) => sum + (c.aiProfileScore || 0), 0) / screenedCandidates.length)
    : 0;
  
  return {
    totalCandidates: candidateData.length,
    activeCandidates: activeCandidates.length,
    screenedCandidates: screenedCandidates.length,
    avgProfileScore
  };
}

// ============================================================================
// Interview Feedback Management
// ============================================================================

export async function createInterviewFeedback(data: InsertInterviewFeedback) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(interviewFeedback).values(data);
  return result[0];
}

export async function getInterviewFeedbackByInterviewId(interviewId: number): Promise<InterviewFeedback[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(interviewFeedback)
    .where(eq(interviewFeedback.interviewId, interviewId))
    .orderBy(desc(interviewFeedback.submittedAt));
}

export async function getInterviewFeedbackByCandidateId(candidateId: number): Promise<InterviewFeedback[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(interviewFeedback)
    .where(eq(interviewFeedback.candidateId, candidateId))
    .orderBy(desc(interviewFeedback.submittedAt));
}

export async function getInterviewFeedbackByInterviewer(interviewerId: number): Promise<InterviewFeedback[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(interviewFeedback)
    .where(eq(interviewFeedback.interviewerId, interviewerId))
    .orderBy(desc(interviewFeedback.submittedAt));
}

export async function getFeedbackAnalytics(employerId: number) {
  const db = await getDb();
  if (!db) return null;
  
  // Get all feedback for employer's candidates
  const feedbackData = await db.select({
    feedback: interviewFeedback,
    candidate: candidates,
    interviewer: users
  })
  .from(interviewFeedback)
  .innerJoin(candidates, eq(interviewFeedback.candidateId, candidates.id))
  .innerJoin(users, eq(interviewFeedback.interviewerId, users.id))
  .where(eq(candidates.userId, employerId));
  
  return feedbackData;
}

export async function getTopCandidatesByFeedback(employerId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  // Aggregate feedback scores by candidate
  const topCandidates = await db.select({
    candidateId: interviewFeedback.candidateId,
    candidateName: candidates.fullName,
    candidateEmail: candidates.email,
    avgOverallRating: sql<number>`AVG(${interviewFeedback.overallRating})`,
    avgTechnicalRating: sql<number>`AVG(${interviewFeedback.technicalSkillsRating})`,
    avgCommunicationRating: sql<number>`AVG(${interviewFeedback.communicationRating})`,
    avgProblemSolvingRating: sql<number>`AVG(${interviewFeedback.problemSolvingRating})`,
    avgCultureFitRating: sql<number>`AVG(${interviewFeedback.cultureFitRating})`,
    feedbackCount: sql<number>`COUNT(${interviewFeedback.id})`,
    strongHireCount: sql<number>`SUM(CASE WHEN ${interviewFeedback.recommendation} = 'strong_hire' THEN 1 ELSE 0 END)`,
    hireCount: sql<number>`SUM(CASE WHEN ${interviewFeedback.recommendation} = 'hire' THEN 1 ELSE 0 END)`
  })
  .from(interviewFeedback)
  .innerJoin(candidates, eq(interviewFeedback.candidateId, candidates.id))
  .where(eq(candidates.userId, employerId))
  .groupBy(interviewFeedback.candidateId, candidates.fullName, candidates.email)
  .orderBy(desc(sql`AVG(${interviewFeedback.overallRating})`))
  .limit(limit);
  
  return topCandidates;
}

export async function getInterviewerPerformanceMetrics(employerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Aggregate metrics by interviewer
  const metrics = await db.select({
    interviewerId: interviewFeedback.interviewerId,
    interviewerName: users.name,
    interviewerEmail: users.email,
    totalFeedbacks: sql<number>`COUNT(${interviewFeedback.id})`,
    avgOverallRating: sql<number>`AVG(${interviewFeedback.overallRating})`,
    strongHireRate: sql<number>`SUM(CASE WHEN ${interviewFeedback.recommendation} = 'strong_hire' THEN 1 ELSE 0 END) * 100.0 / COUNT(${interviewFeedback.id})`,
    hireRate: sql<number>`SUM(CASE WHEN ${interviewFeedback.recommendation} IN ('strong_hire', 'hire') THEN 1 ELSE 0 END) * 100.0 / COUNT(${interviewFeedback.id})`,
    noHireRate: sql<number>`SUM(CASE WHEN ${interviewFeedback.recommendation} IN ('no_hire', 'strong_no_hire') THEN 1 ELSE 0 END) * 100.0 / COUNT(${interviewFeedback.id})`
  })
  .from(interviewFeedback)
  .innerJoin(users, eq(interviewFeedback.interviewerId, users.id))
  .innerJoin(candidates, eq(interviewFeedback.candidateId, candidates.id))
  .where(eq(candidates.userId, employerId))
  .groupBy(interviewFeedback.interviewerId, users.name, users.email);
  
  return metrics;
}

export async function getRecommendationDistribution(employerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const distribution = await db.select({
    recommendation: interviewFeedback.recommendation,
    count: sql<number>`COUNT(*)`
  })
  .from(interviewFeedback)
  .innerJoin(candidates, eq(interviewFeedback.candidateId, candidates.id))
  .where(eq(candidates.userId, employerId))
  .groupBy(interviewFeedback.recommendation);
  
  return distribution;
}

// Feedback Templates
export async function getFeedbackTemplatesByEmployerId(employerId: number): Promise<FeedbackTemplate[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(feedbackTemplates)
    .where(eq(feedbackTemplates.employerId, employerId))
    .orderBy(desc(feedbackTemplates.createdAt));
}

export async function createFeedbackTemplate(data: InsertFeedbackTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(feedbackTemplates).values(data);
  return result[0];
}

// ============================================
// ADVANCED ANALYTICS & AUTOMATION HELPERS
// ============================================

/**
 * Get A/B test insights with historical performance data
 */
export async function getABTestInsights(testId?: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const query = db
      .select()
      .from(abTestInsights as any);
    
    if (testId) {
      query.where(eq((abTestInsights as any).testId, testId));
    }
    
    const results = await query.orderBy(desc((abTestInsights as any).createdAt));
    return results;
  } catch (error) {
    console.error("[Database] Failed to get AB test insights:", error);
    return [];
  }
}

/**
 * Create A/B test insight record
 */
export async function createABTestInsight(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const [result] = await db.insert(abTestInsights as any).values(data);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create AB test insight:", error);
    throw error;
  }
}

/**
 * Get template performance metrics for a specific template
 */
export async function getTemplatePerformanceMetrics(templateId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];

  try {
    const results = await db
      .select()
      .from(templatePerformanceMetrics as any)
      .where(eq((templatePerformanceMetrics as any).templateId, templateId))
      .orderBy(desc((templatePerformanceMetrics as any).periodStart))
      .limit(limit);
    
    return results;
  } catch (error) {
    console.error("[Database] Failed to get template performance metrics:", error);
    return [];
  }
}

/**
 * Create template performance metric record
 */
export async function createTemplatePerformanceMetric(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const [result] = await db.insert(templatePerformanceMetrics as any).values(data);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create template performance metric:", error);
    throw error;
  }
}

/**
 * Get template performance alert configuration
 */
export async function getTemplateAlertConfig(templateId?: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const query = db
      .select()
      .from(templatePerformanceAlertConfig as any);
    
    if (templateId) {
      query.where(eq((templatePerformanceAlertConfig as any).templateId, templateId));
    }
    
    const results = await query;
    return results;
  } catch (error) {
    console.error("[Database] Failed to get template alert config:", error);
    return [];
  }
}

/**
 * Create or update template alert configuration
 */
export async function upsertTemplateAlertConfig(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const [result] = await db
      .insert(templatePerformanceAlertConfig as any)
      .values(data)
      .onDuplicateKeyUpdate({ set: data });
    return result;
  } catch (error) {
    console.error("[Database] Failed to upsert template alert config:", error);
    throw error;
  }
}

/**
 * Get template performance alert history
 */
export async function getTemplateAlertHistory(templateId?: number, acknowledged?: boolean) {
  const db = await getDb();
  if (!db) return [];

  try {
    let query = db
      .select()
      .from(templatePerformanceAlertHistory as any);
    
    const conditions = [];
    if (templateId) {
      conditions.push(eq((templatePerformanceAlertHistory as any).templateId, templateId));
    }
    if (acknowledged !== undefined) {
      conditions.push(eq((templatePerformanceAlertHistory as any).acknowledged, acknowledged ? 1 : 0));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions) as any);
    }
    
    const results = await query.orderBy(desc((templatePerformanceAlertHistory as any).createdAt));
    return results;
  } catch (error) {
    console.error("[Database] Failed to get template alert history:", error);
    return [];
  }
}

/**
 * Create template performance alert
 */
export async function createTemplateAlert(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const [result] = await db.insert(templatePerformanceAlertHistory as any).values(data);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create template alert:", error);
    throw error;
  }
}

/**
 * Acknowledge template alert
 */
export async function acknowledgeTemplateAlert(alertId: number, userId: number, actionTaken?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db
      .update(templatePerformanceAlertHistory as any)
      .set({
        acknowledged: 1,
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
        actionTaken: actionTaken || null,
      })
      .where(eq((templatePerformanceAlertHistory as any).id, alertId));
    
    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to acknowledge template alert:", error);
    throw error;
  }
}

/**
 * Get campaign schedule predictions for candidates
 */
export async function getCampaignSchedulePredictions(candidateIds?: number[]) {
  const db = await getDb();
  if (!db) return [];

  try {
    let query = db
      .select()
      .from(campaignSchedulePredictions as any);
    
    if (candidateIds && candidateIds.length > 0) {
      query = query.where(inArray((campaignSchedulePredictions as any).candidateId, candidateIds) as any);
    }
    
    const results = await query.orderBy(desc((campaignSchedulePredictions as any).updatedAt));
    return results;
  } catch (error) {
    console.error("[Database] Failed to get campaign schedule predictions:", error);
    return [];
  }
}

/**
 * Create or update campaign schedule prediction
 */
export async function upsertCampaignSchedulePrediction(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const [result] = await db
      .insert(campaignSchedulePredictions as any)
      .values(data)
      .onDuplicateKeyUpdate({ set: data });
    return result;
  } catch (error) {
    console.error("[Database] Failed to upsert campaign schedule prediction:", error);
    throw error;
  }
}

/**
 * Get scheduled campaign queue items
 */
export async function getScheduledCampaignQueue(status?: string, limit = 100) {
  const db = await getDb();
  if (!db) return [];

  try {
    let query = db
      .select()
      .from(scheduledCampaignQueue as any);
    
    if (status) {
      query = query.where(eq((scheduledCampaignQueue as any).status, status));
    }
    
    const results = await query
      .orderBy(
        desc((scheduledCampaignQueue as any).priority),
        asc((scheduledCampaignQueue as any).scheduledSendTime)
      )
      .limit(limit);
    
    return results;
  } catch (error) {
    console.error("[Database] Failed to get scheduled campaign queue:", error);
    return [];
  }
}

/**
 * Add campaign to scheduled queue
 */
export async function addToScheduledCampaignQueue(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const [result] = await db.insert(scheduledCampaignQueue as any).values(data);
    return result;
  } catch (error) {
    console.error("[Database] Failed to add to scheduled campaign queue:", error);
    throw error;
  }
}

/**
 * Update scheduled campaign queue item status
 */
export async function updateScheduledCampaignStatus(queueId: number, status: string, sentAt?: Date, failureReason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const updateData: any = { status };
    if (sentAt) updateData.sentAt = sentAt;
    if (failureReason) updateData.failureReason = failureReason;
    
    await db
      .update(scheduledCampaignQueue as any)
      .set(updateData)
      .where(eq((scheduledCampaignQueue as any).id, queueId));
    
    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to update scheduled campaign status:", error);
    throw error;
  }
}

/**
 * Get campaign send time analytics
 */
export async function getCampaignSendTimeAnalytics(campaignId?: number, timezone?: string) {
  const db = await getDb();
  if (!db) return [];

  try {
    let query = db
      .select()
      .from(campaignSendTimeAnalytics as any);
    
    const conditions = [];
    if (campaignId) {
      conditions.push(eq((campaignSendTimeAnalytics as any).campaignId, campaignId));
    }
    if (timezone) {
      conditions.push(eq((campaignSendTimeAnalytics as any).timezone, timezone));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions) as any);
    }
    
    const results = await query.orderBy(desc((campaignSendTimeAnalytics as any).periodStart));
    return results;
  } catch (error) {
    console.error("[Database] Failed to get campaign send time analytics:", error);
    return [];
  }
}

/**
 * Create campaign send time analytics record
 */
export async function createCampaignSendTimeAnalytics(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const [result] = await db.insert(campaignSendTimeAnalytics as any).values(data);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create campaign send time analytics:", error);
    throw error;
  }
}
