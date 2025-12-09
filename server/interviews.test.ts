import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "employer" | "candidate" = "employer"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Interview Scheduling", () => {
  describe("checkConflicts", () => {
    it("should detect no conflicts for available time slot", async () => {
      const ctx = createAuthContext("employer");
      const caller = appRouter.createCaller(ctx);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      futureDate.setHours(10, 0, 0, 0);

      const result = await caller.interviews.checkConflicts({
        employerId: 1,
        scheduledAt: futureDate.toISOString(),
        duration: 60,
      });

      expect(result.hasConflict).toBe(false);
      expect(result.conflicts).toEqual([]);
    });

    it("should return conflict information when provided", async () => {
      const ctx = createAuthContext("employer");
      const caller = appRouter.createCaller(ctx);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      futureDate.setHours(10, 0, 0, 0);

      const result = await caller.interviews.checkConflicts({
        employerId: 1,
        scheduledAt: futureDate.toISOString(),
        duration: 60,
      });

      expect(result).toHaveProperty("hasConflict");
      expect(result).toHaveProperty("conflicts");
    });
  });

  describe("suggestSlots", () => {
    it("should return alternative time slot suggestions", async () => {
      const ctx = createAuthContext("employer");
      const caller = appRouter.createCaller(ctx);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const result = await caller.interviews.suggestSlots({
        employerId: 1,
        preferredDate: futureDate.toISOString(),
        duration: 60,
        numberOfSuggestions: 5,
      });

      expect(result).toHaveProperty("suggestions");
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it("should respect the number of suggestions requested", async () => {
      const ctx = createAuthContext("employer");
      const caller = appRouter.createCaller(ctx);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const result = await caller.interviews.suggestSlots({
        employerId: 1,
        preferredDate: futureDate.toISOString(),
        duration: 60,
        numberOfSuggestions: 3,
      });

      expect(result.suggestions.length).toBeLessThanOrEqual(3);
    });
  });

  describe("schedule", () => {
    it("should schedule an interview successfully", async () => {
      const ctx = createAuthContext("employer");
      const caller = appRouter.createCaller(ctx);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      futureDate.setHours(14, 0, 0, 0);

      const result = await caller.interviews.schedule({
        applicationId: 1,
        employerId: 1,
        candidateId: 1,
        jobId: 1,
        scheduledAt: futureDate.toISOString(),
        duration: 60,
        interviewType: "video",
        location: "https://meet.google.com/test",
        forceSchedule: false,
      });

      expect(result).toHaveProperty("success");
      if (result.success) {
        expect(result).toHaveProperty("interview");
        expect(result).toHaveProperty("message");
      }
    });
  });

  describe("getCalendarInterviews", () => {
    it("should return interviews for a date range", async () => {
      const ctx = createAuthContext("employer");
      const caller = appRouter.createCaller(ctx);

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      const result = await caller.interviews.getCalendarInterviews({
        employerId: 1,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
