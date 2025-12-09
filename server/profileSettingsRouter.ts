import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { candidatePreferences, candidates } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Profile Settings Router
 * Candidate-facing settings for job preferences, notifications, and privacy controls
 */

export const profileSettingsRouter = router({
  /**
   * Get current candidate's profile settings
   */
  getSettings: protectedProcedure
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
        throw new TRPCError({ code: "NOT_FOUND", message: "Candidate profile not found" });
      }

      // Get preferences
      const [prefs] = await db
        .select()
        .from(candidatePreferences)
        .where(eq(candidatePreferences.candidateId, candidate.id))
        .limit(1);

      // Return default preferences if none exist
      if (!prefs) {
        return {
          candidateId: candidate.id,
          preferredIndustries: [],
          preferredCompanySizes: [],
          preferredLocations: [],
          maxCommuteTime: null,
          desiredBenefits: [],
          careerGoals: null,
          learningInterests: [],
          workLifeBalance: 5,
          growthOpportunities: 5,
          teamSize: "any" as const,
          managementStyle: "any" as const,
          notificationFrequency: "daily" as const,
          jobAlertEnabled: true,
          emailNotificationsEnabled: true,
          inAppNotificationsEnabled: true,
          profileVisibility: "employers_only" as const,
          allowDataSharing: true,
        };
      }

      return prefs;
    }),

  /**
   * Update job preferences
   */
  updateJobPreferences: protectedProcedure
    .input(z.object({
      preferredIndustries: z.array(z.string()).optional(),
      preferredCompanySizes: z.array(z.string()).optional(),
      preferredLocations: z.array(z.string()).optional(),
      maxCommuteTime: z.number().min(0).max(180).optional().nullable(),
      desiredBenefits: z.array(z.string()).optional(),
      careerGoals: z.string().optional().nullable(),
      learningInterests: z.array(z.string()).optional(),
      workLifeBalance: z.number().min(1).max(10).optional(),
      growthOpportunities: z.number().min(1).max(10).optional(),
      teamSize: z.enum(["small", "medium", "large", "any"]).optional(),
      managementStyle: z.enum(["hands_on", "autonomous", "collaborative", "any"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Find candidate record
      const [candidate] = await db
        .select()
        .from(candidates)
        .where(eq(candidates.userId, ctx.user.id))
        .limit(1);

      if (!candidate) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Candidate profile not found" });
      }

      // Check if preferences exist
      const [existing] = await db
        .select()
        .from(candidatePreferences)
        .where(eq(candidatePreferences.candidateId, candidate.id))
        .limit(1);

      if (existing) {
        // Update existing preferences
        await db
          .update(candidatePreferences)
          .set({
            ...input,
            updatedAt: new Date(),
          })
          .where(eq(candidatePreferences.candidateId, candidate.id));
      } else {
        // Create new preferences
        await db
          .insert(candidatePreferences)
          .values({
            candidateId: candidate.id,
            ...input,
          });
      }

      return { success: true };
    }),

  /**
   * Update notification settings
   */
  updateNotificationSettings: protectedProcedure
    .input(z.object({
      notificationFrequency: z.enum(["immediate", "daily", "weekly"]).optional(),
      jobAlertEnabled: z.boolean().optional(),
      emailNotificationsEnabled: z.boolean().optional(),
      inAppNotificationsEnabled: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Find candidate record
      const [candidate] = await db
        .select()
        .from(candidates)
        .where(eq(candidates.userId, ctx.user.id))
        .limit(1);

      if (!candidate) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Candidate profile not found" });
      }

      // Check if preferences exist
      const [existing] = await db
        .select()
        .from(candidatePreferences)
        .where(eq(candidatePreferences.candidateId, candidate.id))
        .limit(1);

      if (existing) {
        // Update existing preferences
        await db
          .update(candidatePreferences)
          .set({
            ...input,
            updatedAt: new Date(),
          })
          .where(eq(candidatePreferences.candidateId, candidate.id));
      } else {
        // Create new preferences
        await db
          .insert(candidatePreferences)
          .values({
            candidateId: candidate.id,
            ...input,
          });
      }

      return { success: true };
    }),

  /**
   * Update privacy settings
   */
  updatePrivacySettings: protectedProcedure
    .input(z.object({
      profileVisibility: z.enum(["public", "private", "employers_only"]).optional(),
      allowDataSharing: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Find candidate record
      const [candidate] = await db
        .select()
        .from(candidates)
        .where(eq(candidates.userId, ctx.user.id))
        .limit(1);

      if (!candidate) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Candidate profile not found" });
      }

      // Check if preferences exist
      const [existing] = await db
        .select()
        .from(candidatePreferences)
        .where(eq(candidatePreferences.candidateId, candidate.id))
        .limit(1);

      if (existing) {
        // Update existing preferences
        await db
          .update(candidatePreferences)
          .set({
            ...input,
            updatedAt: new Date(),
          })
          .where(eq(candidatePreferences.candidateId, candidate.id));
      } else {
        // Create new preferences
        await db
          .insert(candidatePreferences)
          .values({
            candidateId: candidate.id,
            ...input,
          });
      }

      return { success: true };
    }),

  /**
   * Update all settings at once
   */
  updateAllSettings: protectedProcedure
    .input(z.object({
      // Job preferences
      preferredIndustries: z.array(z.string()).optional(),
      preferredCompanySizes: z.array(z.string()).optional(),
      preferredLocations: z.array(z.string()).optional(),
      maxCommuteTime: z.number().min(0).max(180).optional().nullable(),
      desiredBenefits: z.array(z.string()).optional(),
      careerGoals: z.string().optional().nullable(),
      learningInterests: z.array(z.string()).optional(),
      workLifeBalance: z.number().min(1).max(10).optional(),
      growthOpportunities: z.number().min(1).max(10).optional(),
      teamSize: z.enum(["small", "medium", "large", "any"]).optional(),
      managementStyle: z.enum(["hands_on", "autonomous", "collaborative", "any"]).optional(),
      
      // Notification settings
      notificationFrequency: z.enum(["immediate", "daily", "weekly"]).optional(),
      jobAlertEnabled: z.boolean().optional(),
      emailNotificationsEnabled: z.boolean().optional(),
      inAppNotificationsEnabled: z.boolean().optional(),
      
      // Privacy settings
      profileVisibility: z.enum(["public", "private", "employers_only"]).optional(),
      allowDataSharing: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Find candidate record
      const [candidate] = await db
        .select()
        .from(candidates)
        .where(eq(candidates.userId, ctx.user.id))
        .limit(1);

      if (!candidate) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Candidate profile not found" });
      }

      // Check if preferences exist
      const [existing] = await db
        .select()
        .from(candidatePreferences)
        .where(eq(candidatePreferences.candidateId, candidate.id))
        .limit(1);

      if (existing) {
        // Update existing preferences
        await db
          .update(candidatePreferences)
          .set({
            ...input,
            updatedAt: new Date(),
          })
          .where(eq(candidatePreferences.candidateId, candidate.id));
      } else {
        // Create new preferences
        await db
          .insert(candidatePreferences)
          .values({
            candidateId: candidate.id,
            ...input,
          });
      }

      return { success: true };
    }),
});
