/**
 * Bulk Scheduling tRPC Router
 * Handles bulk interview scheduling with conflict detection and resolution
 */

import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import {
  createBulkSchedulingOperation,
  getBulkSchedulingOperation,
  updateBulkSchedulingOperation,
  getCandidateAvailability,
  setCandidateAvailability,
  updateCandidateAvailability,
  deleteCandidateAvailability,
  checkInterviewConflicts,
  getUnresolvedConflicts,
  resolveInterviewConflict,
  getConflictResolutions,
  applyConflictResolution,
  findAvailableTimeSlots,
  bulkScheduleInterviews,
} from "./bulkScheduling";
import { TRPCError } from "@trpc/server";

export const bulkSchedulingRouter = router({
  /**
   * Create a new bulk scheduling operation
   */
  createOperation: protectedProcedure
    .input(
      z.object({
        jobId: z.number().optional(),
        operationName: z.string(),
        candidateIds: z.array(z.number()),
        schedulingRules: z.object({
          preferredDays: z.array(z.string()).optional(),
          preferredTimeSlots: z
            .array(
              z.object({
                start: z.string(),
                end: z.string(),
              })
            )
            .optional(),
          duration: z.number().optional(),
          bufferMinutes: z.number().optional(),
          maxPerDay: z.number().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get employer ID from user context
      const { getEmployerByUserId } = await import("./db");
      const employer = await getEmployerByUserId(ctx.user.id);

      if (!employer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Employer profile not found",
        });
      }

      // Create the operation
      const operation = await createBulkSchedulingOperation({
        employerId: employer.id,
        jobId: input.jobId,
        operationName: input.operationName,
        totalCandidates: input.candidateIds.length,
        scheduledCount: 0,
        conflictCount: 0,
        failedCount: 0,
        status: "pending",
        schedulingRules: input.schedulingRules,
      });

      // Start the bulk scheduling process
      const result = await bulkScheduleInterviews(
        operation.id,
        employer.id,
        input.candidateIds,
        input.jobId || 0,
        input.schedulingRules
      );

      return {
        operation,
        result,
      };
    }),

  /**
   * Get bulk scheduling operation by ID
   */
  getOperation: protectedProcedure
    .input(z.object({ operationId: z.number() }))
    .query(async ({ input }) => {
      const operation = await getBulkSchedulingOperation(input.operationId);

      if (!operation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Operation not found",
        });
      }

      return operation;
    }),

  /**
   * Get candidate availability
   */
  getCandidateAvailability: protectedProcedure
    .input(z.object({ candidateId: z.number() }))
    .query(async ({ input }) => {
      return await getCandidateAvailability(input.candidateId);
    }),

  /**
   * Set candidate availability
   */
  setCandidateAvailability: protectedProcedure
    .input(
      z.object({
        candidateId: z.number(),
        dayOfWeek: z.enum([
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ]),
        startTime: z.string(),
        endTime: z.string(),
        timezone: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await setCandidateAvailability({
        candidateId: input.candidateId,
        dayOfWeek: input.dayOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
        timezone: input.timezone || "UTC",
        isActive: true,
      });

      return { success: true };
    }),

  /**
   * Update candidate availability
   */
  updateCandidateAvailability: protectedProcedure
    .input(
      z.object({
        availabilityId: z.number(),
        dayOfWeek: z
          .enum([
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ])
          .optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        timezone: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { availabilityId, ...data } = input;
      await updateCandidateAvailability(availabilityId, data);

      return { success: true };
    }),

  /**
   * Delete candidate availability
   */
  deleteCandidateAvailability: protectedProcedure
    .input(z.object({ availabilityId: z.number() }))
    .mutation(async ({ input }) => {
      await deleteCandidateAvailability(input.availabilityId);

      return { success: true };
    }),

  /**
   * Check for interview conflicts
   */
  checkConflicts: protectedProcedure
    .input(
      z.object({
        scheduledAt: z.date(),
        duration: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { getEmployerByUserId } = await import("./db");
      const employer = await getEmployerByUserId(ctx.user.id);

      if (!employer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Employer profile not found",
        });
      }

      return await checkInterviewConflicts(
        employer.id,
        input.scheduledAt,
        input.duration
      );
    }),

  /**
   * Get unresolved conflicts
   */
  getUnresolvedConflicts: protectedProcedure.query(async ({ ctx }) => {
    const { getEmployerByUserId } = await import("./db");
    const employer = await getEmployerByUserId(ctx.user.id);

    if (!employer) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Employer profile not found",
      });
    }

    return await getUnresolvedConflicts(employer.id);
  }),

  /**
   * Resolve interview conflict
   */
  resolveConflict: protectedProcedure
    .input(z.object({ conflictId: z.number() }))
    .mutation(async ({ input }) => {
      await resolveInterviewConflict(input.conflictId);

      return { success: true };
    }),

  /**
   * Get conflict resolutions
   */
  getConflictResolutions: protectedProcedure
    .input(z.object({ conflictId: z.number() }))
    .query(async ({ input }) => {
      return await getConflictResolutions(input.conflictId);
    }),

  /**
   * Apply conflict resolution
   */
  applyConflictResolution: protectedProcedure
    .input(z.object({ resolutionId: z.number() }))
    .mutation(async ({ input }) => {
      await applyConflictResolution(input.resolutionId);

      return { success: true };
    }),

  /**
   * Find available time slots
   */
  findAvailableTimeSlots: protectedProcedure
    .input(
      z.object({
        candidateId: z.number(),
        duration: z.number(),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { getEmployerByUserId } = await import("./db");
      const employer = await getEmployerByUserId(ctx.user.id);

      if (!employer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Employer profile not found",
        });
      }

      return await findAvailableTimeSlots(
        input.candidateId,
        employer.id,
        input.duration,
        input.startDate,
        input.endDate
      );
    }),
});
