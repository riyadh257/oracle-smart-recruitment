import webpush from "web-push";
import { ENV } from "./env";

/**
 * Web Push API integration for sending push notifications
 * Uses VAPID keys for authentication
 */

// VAPID keys should be generated once and stored as environment variables
// Generate with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = ENV.vapidPublicKey || "";
const VAPID_PRIVATE_KEY = ENV.vapidPrivateKey || "";
const VAPID_SUBJECT = `mailto:${ENV.ownerEmail || "admin@oracle-recruitment.com"}`;

// Configure web-push library
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Send a push notification to a specific subscription
 */
export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: PushNotificationPayload
): Promise<{ success: boolean; error?: string }> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.error("[WebPush] VAPID keys not configured");
    return { success: false, error: "VAPID keys not configured" };
  }

  try {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    };

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/icon-192x192.png",
      badge: payload.badge || "/icon-192x192.png",
      data: {
        ...payload.data,
        url: payload.url,
      },
      tag: payload.tag,
      requireInteraction: payload.requireInteraction || false,
    });

    await webpush.sendNotification(pushSubscription, notificationPayload);

    return { success: true };
  } catch (error: any) {
    console.error("[WebPush] Failed to send notification:", error);

    // Handle specific error cases
    if (error.statusCode === 410 || error.statusCode === 404) {
      // Subscription has expired or is no longer valid
      return { success: false, error: "subscription_expired" };
    }

    return { success: false, error: error.message };
  }
}

/**
 * Send push notifications to multiple subscriptions
 */
export async function sendBatchPushNotifications(
  subscriptions: PushSubscriptionData[],
  payload: PushNotificationPayload
): Promise<{
  successCount: number;
  failureCount: number;
  expiredSubscriptions: string[];
}> {
  const results = await Promise.allSettled(
    subscriptions.map((sub) => sendPushNotification(sub, payload))
  );

  let successCount = 0;
  let failureCount = 0;
  const expiredSubscriptions: string[] = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled" && result.value.success) {
      successCount++;
    } else {
      failureCount++;
      if (
        result.status === "fulfilled" &&
        result.value.error === "subscription_expired"
      ) {
        expiredSubscriptions.push(subscriptions[index]!.endpoint);
      }
    }
  });

  return { successCount, failureCount, expiredSubscriptions };
}

/**
 * Get the VAPID public key for client-side subscription
 */
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}
