import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { applications, applicationTimeline, interviews, interviewFeedback, candidates, jobs } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Application Timeline Router
 * Provides complete application lifecycle visibility with status updates,
 * interview schedules, and feedback collection
 */

export const applicationTimelineRouter = router({
  /**
   * Get complete timeline for a specific application
   */
  getTimeline: protectedProcedure
    .input(z.object({
      applicationId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get application details
      const [application] = await db
        .select({
          id: applications.id,
          status: applications.status,
          createdAt: applications.createdAt,
          candidate: {
            id: candidates.id,
            fullName: candidates.fullName,
            email: candidates.email,
          },
          job: {
            id: jobs.id,
            title: jobs.title,
            employerId: jobs.employerId,
          },
        })
        .from(applications)
        .leftJoin(candidates, eq(applications.candidateId, candidates.id))
        .leftJoin(jobs, eq(applications.jobId, jobs.id))
        .where(eq(applications.id, input.applicationId))
        .limit(1);

      if (!application) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Application not found" });
      }

      // Get timeline events
      const events = await db
        .select()
        .from(applicationTimeline)
        .where(eq(applicationTimeline.applicationId, input.applicationId))
        .orderBy(desc(applicationTimeline.createdAt));

      // Get related interviews
      const relatedInterviews = await db
        .select({
          id: interviews.id,
          scheduledAt: interviews.scheduledAt,
          status: interviews.status,
          interviewerName: interviews.interviewerName,
          location: interviews.location,
          notes: interviews.notes,
        })
        .from(interviews)
        .where(eq(interviews.candidateId, application.candidate.id))
        .orderBy(desc(interviews.scheduledAt));

      // Get feedback for interviews
      const feedbackList = await db
        .select()
        .from(interviewFeedback)
        .where(
          and(
            eq(interviewFeedback.candidateId, application.candidate.id)
          )
        )
        .orderBy(desc(interviewFeedback.createdAt));

      return {
        application,
        events,
        interviews: relatedInterviews,
        feedback: feedbackList,
      };
    }),

  /**
   * Get all applications for current user (candidate view)
   */
  getMyApplications: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Find candidate record for current user
      const [candidate] = await db
        .select()
        .from(candidates)
        .where(eq(candidates.userId, ctx.user.id))
        .limit(1);

      if (!candidate) {
        return [];
      }

      // Get all applications with job details
      const userApplications = await db
        .select({
          id: applications.id,
          status: applications.status,
          overallMatchScore: applications.overallMatchScore,
          createdAt: applications.createdAt,
          updatedAt: applications.updatedAt,
          job: {
            id: jobs.id,
            title: jobs.title,
            location: jobs.location,
            employmentType: jobs.employmentType,
          },
        })
        .from(applications)
        .leftJoin(jobs, eq(applications.jobId, jobs.id))
        .where(eq(applications.candidateId, candidate.id))
        .orderBy(desc(applications.updatedAt));

      return userApplications;
    }),

  /**
   * Add a new event to application timeline
   */
  addEvent: protectedProcedure
    .input(z.object({
      applicationId: z.number(),
      eventType: z.enum([
        "submitted",
        "viewed",
        "screening",
        "interview_scheduled",
        "interview_completed",
        "feedback_received",
        "offer_extended",
        "offer_accepted",
        "offer_declined",
        "rejected",
        "withdrawn"
      ]),
      title: z.string(),
      description: z.string().optional(),
      metadata: z.record(z.any()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [event] = await db
        .insert(applicationTimeline)
        .values({
          applicationId: input.applicationId,
          eventType: input.eventType,
          title: input.title,
          description: input.description,
          performedBy: ctx.user.id,
          metadata: input.metadata,
        })
        .$returningId();

      return { success: true, eventId: event.id };
    }),

  /**
   * Update application status and create timeline event
   */
  updateStatus: protectedProcedure
    .input(z.object({
      applicationId: z.number(),
      status: z.enum(["submitted", "screening", "interviewing", "offered", "rejected"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Update application status
      await db
        .update(applications)
        .set({ status: input.status })
        .where(eq(applications.id, input.applicationId));

      // Create timeline event
      const eventTitles: Record<string, string> = {
        submitted: "Application Submitted",
        screening: "Under Screening",
        interviewing: "Interview Stage",
        offered: "Offer Extended",
        rejected: "Application Rejected",
      };

      await db
        .insert(applicationTimeline)
        .values({
          applicationId: input.applicationId,
          eventType: input.status === "submitted" ? "submitted" : 
                     input.status === "screening" ? "screening" :
                     input.status === "interviewing" ? "interview_scheduled" :
                     input.status === "offered" ? "offer_extended" : "rejected",
          title: eventTitles[input.status] || "Status Updated",
          description: input.notes,
          performedBy: ctx.user.id,
        });

      return { success: true };
    }),
});
