import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("scheduledNotifications router", () => {
  it("should list scheduled notifications", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.scheduledNotifications.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("should get notification statistics", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.scheduledNotifications.getStats();

    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("queued");
    expect(result).toHaveProperty("sent");
    expect(result).toHaveProperty("failed");
    expect(result).toHaveProperty("cancelled");
    expect(typeof result.total).toBe("number");
  });

  it("should schedule a new notification", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);

    const notificationData = {
      userId: 1,
      type: "general" as const,
      title: "Test Notification",
      message: "This is a test scheduled notification",
      deliveryMethod: "push" as const,
      scheduledFor: futureDate.toISOString(),
      priority: "medium" as const,
    };

    const result = await caller.scheduledNotifications.schedule(notificationData);

    expect(result).toHaveProperty("id");
    expect(result.title).toBe(notificationData.title);
    expect(result.type).toBe(notificationData.type);
    expect(result.status).toBe("queued");
  });

  it("should schedule notification with optimal send time", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    const notificationData = {
      userId: 1,
      type: "interview_reminder" as const,
      title: "Interview Reminder",
      message: "Your interview is tomorrow",
      deliveryMethod: "email" as const,
      scheduledFor: futureDate.toISOString(),
      optimalSendTime: true,
      priority: "high" as const,
    };

    const result = await caller.scheduledNotifications.schedule(notificationData);

    expect(result).toHaveProperty("id");
    expect(result.optimalSendTime).toBe(1);
  });

  it("should filter scheduled notifications by status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.scheduledNotifications.list({
      status: "queued",
    });

    expect(Array.isArray(result)).toBe(true);
    result.forEach((notification: any) => {
      expect(notification.status).toBe("queued");
    });
  });

  it("should filter scheduled notifications by type", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.scheduledNotifications.list({
      type: "interview_reminder",
    });

    expect(Array.isArray(result)).toBe(true);
    result.forEach((notification: any) => {
      expect(notification.type).toBe("interview_reminder");
    });
  });

  it("should cancel a scheduled notification", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First, schedule a notification
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 2);

    const scheduled = await caller.scheduledNotifications.schedule({
      userId: 1,
      type: "general" as const,
      title: "To Be Cancelled",
      message: "This will be cancelled",
      deliveryMethod: "push" as const,
      scheduledFor: futureDate.toISOString(),
    });

    // Then cancel it
    const result = await caller.scheduledNotifications.cancel({
      id: scheduled.id,
    });

    expect(result.success).toBe(true);

    // Verify it's cancelled
    const cancelled = await caller.scheduledNotifications.getById({
      id: scheduled.id,
    });

    expect(cancelled?.status).toBe("cancelled");
  });

  it("should bulk schedule notifications", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 3);

    const notifications = [
      {
        userId: 1,
        type: "general" as const,
        title: "Bulk Notification 1",
        message: "First bulk notification",
        deliveryMethod: "push" as const,
        scheduledFor: futureDate.toISOString(),
      },
      {
        userId: 1,
        type: "general" as const,
        title: "Bulk Notification 2",
        message: "Second bulk notification",
        deliveryMethod: "email" as const,
        scheduledFor: futureDate.toISOString(),
      },
    ];

    const results = await caller.scheduledNotifications.bulkSchedule({
      notifications,
    });

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(2);
    results.forEach((result: any) => {
      expect(result.success).toBe(true);
      expect(result.notification).toHaveProperty("id");
    });
  });
});
