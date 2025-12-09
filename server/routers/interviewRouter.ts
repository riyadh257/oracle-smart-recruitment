import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  checkInterviewConflicts,
  suggestAlternativeSlots,
  scheduleInterview,
  rescheduleInterview,
  getEmployerInterviews,
  getInterviewsForDateRange,
  cancelInterview,
  getCandidateInterviews,
  logInterviewConflict,
} from "../interviews";
import { jobs } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { sendInterviewCalendarInvite, notifyEmployerInterviewScheduled } from "../emailNotifications";
import { getDb } from "../db";
import { candidates, employers } from "../../drizzle/schema";

/**
 * Interview Scheduling Router with Conflict Detection
 */
export const interviewRouter = router({
  /**
   * Check for scheduling conflicts in real-time
   */
  checkConflicts: protectedProcedure
    .input(
      z.object({
        employerId: z.number(),
        scheduledAt: z.string().transform((str) => new Date(str)),
        duration: z.number().default(60),
        excludeInterviewId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const result = await checkInterviewConflicts(
        input.employerId,
        input.scheduledAt,
        input.duration,
        input.excludeInterviewId
      );

      return {
        hasConflict: result.hasConflict,
        conflicts: result.conflicts,
        conflictType: result.conflictType,
      };
    }),

  /**
   * Get suggested alternative time slots
   */
  suggestSlots: protectedProcedure
    .input(
      z.object({
        employerId: z.number(),
        preferredDate: z.string().transform((str) => new Date(str)),
        duration: z.number().default(60),
        numberOfSuggestions: z.number().default(5),
      })
    )
    .query(async ({ input }) => {
      const suggestions = await suggestAlternativeSlots(
        input.employerId,
        input.preferredDate,
        input.duration,
        input.numberOfSuggestions
      );

      return {
        suggestions: suggestions.map((date) => date.toISOString()),
      };
    }),

  /**
   * Schedule a new interview
   */
  schedule: protectedProcedure
    .input(
      z.object({
        applicationId: z.number(),
        employerId: z.number(),
        candidateId: z.number(),
        jobId: z.number(),
        scheduledAt: z.string().transform((str) => new Date(str)),
        duration: z.number().default(60),
        interviewType: z
          .enum(["phone", "video", "onsite", "technical"])
          .default("video"),
        location: z.string().optional(),
        notes: z.string().optional(),
        templateId: z.number().optional(),
        forceSchedule: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      const { forceSchedule, ...interviewData } = input;

      const result = await scheduleInterview(interviewData, forceSchedule);

      if (!result.success) {
        if (result.conflicts) {
          // Log the conflict
          await logInterviewConflict({
            employerId: input.employerId,
            conflictDate: input.scheduledAt,
            conflictingInterviewIds: result.conflicts.map((c) => c.id),
            conflictType: "overlapping",
            resolved: false,
          });

          // Return conflict information
          return {
            success: false,
            conflicts: result.conflicts,
            message: result.message,
          };
        }

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.message || "Failed to schedule interview",
        });
      }

      // Send email notifications with QR code
      if (result.interview) {
        try {
          const db = await getDb();
          if (db) {
            const candidate = await db.select().from(candidates).where(eq(candidates.id, input.candidateId)).limit(1);
            const employer = await db.select().from(employers).where(eq(employers.id, input.employerId)).limit(1);
            const job = await db.select().from(jobs).where(eq(jobs.id, input.jobId)).limit(1);
            
            if (candidate[0] && employer[0] && job[0]) {
              const baseUrl = process.env.VITE_APP_URL || "http://localhost:3000";
              
              // Send calendar invite with QR code to candidate
              await sendInterviewCalendarInvite(
                candidate[0].fullName,
                candidate[0].email,
                employer[0].companyName,
                job[0].title,
                employer[0].companyName,
                input.scheduledAt,
                input.duration,
                input.location,
                input.notes,
                result.interview.id,
                baseUrl
              );
              
              // Notify employer
              await notifyEmployerInterviewScheduled(
                employer[0].companyName,
                employer[0].contactEmail || "",
                candidate[0].fullName,
                job[0].title,
                input.scheduledAt,
                input.location
              );
            }
          }
        } catch (emailError) {
          console.error("Failed to send interview notifications:", emailError);
          // Don't fail the interview scheduling if email fails
        }
      }

      return {
        success: true,
        interview: result.interview,
        message: result.message,
      };
    }),

  /**
   * Reschedule an existing interview
   */
  reschedule: protectedProcedure
    .input(
      z.object({
        interviewId: z.number(),
        newScheduledAt: z.string().transform((str) => new Date(str)),
        newDuration: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await rescheduleInterview(
        input.interviewId,
        input.newScheduledAt,
        input.newDuration
      );

      if (!result.success) {
        if (result.conflicts) {
          return {
            success: false,
            conflicts: result.conflicts,
            message: result.message,
          };
        }

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.message || "Failed to reschedule interview",
        });
      }

      return {
        success: true,
        interview: result.interview,
        message: result.message,
      };
    }),

  /**
   * Get all interviews for an employer
   */
  getEmployerInterviews: protectedProcedure
    .input(
      z.object({
        employerId: z.number(),
        status: z
          .enum(["scheduled", "completed", "cancelled", "rescheduled"])
          .optional(),
        startDate: z.string().transform((str) => new Date(str)).optional(),
        endDate: z.string().transform((str) => new Date(str)).optional(),
        candidateId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const { employerId, ...filters } = input;
      return await getEmployerInterviews(employerId, filters);
    }),

  /**
   * Get interviews for a date range (calendar view)
   */
  getCalendarInterviews: protectedProcedure
    .input(
      z.object({
        employerId: z.number(),
        startDate: z.string().transform((str) => new Date(str)),
        endDate: z.string().transform((str) => new Date(str)),
      })
    )
    .query(async ({ input }) => {
      return await getInterviewsForDateRange(
        input.employerId,
        input.startDate,
        input.endDate
      );
    }),

  /**
   * Cancel an interview
   */
  cancel: protectedProcedure
    .input(
      z.object({
        interviewId: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await cancelInterview(input.interviewId, input.reason);

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.message || "Failed to cancel interview",
        });
      }

      return {
        success: true,
        message: result.message,
      };
    }),

  /**
   * Get candidate interviews (alias)
   */
  getByCandidateId: protectedProcedure
    .input(z.object({ candidateId: z.number() }))
    .query(async ({ input }) => {
      const interviews = await getCandidateInterviews(input.candidateId);
      
      // Enrich with job details
      const db = await import("../db").then(m => m.getDb());
      if (!db) return interviews;
      
      const enriched = await Promise.all(
        interviews.map(async (interview) => {
          const job = await db
            .select()
            .from(jobs)
            .where(eq(jobs.id, interview.jobId))
            .limit(1);
          
          return {
            ...interview,
            job: job[0] || null,
          };
        })
      );
      
      return enriched;
    }),

  /**
   * Get candidate interviews
   */
  getCandidateInterviews: protectedProcedure
    .input(
      z.object({
        candidateId: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await getCandidateInterviews(input.candidateId);
    }),
});
