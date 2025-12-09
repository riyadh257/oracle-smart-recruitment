import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "user" | "admin" = "admin"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-employer",
    email: "employer@example.com",
    name: "Test Employer",
    loginMethod: "manus",
    role,
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

  return ctx;
}

describe("interviews.listPendingScheduling", () => {
  it("returns list of candidates pending interview scheduling", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.interviews.listPendingScheduling();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    
    // Verify structure of returned data
    if (result.length > 0) {
      const candidate = result[0];
      expect(candidate).toHaveProperty("id");
      expect(candidate).toHaveProperty("name");
      expect(candidate).toHaveProperty("position");
      expect(candidate).toHaveProperty("suggestedDate");
      expect(candidate).toHaveProperty("suggestedTime");
      expect(candidate).toHaveProperty("hasConflict");
      expect(candidate).toHaveProperty("availableSlots");
      expect(Array.isArray(candidate.availableSlots)).toBe(true);
    }
  });
});

describe("interviews.bulkSchedule", () => {
  it("schedules interviews for multiple candidates", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First get pending candidates
    const candidates = await caller.interviews.listPendingScheduling();
    
    if (candidates.length > 0) {
      const candidateIds = candidates.slice(0, 2).map(c => c.id);
      
      const result = await caller.interviews.bulkSchedule({
        candidateIds,
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.scheduled).toBeGreaterThan(0);
      expect(result.scheduled).toBeLessThanOrEqual(candidateIds.length);
    } else {
      // If no candidates, test with empty array
      const result = await caller.interviews.bulkSchedule({
        candidateIds: [],
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.scheduled).toBe(0);
    }
  });

  it("handles invalid candidate IDs gracefully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.interviews.bulkSchedule({
      candidateIds: [99999, 99998], // Non-existent IDs
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.scheduled).toBe(0);
  });
});
