import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getAvailableProviders, isOutlookConfigured } from "../unifiedCalendarService";

/**
 * Calendar Settings Router
 * Manages user calendar provider preferences and configuration
 */
export const calendarSettingsRouter = router({
  /**
   * Get current user's calendar settings
   */
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database not available",
      });
    }

    const user = await db
      .select({
        calendarProvider: users.calendarProvider,
        outlookUserId: users.outlookUserId,
      })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user || user.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return {
      provider: user[0].calendarProvider || 'google',
      outlookUserId: user[0].outlookUserId,
      availableProviders: getAvailableProviders(),
      isOutlookConfigured: isOutlookConfigured(),
    };
  }),

  /**
   * Update calendar provider preference
   */
  updateProvider: protectedProcedure
    .input(
      z.object({
        provider: z.enum(["google", "outlook"]),
        outlookUserId: z.string().email().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Validate Outlook configuration if selecting Outlook
      if (input.provider === 'outlook') {
        if (!isOutlookConfigured()) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Outlook calendar integration is not configured. Please contact your administrator.",
          });
        }

        if (!input.outlookUserId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Outlook user ID (email) is required when selecting Outlook as calendar provider",
          });
        }
      }

      await db
        .update(users)
        .set({
          calendarProvider: input.provider,
          outlookUserId: input.outlookUserId || null,
        })
        .where(eq(users.id, ctx.user.id));

      return {
        success: true,
        provider: input.provider,
      };
    }),

  /**
   * Get available calendar providers
   */
  getAvailableProviders: protectedProcedure.query(() => {
    return {
      providers: getAvailableProviders(),
      outlookConfigured: isOutlookConfigured(),
    };
  }),
});
