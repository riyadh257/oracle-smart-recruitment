import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

/**
 * Admin Beta Management Dashboard
 * Handles beta signups, feedback, and onboarding progress tracking
 */

export async function getAllBetaSignupsWithStats() {
  const signups = await db.getAllBetaSignups();
  const feedback = await db.getAllBetaFeedback();
  
  const stats = {
    total: signups.length,
    pending: signups.filter((s: any) => s.status === 'pending').length,
    approved: signups.filter((s: any) => s.status === 'approved').length,
    rejected: signups.filter((s: any) => s.status === 'rejected').length,
    onboarding: signups.filter((s: any) => s.status === 'onboarding').length,
    totalFeedback: feedback.length,
    unresolvedFeedback: feedback.filter((f: any) => f.status === 'new' || f.status === 'acknowledged').length,
  };
  
  return { signups, stats };
}

export async function updateSignupStatus(
  signupId: number,
  status: string,
  notes?: string
) {
  await db.updateBetaSignupStatus(signupId, status, notes);
  
  // If approved, create onboarding progress record
  if (status === 'approved') {
    const existing = await db.getBetaOnboardingProgressBySignupId(signupId);
    if (!existing) {
      await db.createBetaOnboardingProgress({
        signupId,
        currentStep: 1,
        totalSteps: 5,
        step1Completed: false,
        step2Completed: false,
        step3Completed: false,
        step4Completed: false,
        step5Completed: false,
      });
    }
  }
  
  return { success: true };
}

export async function respondToFeedback(
  feedbackId: number,
  adminResponse: string,
  respondedBy: number
) {
  await db.updateBetaFeedbackResponse(feedbackId, adminResponse, respondedBy);
  return { success: true };
}

export async function getOnboardingProgressWithDetails(signupId: number) {
  const signup = await db.getBetaSignupById(signupId);
  if (!signup) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Beta signup not found',
    });
  }
  
  const progress = await db.getBetaOnboardingProgressBySignupId(signupId);
  const feedback = await db.getBetaFeedbackBySignupId(signupId);
  
  return {
    signup,
    progress,
    feedback,
  };
}

export async function updateOnboardingMilestone(
  signupId: number,
  stepNumber: number,
  completed: boolean,
  stepData?: Record<string, any>
) {
  const progress = await db.getBetaOnboardingProgressBySignupId(signupId);
  
  if (!progress) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Onboarding progress not found',
    });
  }
  
  const updateData: any = {};
  
  // Update the specific step
  updateData[`step${stepNumber}Completed`] = completed;
  if (stepData) {
    updateData[`step${stepNumber}Data`] = stepData;
  }
  
  // Calculate new current step
  let currentStep = 1;
  for (let i = 1; i <= 5; i++) {
    const stepKey = `step${i}Completed`;
    if (i === stepNumber) {
      if (completed) {
        currentStep = Math.min(i + 1, 5);
      } else {
        currentStep = i;
        break;
      }
    } else if (progress[stepKey as keyof typeof progress]) {
      currentStep = Math.min(i + 1, 5);
    } else {
      currentStep = i;
      break;
    }
  }
  
  updateData.currentStep = currentStep;
  
  // Check if all steps completed
  const allCompleted = [1, 2, 3, 4, 5].every((i: any) => {
    if (i === stepNumber) return completed;
    return progress[`step${i}Completed` as keyof typeof progress];
  });
  
  if (allCompleted) {
    updateData.completedAt = new Date();
  }
  
  await db.updateBetaOnboardingProgress(signupId, updateData);
  
  return { success: true };
}

export async function getBetaDashboardStats() {
  const signups = await db.getAllBetaSignups();
  const feedback = await db.getAllBetaFeedback();
  
  // Calculate onboarding completion rate
  let totalOnboarding = 0;
  let completedOnboarding = 0;
  
  for (const signup of signups) {
    if (signup.status === 'approved' || signup.status === 'onboarding') {
      totalOnboarding++;
      const progress = await db.getBetaOnboardingProgressBySignupId(signup.id);
      if (progress?.completedAt) {
        completedOnboarding++;
      }
    }
  }
  
  return {
    totalSignups: signups.length,
    pendingReview: signups.filter((s: any) => s.status === 'pending').length,
    approved: signups.filter((s: any) => s.status === 'approved').length,
    activeOnboarding: signups.filter((s: any) => s.status === 'onboarding').length,
    totalFeedback: feedback.length,
    unresolvedFeedback: feedback.filter((f: any) => f.status === 'new').length,
    highPriorityFeedback: feedback.filter((f: any) => f.priority === 'high' || f.priority === 'critical').length,
    onboardingCompletionRate: totalOnboarding > 0 ? (completedOnboarding / totalOnboarding) * 100 : 0,
  };
}
