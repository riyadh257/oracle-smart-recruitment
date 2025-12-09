import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  saveMatch,
  getSavedMatches,
  getSavedMatchById,
  updateSavedMatch,
  unsaveMatch,
  checkIfMatchSaved,
} from "./savedMatches";

export const savedMatchesRouter = router({
  // Save a match
  save: protectedProcedure
    .input(z.object({
      candidateId: z.number(),
      jobId: z.number(),
      overallScore: z.number(),
      technicalScore: z.number(),
      cultureFitScore: z.number(),
      wellbeingScore: z.number(),
      matchExplanation: z.string().optional(),
      matchMetadata: z.any().optional(),
      notes: z.string().optional(),
      tags: z.array(z.string()).optional(),
      priority: z.enum(['low', 'medium', 'high']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await saveMatch({
        userId: ctx.user.id,
        ...input,
      });
      return { success: true, id: result.insertId };
    }),

  // Get all saved matches with optional filters
  list: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      priority: z.string().optional(),
      jobId: z.number().optional(),
      candidateId: z.number().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const matches = await getSavedMatches(ctx.user.id, input);
      return matches;
    }),

  // Get a single saved match
  getById: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const match = await getSavedMatchById(input.id, ctx.user.id);
      if (!match) {
        throw new Error("Saved match not found");
      }
      return match;
    }),

  // Update a saved match
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      notes: z.string().optional(),
      tags: z.array(z.string()).optional(),
      status: z.enum(['saved', 'contacted', 'interviewing', 'hired', 'rejected', 'archived']).optional(),
      priority: z.enum(['low', 'medium', 'high']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      await updateSavedMatch(id, ctx.user.id, updates);
      return { success: true };
    }),

  // Remove a saved match
  unsave: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      await unsaveMatch(input.id, ctx.user.id);
      return { success: true };
    }),

  // Check if a match is already saved
  checkSaved: protectedProcedure
    .input(z.object({
      candidateId: z.number(),
      jobId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const match = await checkIfMatchSaved(ctx.user.id, input.candidateId, input.jobId);
      return { isSaved: !!match, savedMatch: match };
    }),
});
