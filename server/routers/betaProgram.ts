import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import {
  createBetaSignup,
  getAllBetaSignups,
  getBetaSignupById,
  getBetaSignupByEmail,
  updateBetaSignup,
  createBetaOnboardingProgress,
  getBetaOnboardingProgressBySignupId,
  updateBetaOnboardingProgress,
  createBetaFeedback,
  getBetaFeedbackBySignupId,
  getAllBetaFeedback,
  updateBetaFeedback,
} from "../db";
import { TRPCError } from "@trpc/server";

export const betaProgramRouter = router({
  // Public signup for beta program
  signup: publicProcedure
    .input(
      z.object({
        companyName: z.string().min(1),
        contactName: z.string().min(1),
        contactEmail: z.string().email(),
        contactPhone: z.string().optional(),
        industry: z.string().optional(),
        companySize: z.enum(["1-10", "11-50", "51-200", "201-500", "501+"]).optional(),
        currentAts: z.string().optional(),
        painPoints: z.string().optional(),
        expectedHires: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Check if email already exists
      const existing = await getBetaSignupByEmail(input.contactEmail);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This email is already registered for the beta program",
        });
      }

      const signup = await createBetaSignup({
        ...input,
        status: "pending",
      });

      // Create initial onboarding progress
      await createBetaOnboardingProgress({
        signupId: signup.insertId as number,
        currentStep: 1,
        totalSteps: 5,
      });

      return {
        success: true,
        signupId: signup.insertId,
        message: "Successfully registered for beta program. We'll contact you soon!",
      };
    }),

  // Get all beta signups (admin only)
  list: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    return await getAllBetaSignups();
  }),

  // Get single beta signup
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const signup = await getBetaSignupById(input.id);
      if (!signup) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Beta signup not found" });
      }

      return signup;
    }),

  // Update beta signup status (admin only)
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "approved", "rejected", "active", "completed"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await updateBetaSignup(input.id, {
        status: input.status,
        notes: input.notes,
        approvedBy: ctx.user.id,
        approvedAt: new Date(),
      });

      return { success: true };
    }),

  // Get onboarding progress
  getOnboardingProgress: protectedProcedure
    .input(z.object({ signupId: z.number() }))
    .query(async ({ input }) => {
      const progress = await getBetaOnboardingProgressBySignupId(input.signupId);
      if (!progress) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Onboarding progress not found" });
      }

      return progress;
    }),

  // Update onboarding step
  updateOnboardingStep: protectedProcedure
    .input(
      z.object({
        signupId: z.number(),
        step: z.number().min(1).max(5),
        stepData: z.record(z.string(), z.any()).optional(),
        completed: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const progress = await getBetaOnboardingProgressBySignupId(input.signupId);
      if (!progress) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Onboarding progress not found" });
      }

      const updateData: any = {
        currentStep: input.completed ? input.step + 1 : input.step,
      };

      // Update specific step completion
      updateData[`step${input.step}Completed`] = input.completed;
      if (input.stepData) {
        updateData[`step${input.step}Data`] = input.stepData;
      }

      // Check if all steps completed
      if (input.step === 5 && input.completed) {
        updateData.completedAt = new Date();
      }

      await updateBetaOnboardingProgress(progress.id, updateData);

      return { success: true };
    }),

  // Submit feedback
  submitFeedback: protectedProcedure
    .input(
      z.object({
        signupId: z.number(),
        category: z.enum(["bug", "feature_request", "usability", "performance", "general"]),
        title: z.string().min(1),
        description: z.string().min(1),
        priority: z.enum(["low", "medium", "high", "critical"]).optional(),
        rating: z.number().min(1).max(5).optional(),
        attachmentUrls: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const feedback = await createBetaFeedback({
        ...input,
        submittedBy: ctx.user.id,
        status: "new",
      });

      return {
        success: true,
        feedbackId: feedback.insertId,
      };
    }),

  // Get feedback by signup
  getFeedbackBySignup: protectedProcedure
    .input(z.object({ signupId: z.number() }))
    .query(async ({ input }) => {
      return await getBetaFeedbackBySignupId(input.signupId);
    }),

  // Get all feedback (admin only)
  getAllFeedback: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    return await getAllBetaFeedback();
  }),

  // Respond to feedback (admin only)
  respondToFeedback: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        response: z.string().min(1),
        status: z.enum(["new", "acknowledged", "in_progress", "resolved", "wont_fix"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await updateBetaFeedback(input.id, {
        adminResponse: input.response,
        respondedBy: ctx.user.id,
        respondedAt: new Date(),
        status: input.status,
      });

      return { success: true };
    }),

  // Get dashboard stats (admin only)
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const signups = await getAllBetaSignups();
    const feedback = await getAllBetaFeedback();

    // Calculate onboarding completion rate
    let totalOnboarding = 0;
    let completedOnboarding = 0;

    for (const signup of signups) {
      if (signup.status === 'approved' || signup.status === 'active') {
        totalOnboarding++;
        const progress = await getBetaOnboardingProgressBySignupId(signup.id);
        if (progress?.completedAt) {
          completedOnboarding++;
        }
      }
    }

    return {
      totalSignups: signups.length,
      pendingReview: signups.filter((s: any) => s.status === 'pending').length,
      approved: signups.filter((s: any) => s.status === 'approved').length,
      active: signups.filter((s: any) => s.status === 'active').length,
      totalFeedback: feedback.length,
      unresolvedFeedback: feedback.filter((f: any) => f.status === 'new').length,
      highPriorityFeedback: feedback.filter((f: any) => f.priority === 'high' || f.priority === 'critical').length,
      onboardingCompletionRate: totalOnboarding > 0 ? Math.round((completedOnboarding / totalOnboarding) * 100) : 0,
    };
  }),
});
