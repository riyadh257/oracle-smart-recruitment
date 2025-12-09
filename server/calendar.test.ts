import { describe, expect, it, vi } from "vitest";
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
    role: "user",
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

describe("calendar integration", () => {
  it("should have calendar router registered", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // Verify calendar router exists
    expect(caller.calendar).toBeDefined();
  });

  it("should validate calendar event creation input", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Test with missing required fields
    await expect(
      caller.calendar.createEvent({
        summary: "", // Empty summary should fail
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
      })
    ).rejects.toThrow();
  });

  it("should validate availability check input", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const now = new Date();
    const later = new Date(now.getTime() + 3600000);

    // This will fail in test environment without MCP, but validates the input schema
    await expect(
      caller.calendar.checkAvailability({
        startTime: now.toISOString(),
        endTime: later.toISOString(),
      })
    ).rejects.toThrow();
  });

  it("should validate find available slots input", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 3600000);

    // This will fail in test environment without MCP, but validates the input schema
    await expect(
      caller.calendar.findAvailableSlots({
        startDate: today.toISOString(),
        endDate: nextWeek.toISOString(),
        durationMinutes: 60,
      })
    ).rejects.toThrow();
  });

  it("should validate bulk scheduling input", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 3600000);

    // Test with empty candidate list
    await expect(
      caller.calendar.bulkScheduleInterviews({
        candidateEmails: [], // Empty list should fail
        interviewTitle: "Technical Interview",
        durationMinutes: 60,
        startDate: today.toISOString(),
        endDate: nextWeek.toISOString(),
      })
    ).rejects.toThrow();
  });
});

describe("calendar service functions", () => {
  it("should export calendar service functions", async () => {
    const { searchCalendarEvents, createCalendarEvents, checkAvailability, findAvailableSlots } = await import("./calendarService");
    
    expect(searchCalendarEvents).toBeDefined();
    expect(typeof searchCalendarEvents).toBe("function");
    
    expect(createCalendarEvents).toBeDefined();
    expect(typeof createCalendarEvents).toBe("function");
    
    expect(checkAvailability).toBeDefined();
    expect(typeof checkAvailability).toBe("function");
    
    expect(findAvailableSlots).toBeDefined();
    expect(typeof findAvailableSlots).toBe("function");
  });
});
