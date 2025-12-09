import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { eq, and, desc } from "drizzle-orm";
import { pushSubscriptions, notificationHistory } from "../../drizzle/schema";
import { getDb } from "../db";
import { sendPushNotification, getVapidPublicKey } from "../_core/webPush";

export const pushNotificationsRouter = router({
  /**
   * Get VAPID public key for client-side subscription
   */
  getVapidPublicKey: protectedProcedure.query(() => {
    return { publicKey: getVapidPublicKey() };
  }),

  /**
   * Subscribe to push notifications
   */
  subscribe: protectedProcedure
    .input(
      z.object({
        endpoint: z.string(),
        p256dh: z.string(),
        auth: z.string(),
        userAgent: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if subscription already exists
      const existing = await db
        .select()
        .from(pushSubscriptions)
        .where(
          and(
            eq(pushSubscriptions.userId, ctx.user.id),
            eq(pushSubscriptions.endpoint, input.endpoint)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing subscription
        await db
          .update(pushSubscriptions)
          .set({
            p256dh: input.p256dh,
            auth: input.auth,
            userAgent: input.userAgent,
            isActive: true,
            lastUsedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(pushSubscriptions.id, existing[0]!.id));

        return { success: true, subscriptionId: existing[0]!.id };
      }

      // Create new subscription
      await db.insert(pushSubscriptions).values({
        userId: ctx.user.id,
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
        userAgent: input.userAgent,
        isActive: true,
        lastUsedAt: new Date(),
      });

      return { success: true };
    }),

  /**
   * Unsubscribe from push notifications
   */
  unsubscribe: protectedProcedure
    .input(z.object({ endpoint: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(pushSubscriptions)
        .set({ isActive: false, updatedAt: new Date() })
        .where(
          and(
            eq(pushSubscriptions.userId, ctx.user.id),
            eq(pushSubscriptions.endpoint, input.endpoint)
          )
        );

      return { success: true };
    }),

  /**
   * Get user's active subscriptions
   */
  getSubscriptions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, ctx.user.id),
          eq(pushSubscriptions.isActive, true)
        )
      )
      .orderBy(desc(pushSubscriptions.createdAt));

    return subs;
  }),

  /**
   * Send a test push notification
   */
  sendTestNotification: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get user's active subscriptions
    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, ctx.user.id),
          eq(pushSubscriptions.isActive, true)
        )
      );

    if (subs.length === 0) {
      throw new Error("No active push subscriptions found");
    }

    // Send test notification to all subscriptions
    const results = await Promise.allSettled(
      subs.map((sub) =>
        sendPushNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          {
            title: "Test Notification",
            body: "Push notifications are working! 🎉",
            icon: "/icon-192x192.png",
            tag: "test-notification",
          }
        )
      )
    );

    const successCount = results.filter(
      (r) => r.status === "fulfilled" && r.value.success
    ).length;

    // Log notification in history
    await db.insert(notificationHistory).values({
      userId: ctx.user.id,
      type: "system_update",
      title: "Test Notification",
      message: "Push notifications are working! 🎉",
      priority: "low",
      deliveryMethod: "push",
      pushSent: successCount > 0,
      pushSentAt: successCount > 0 ? new Date() : null,
      isRead: false,
    });

    return {
      success: true,
      sentTo: successCount,
      total: subs.length,
    };
  }),

  /**
   * Get notification history
   */
  getNotificationHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        unreadOnly: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [eq(notificationHistory.userId, ctx.user.id)];
      if (input.unreadOnly) {
        conditions.push(eq(notificationHistory.isRead, false));
      }

      const notifications = await db
        .select()
        .from(notificationHistory)
        .where(and(...conditions))
        .orderBy(desc(notificationHistory.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Get total count
      const countResult = await db
        .select()
        .from(notificationHistory)
        .where(and(...conditions));

      return {
        notifications,
        total: countResult.length,
        hasMore: input.offset + input.limit < countResult.length,
      };
    }),

  /**
   * Mark notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(notificationHistory)
        .set({ isRead: true, readAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            eq(notificationHistory.id, input.notificationId),
            eq(notificationHistory.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .update(notificationHistory)
      .set({ isRead: true, readAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(notificationHistory.userId, ctx.user.id),
          eq(notificationHistory.isRead, false)
        )
      );

    return { success: true };
  }),

  /**
   * Delete notification
   */
  deleteNotification: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .delete(notificationHistory)
        .where(
          and(
            eq(notificationHistory.id, input.notificationId),
            eq(notificationHistory.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  /**
   * Get unread notification count
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .select()
      .from(notificationHistory)
      .where(
        and(
          eq(notificationHistory.userId, ctx.user.id),
          eq(notificationHistory.isRead, false)
        )
      );

    return { count: result.length };
  }),
});
