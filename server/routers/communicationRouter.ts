import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  logCommunicationEvent,
  getCandidateCommunications,
  getEmployerCommunications,
  getCommunicationEvent,
  markEventsAsRead,
  getCommunicationSummary,
  getCommunicationSummaries,
  searchCommunications,
  getTimelineStatistics,
} from "../communicationHistory";
import { TRPCError } from "@trpc/server";

/**
 * Communication History Router
 */
export const communicationRouter = router({
  /**
   * Log a new communication event
   */
  logEvent: protectedProcedure
    .input(
      z.object({
        candidateId: z.number(),
        employerId: z.number().optional(),
        applicationId: z.number().optional(),
        eventType: z.enum([
          "email_sent",
          "email_opened",
          "email_clicked",
          "application_submitted",
          "application_viewed",
          "interview_scheduled",
          "interview_completed",
          "interview_cancelled",
          "status_changed",
          "note_added",
          "document_uploaded",
          "message_sent",
          "message_received",
        ]),
        eventTitle: z.string(),
        eventDescription: z.string().optional(),
        eventMetadata: z.any().optional(),
        relatedEmailId: z.number().optional(),
        relatedInterviewId: z.number().optional(),
        initiatedBy: z.enum(["candidate", "employer", "system"]),
        eventTimestamp: z.string().transform((str) => new Date(str)),
      })
    )
    .mutation(async ({ input }) => {
      const event = await logCommunicationEvent(input);

      if (!event) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to log communication event",
        });
      }

      return event;
    }),

  /**
   * Get communication timeline for a candidate
   */
  getCandidateTimeline: protectedProcedure
    .input(
      z.object({
        candidateId: z.number(),
        employerId: z.number().optional(),
        applicationId: z.number().optional(),
        eventTypes: z
          .array(
            z.enum([
              "email_sent",
              "email_opened",
              "email_clicked",
              "application_submitted",
              "application_viewed",
              "interview_scheduled",
              "interview_completed",
              "interview_cancelled",
              "status_changed",
              "note_added",
              "document_uploaded",
              "message_sent",
              "message_received",
            ])
          )
          .optional(),
        startDate: z.string().transform((str) => new Date(str)).optional(),
        endDate: z.string().transform((str) => new Date(str)).optional(),
        searchQuery: z.string().optional(),
        isRead: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      const { candidateId, ...filters } = input;
      return await getCandidateCommunications(candidateId, filters);
    }),

  /**
   * Get communications for an employer
   */
  getEmployerCommunications: protectedProcedure
    .input(
      z.object({
        employerId: z.number(),
        candidateId: z.number().optional(),
        applicationId: z.number().optional(),
        eventTypes: z.array(z.string()).optional(),
        startDate: z.string().transform((str) => new Date(str)).optional(),
        endDate: z.string().transform((str) => new Date(str)).optional(),
        isRead: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      const { employerId, ...filters } = input;
      return await getEmployerCommunications(employerId, filters);
    }),

  /**
   * Get a single communication event
   */
  getEvent: protectedProcedure
    .input(
      z.object({
        eventId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const event = await getCommunicationEvent(input.eventId);

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Communication event not found",
        });
      }

      return event;
    }),

  /**
   * Mark events as read
   */
  markAsRead: protectedProcedure
    .input(
      z.object({
        eventIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input }) => {
      const success = await markEventsAsRead(input.eventIds);

      if (!success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to mark events as read",
        });
      }

      return { success: true };
    }),

  /**
   * Get communication summary for a candidate
   */
  getSummary: protectedProcedure
    .input(
      z.object({
        candidateId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const summary = await getCommunicationSummary(input.candidateId);

      if (!summary) {
        return {
          candidateId: input.candidateId,
          totalEmails: 0,
          emailsOpened: 0,
          emailsClicked: 0,
          totalInterviews: 0,
          completedInterviews: 0,
          totalApplications: 0,
          lastContactDate: null,
          engagementScore: 0,
          responseRate: 0,
        };
      }

      return summary;
    }),

  /**
   * Get communication summaries for multiple candidates
   */
  getSummaries: protectedProcedure
    .input(
      z.object({
        candidateIds: z.array(z.number()),
      })
    )
    .query(async ({ input }) => {
      return await getCommunicationSummaries(input.candidateIds);
    }),

  /**
   * Search communications
   */
  search: protectedProcedure
    .input(
      z.object({
        searchQuery: z.string(),
        candidateId: z.number().optional(),
        employerId: z.number().optional(),
        startDate: z.string().transform((str) => new Date(str)).optional(),
        endDate: z.string().transform((str) => new Date(str)).optional(),
      })
    )
    .query(async ({ input }) => {
      const { searchQuery, ...filters } = input;
      return await searchCommunications(searchQuery, filters);
    }),

  /**
   * Get timeline statistics
   */
  getStatistics: protectedProcedure
    .input(
      z.object({
        candidateId: z.number(),
        startDate: z.string().transform((str) => new Date(str)),
        endDate: z.string().transform((str) => new Date(str)),
      })
    )
    .query(async ({ input }) => {
      return await getTimelineStatistics(
        input.candidateId,
        input.startDate,
        input.endDate
      );
    }),
});
