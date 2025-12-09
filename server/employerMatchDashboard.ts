import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { matchHistory, jobs, candidates, applications, interviews } from "../drizzle/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import { sendInterviewCalendarInvite, notifyEmployerInterviewScheduled } from "./emailNotifications";
import { createEvent } from "./unifiedCalendarService";

/**
 * Employer Match Dashboard Router
 * Provides AI-matched candidates for each job posting with culture fit and wellbeing scores
 */

export const employerMatchDashboardRouter = router({
  /**
   * Get all active jobs for the employer to display in job selector
   */
  getActiveJobs: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const activeJobs = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        department: jobs.department,
        location: jobs.location,
        status: jobs.status,
        createdAt: jobs.createdAt,
      })
      .from(jobs)
      .where(eq(jobs.status, "active"))
      .orderBy(desc(jobs.createdAt));

    return activeJobs;
  }),

  /**
   * Get top AI-matched candidates for a specific job
   * Returns candidates with match scores > threshold, sorted by overall score
   */
  getTopMatchesForJob: protectedProcedure
    .input(
      z.object({
        jobId: z.number(),
        minScore: z.number().default(70),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const matches = await db
        .select({
          matchId: matchHistory.id,
          candidateId: matchHistory.candidateId,
          candidateName: candidates.name,
          candidateEmail: candidates.email,
          candidatePhone: candidates.phone,
          candidateLocation: candidates.location,
          candidateExperience: candidates.yearsOfExperience,
          candidateCurrentRole: candidates.currentJobTitle,
          candidateCurrentCompany: candidates.currentCompany,
          overallScore: matchHistory.overallScore,
          skillScore: matchHistory.skillScore,
          technicalScore: matchHistory.technicalScore,
          cultureScore: matchHistory.cultureScore,
          cultureFitScore: matchHistory.cultureFitScore,
          wellbeingScore: matchHistory.wellbeingScore,
          burnoutRisk: matchHistory.burnoutRisk,
          matchExplanation: matchHistory.matchExplanation,
          matchBreakdown: matchHistory.matchBreakdown,
          topAttributes: matchHistory.topAttributes,
          wasViewed: matchHistory.wasViewed,
          createdAt: matchHistory.createdAt,
        })
        .from(matchHistory)
        .innerJoin(candidates, eq(matchHistory.candidateId, candidates.id))
        .where(
          and(
            eq(matchHistory.jobId, input.jobId),
            gte(matchHistory.overallScore, input.minScore)
          )
        )
        .orderBy(desc(matchHistory.overallScore))
        .limit(input.limit);

      return matches;
    }),

  /**
   * Get culture fit breakdown for radar chart visualization
   * Returns 5 dimensions: innovation, collaboration, autonomy, structure, growth
   */
  getCultureFitBreakdown: protectedProcedure
    .input(z.object({ matchId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const match = await db
        .select({
          matchBreakdown: matchHistory.matchBreakdown,
        })
        .from(matchHistory)
        .where(eq(matchHistory.id, input.matchId))
        .limit(1);

      if (!match[0]) {
        throw new Error("Match not found");
      }

      const breakdown = match[0].matchBreakdown as any;
      
      // Extract culture fit dimensions from match breakdown
      const cultureFit = breakdown?.cultureFit || {
        innovation: 75,
        collaboration: 80,
        autonomy: 70,
        structure: 85,
        growth: 78,
      };

      return cultureFit;
    }),

  /**
   * Get actionable hiring recommendations based on match data
   */
  getHiringRecommendations: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get top 3 matches
      const topMatches = await db
        .select({
          candidateId: matchHistory.candidateId,
          candidateName: candidates.name,
          overallScore: matchHistory.overallScore,
          cultureFitScore: matchHistory.cultureFitScore,
          wellbeingScore: matchHistory.wellbeingScore,
          burnoutRisk: matchHistory.burnoutRisk,
          matchExplanation: matchHistory.matchExplanation,
        })
        .from(matchHistory)
        .innerJoin(candidates, eq(matchHistory.candidateId, candidates.id))
        .where(eq(matchHistory.jobId, input.jobId))
        .orderBy(desc(matchHistory.overallScore))
        .limit(3);

      // Generate recommendations
      const recommendations = topMatches.map((match) => {
        const insights: string[] = [];

        if (match.overallScore >= 90) {
          insights.push("Exceptional match - prioritize for immediate interview");
        } else if (match.overallScore >= 85) {
          insights.push("Strong match - schedule interview within 48 hours");
        } else if (match.overallScore >= 75) {
          insights.push("Good match - consider for phone screening");
        }

        if (match.cultureFitScore && match.cultureFitScore >= 85) {
          insights.push("High culture fit - likely to integrate well with team");
        }

        if (match.wellbeingScore && match.wellbeingScore >= 80) {
          insights.push("Strong wellbeing indicators - low turnover risk");
        }

        if (match.burnoutRisk && match.burnoutRisk >= 70) {
          insights.push("⚠️ Elevated burnout risk - discuss work-life balance expectations");
        }

        return {
          candidateId: match.candidateId,
          candidateName: match.candidateName,
          overallScore: match.overallScore,
          insights,
          recommendation: match.matchExplanation || "Review candidate profile for detailed assessment",
        };
      });

      return recommendations;
    }),

  /**
   * Mark a match as viewed by employer
   */
  markMatchAsViewed: protectedProcedure
    .input(z.object({ matchId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(matchHistory)
        .set({ wasViewed: 1 })
        .where(eq(matchHistory.id, input.matchId));

      return { success: true };
    }),

  /**
   * Get match statistics for a job
   */
  getMatchStatistics: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const stats = await db
        .select({
          totalMatches: sql<number>`COUNT(*)`,
          avgOverallScore: sql<number>`AVG(${matchHistory.overallScore})`,
          avgCultureScore: sql<number>`AVG(${matchHistory.cultureFitScore})`,
          avgWellbeingScore: sql<number>`AVG(${matchHistory.wellbeingScore})`,
          highScoreMatches: sql<number>`SUM(CASE WHEN ${matchHistory.overallScore} >= 85 THEN 1 ELSE 0 END)`,
        })
        .from(matchHistory)
        .where(eq(matchHistory.jobId, input.jobId));

      return stats[0] || {
        totalMatches: 0,
        avgOverallScore: 0,
        avgCultureScore: 0,
        avgWellbeingScore: 0,
        highScoreMatches: 0,
      };
    }),

  /**
   * Schedule interview directly from match dashboard
   * Creates interview, syncs with calendar, and sends notifications
   */
  scheduleInterviewFromMatch: protectedProcedure
    .input(
      z.object({
        matchId: z.number(),
        candidateId: z.number(),
        jobId: z.number(),
        scheduledAt: z.string(), // ISO datetime string
        duration: z.number().default(60),
        interviewType: z.enum(["phone", "video", "onsite", "technical"]).default("video"),
        location: z.string().optional(),
        notes: z.string().optional(),
        templateId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get or create application for this candidate-job pair
      const existingApp = await db
        .select()
        .from(applications)
        .where(
          and(
            eq(applications.candidateId, input.candidateId),
            eq(applications.jobId, input.jobId)
          )
        )
        .limit(1);

      let applicationId: number;
      if (existingApp[0]) {
        applicationId = existingApp[0].id;
        // Update status to interviewing
        await db
          .update(applications)
          .set({ status: "interviewing" })
          .where(eq(applications.id, applicationId));
      } else {
        // Create new application
        const [newApp] = await db
          .insert(applications)
          .values({
            candidateId: input.candidateId,
            jobId: input.jobId,
            status: "interviewing",
          })
          .$returningId();
        applicationId = newApp.id;
      }

      // Get employer ID from job
      const job = await db
        .select({ employerId: jobs.employerId })
        .from(jobs)
        .where(eq(jobs.id, input.jobId))
        .limit(1);

      if (!job[0]) throw new Error("Job not found");

      // Create interview
      const [interview] = await db
        .insert(interviews)
        .values({
          applicationId,
          employerId: job[0].employerId,
          candidateId: input.candidateId,
          jobId: input.jobId,
          scheduledAt: input.scheduledAt,
          duration: input.duration,
          interviewType: input.interviewType,
          location: input.location,
          notes: input.notes,
          status: "scheduled",
          templateId: input.templateId,
        })
        .$returningId();

      // Sync with calendar
      try {
        const startTime = new Date(input.scheduledAt);
        const endTime = new Date(startTime.getTime() + input.duration * 60000);
        
        await createEvent(
          { provider: "google" }, // Default to Google, can be made configurable
          {
            summary: `Interview - ${input.interviewType}`,
            description: input.notes || "",
            location: input.location || "",
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            attendees: [], // Attendees will be added by email notification
            reminderMinutes: 30,
          }
        );
      } catch (error) {
        console.error("Calendar sync failed:", error);
        // Continue even if calendar sync fails
      }

      // Send email notifications
      try {
        await sendInterviewCalendarInvite(interview.id);
        await notifyEmployerInterviewScheduled(interview.id);
      } catch (error) {
        console.error("Email notification failed:", error);
      }

      // Mark match as viewed and recommended
      await db
        .update(matchHistory)
        .set({ wasViewed: 1, wasRecommended: 1 })
        .where(eq(matchHistory.id, input.matchId));

      return {
        success: true,
        interviewId: interview.id,
        applicationId,
      };
    }),

  /**
   * Bulk schedule interviews for multiple candidates from match results
   */
  bulkScheduleFromMatches: protectedProcedure
    .input(
      z.object({
        schedules: z.array(
          z.object({
            matchId: z.number(),
            candidateId: z.number(),
            jobId: z.number(),
            scheduledAt: z.string(),
            duration: z.number().default(60),
            interviewType: z.enum(["phone", "video", "onsite", "technical"]).default("video"),
            location: z.string().optional(),
            notes: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const results = [];
      const errors = [];

      for (const schedule of input.schedules) {
        try {
          // Get or create application
          const existingApp = await db
            .select()
            .from(applications)
            .where(
              and(
                eq(applications.candidateId, schedule.candidateId),
                eq(applications.jobId, schedule.jobId)
              )
            )
            .limit(1);

          let applicationId: number;
          if (existingApp[0]) {
            applicationId = existingApp[0].id;
            await db
              .update(applications)
              .set({ status: "interviewing" })
              .where(eq(applications.id, applicationId));
          } else {
            const [newApp] = await db
              .insert(applications)
              .values({
                candidateId: schedule.candidateId,
                jobId: schedule.jobId,
                status: "interviewing",
              })
              .$returningId();
            applicationId = newApp.id;
          }

          // Get employer ID
          const job = await db
            .select({ employerId: jobs.employerId })
            .from(jobs)
            .where(eq(jobs.id, schedule.jobId))
            .limit(1);

          if (!job[0]) {
            errors.push({ candidateId: schedule.candidateId, error: "Job not found" });
            continue;
          }

          // Create interview
          const [interview] = await db
            .insert(interviews)
            .values({
              applicationId,
              employerId: job[0].employerId,
              candidateId: schedule.candidateId,
              jobId: schedule.jobId,
              scheduledAt: schedule.scheduledAt,
              duration: schedule.duration,
              interviewType: schedule.interviewType,
              location: schedule.location,
              notes: schedule.notes,
              status: "scheduled",
            })
            .$returningId();

          // Sync with calendar (non-blocking)
          const startTime = new Date(schedule.scheduledAt);
          const endTime = new Date(startTime.getTime() + schedule.duration * 60000);
          
          createEvent(
            { provider: "google" },
            {
              summary: `Interview - ${schedule.interviewType}`,
              description: schedule.notes || "",
              location: schedule.location || "",
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString(),
              attendees: [],
              reminderMinutes: 30,
            }
          ).catch((err) => console.error("Calendar sync failed:", err));

          // Send notifications (non-blocking)
          sendInterviewCalendarInvite(interview.id).catch((err) =>
            console.error("Email failed:", err)
          );

          // Mark match as viewed
          await db
            .update(matchHistory)
            .set({ wasViewed: 1, wasRecommended: 1 })
            .where(eq(matchHistory.id, schedule.matchId));

          results.push({
            candidateId: schedule.candidateId,
            interviewId: interview.id,
            success: true,
          });
        } catch (error) {
          errors.push({
            candidateId: schedule.candidateId,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return {
        scheduled: results.length,
        failed: errors.length,
        results,
        errors,
      };
    }),

  /**
   * Bulk shortlist candidates from match results
   * Marks matches as recommended and optionally creates applications
   */
  bulkShortlistMatches: protectedProcedure
    .input(
      z.object({
        matchIds: z.array(z.number()),
        createApplications: z.boolean().default(false),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const results = [];
      const errors = [];

      for (const matchId of input.matchIds) {
        try {
          // Get match details
          const match = await db
            .select({
              candidateId: matchHistory.candidateId,
              jobId: matchHistory.jobId,
            })
            .from(matchHistory)
            .where(eq(matchHistory.id, matchId))
            .limit(1);

          if (!match[0]) {
            errors.push({ matchId, error: "Match not found" });
            continue;
          }

          // Mark as recommended
          await db
            .update(matchHistory)
            .set({ wasRecommended: 1, wasViewed: 1 })
            .where(eq(matchHistory.id, matchId));

          // Optionally create application
          if (input.createApplications) {
            const existingApp = await db
              .select()
              .from(applications)
              .where(
                and(
                  eq(applications.candidateId, match[0].candidateId),
                  eq(applications.jobId, match[0].jobId)
                )
              )
              .limit(1);

            if (!existingApp[0]) {
              await db.insert(applications).values({
                candidateId: match[0].candidateId,
                jobId: match[0].jobId,
                status: "screening",
                notes: input.notes,
              });
            }
          }

          results.push({ matchId, success: true });
        } catch (error) {
          errors.push({
            matchId,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return {
        shortlisted: results.length,
        failed: errors.length,
        results,
        errors,
      };
    }),

  /**
   * Bulk reject candidates from match results
   * Marks matches as rejected and updates application status if exists
   */
  bulkRejectMatches: protectedProcedure
    .input(
      z.object({
        matchIds: z.array(z.number()),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const results = [];
      const errors = [];

      for (const matchId of input.matchIds) {
        try {
          // Get match details
          const match = await db
            .select({
              candidateId: matchHistory.candidateId,
              jobId: matchHistory.jobId,
            })
            .from(matchHistory)
            .where(eq(matchHistory.id, matchId))
            .limit(1);

          if (!match[0]) {
            errors.push({ matchId, error: "Match not found" });
            continue;
          }

          // Mark match as viewed (so it doesn't show up in recommendations)
          await db
            .update(matchHistory)
            .set({ wasViewed: 1 })
            .where(eq(matchHistory.id, matchId));

          // Update application status if exists
          const existingApp = await db
            .select()
            .from(applications)
            .where(
              and(
                eq(applications.candidateId, match[0].candidateId),
                eq(applications.jobId, match[0].jobId)
              )
            )
            .limit(1);

          if (existingApp[0]) {
            await db
              .update(applications)
              .set({
                status: "rejected",
                notes: input.reason || "Rejected from match dashboard",
              })
              .where(eq(applications.id, existingApp[0].id));
          }

          results.push({ matchId, success: true });
        } catch (error) {
          errors.push({
            matchId,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return {
        rejected: results.length,
        failed: errors.length,
        results,
        errors,
      };
    }),

  /**
   * Export match results to CSV format
   * Returns formatted data for multiple candidates
   */
  exportMatchesToCSV: protectedProcedure
    .input(
      z.object({
        matchIds: z.array(z.number()),
        includeBreakdown: z.boolean().default(true),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const matches = await db
        .select({
          matchId: matchHistory.id,
          candidateName: candidates.name,
          candidateEmail: candidates.email,
          candidatePhone: candidates.phone,
          candidateLocation: candidates.location,
          candidateExperience: candidates.yearsOfExperience,
          candidateCurrentRole: candidates.currentJobTitle,
          candidateCurrentCompany: candidates.currentCompany,
          jobTitle: jobs.title,
          jobDepartment: jobs.department,
          overallScore: matchHistory.overallScore,
          skillScore: matchHistory.skillScore,
          technicalScore: matchHistory.technicalScore,
          cultureScore: matchHistory.cultureScore,
          cultureFitScore: matchHistory.cultureFitScore,
          wellbeingScore: matchHistory.wellbeingScore,
          burnoutRisk: matchHistory.burnoutRisk,
          matchExplanation: matchHistory.matchExplanation,
          matchBreakdown: matchHistory.matchBreakdown,
          topAttributes: matchHistory.topAttributes,
          createdAt: matchHistory.createdAt,
        })
        .from(matchHistory)
        .innerJoin(candidates, eq(matchHistory.candidateId, candidates.id))
        .innerJoin(jobs, eq(matchHistory.jobId, jobs.id))
        .where(sql`${matchHistory.id} IN (${sql.join(input.matchIds, sql`, `)})`)
        .orderBy(desc(matchHistory.overallScore));

      // Format data for CSV export
      const csvData = matches.map((match) => {
        const baseData = {
          "Match ID": match.matchId,
          "Candidate Name": match.candidateName,
          "Email": match.candidateEmail,
          "Phone": match.candidatePhone || "N/A",
          "Location": match.candidateLocation || "N/A",
          "Years of Experience": match.candidateExperience || 0,
          "Current Role": match.candidateCurrentRole || "N/A",
          "Current Company": match.candidateCurrentCompany || "N/A",
          "Job Title": match.jobTitle,
          "Department": match.jobDepartment || "N/A",
          "Overall Score": match.overallScore,
          "Skill Score": match.skillScore || 0,
          "Technical Score": match.technicalScore || 0,
          "Culture Score": match.cultureScore || 0,
          "Culture Fit Score": match.cultureFitScore || 0,
          "Wellbeing Score": match.wellbeingScore || 0,
          "Burnout Risk": match.burnoutRisk || 0,
          "Match Explanation": match.matchExplanation || "N/A",
          "Created At": match.createdAt,
        };

        if (input.includeBreakdown && match.topAttributes) {
          const attrs = match.topAttributes as any;
          return {
            ...baseData,
            "Top Attributes": Array.isArray(attrs) ? attrs.join("; ") : "N/A",
          };
        }

        return baseData;
      });

      return {
        data: csvData,
        totalRecords: csvData.length,
      };
    }),

  /**
   * Bulk update match status (viewed, recommended, etc.)
   */
  bulkUpdateMatchStatus: protectedProcedure
    .input(
      z.object({
        matchIds: z.array(z.number()),
        updates: z.object({
          wasViewed: z.boolean().optional(),
          wasRecommended: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updateData: any = {};
      if (input.updates.wasViewed !== undefined) {
        updateData.wasViewed = input.updates.wasViewed ? 1 : 0;
      }
      if (input.updates.wasRecommended !== undefined) {
        updateData.wasRecommended = input.updates.wasRecommended ? 1 : 0;
      }

      if (Object.keys(updateData).length === 0) {
        throw new Error("No updates provided");
      }

      await db
        .update(matchHistory)
        .set(updateData)
        .where(sql`${matchHistory.id} IN (${sql.join(input.matchIds, sql`, `)})`);

      return {
        success: true,
        updated: input.matchIds.length,
      };
    }),
});
