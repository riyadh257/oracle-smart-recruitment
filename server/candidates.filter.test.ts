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
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("candidates.list", () => {
  it("returns proper result structure", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.candidates.list({
      limit: 10,
      offset: 0,
    });

    // Verify result structure
    expect(result).toHaveProperty("candidates");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("hasMore");
    expect(Array.isArray(result.candidates)).toBe(true);
    expect(typeof result.total).toBe("number");
    expect(typeof result.hasMore).toBe("boolean");
  });

  it("accepts search query filter", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.candidates.list({
      searchQuery: "John Doe",
      limit: 10,
    });

    expect(result).toHaveProperty("candidates");
    expect(Array.isArray(result.candidates)).toBe(true);
  });

  it("accepts skills array filter", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.candidates.list({
      skills: ["JavaScript", "React", "Node.js"],
      limit: 10,
    });

    expect(result).toHaveProperty("candidates");
    expect(Array.isArray(result.candidates)).toBe(true);
  });

  it("accepts location filter", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.candidates.list({
      location: "Riyadh",
      limit: 10,
    });

    expect(result).toHaveProperty("candidates");
  });

  it("accepts experience range filters", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.candidates.list({
      minExperience: 2,
      maxExperience: 5,
      limit: 10,
    });

    expect(result).toHaveProperty("candidates");
  });

  it("accepts availability filter", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.candidates.list({
      isAvailable: true,
      limit: 10,
    });

    expect(result).toHaveProperty("candidates");
  });

  it("accepts profile status filter", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.candidates.list({
      profileStatus: "active",
      limit: 10,
    });

    expect(result).toHaveProperty("candidates");
  });

  it("accepts work setting filter", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.candidates.list({
      preferredWorkSetting: "remote",
      limit: 10,
    });

    expect(result).toHaveProperty("candidates");
  });

  it("accepts sorting parameters", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.candidates.list({
      sortBy: "yearsOfExperience",
      sortOrder: "desc",
      limit: 10,
    });

    expect(result).toHaveProperty("candidates");
  });

  it("respects pagination limits", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.candidates.list({
      limit: 5,
      offset: 0,
    });

    expect(result.candidates.length).toBeLessThanOrEqual(5);
  });

  it("validates limit range", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.candidates.list({
        limit: 150, // Exceeds max of 100
      });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error.message).toContain("Too big");
    }
  });

  it("accepts combined filters", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.candidates.list({
      searchQuery: "developer",
      skills: ["JavaScript"],
      location: "Riyadh",
      minExperience: 3,
      isAvailable: true,
      profileStatus: "active",
      preferredWorkSetting: "remote",
      sortBy: "aiProfileScore",
      sortOrder: "desc",
      limit: 20,
      offset: 0,
    });

    expect(result).toHaveProperty("candidates");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("hasMore");
  });
});
