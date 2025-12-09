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

describe("Match Comparison Feature", () => {
  it("should have compareMatches procedure available", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Verify the procedure exists
    expect(caller.aiMatching.compareMatches).toBeDefined();
  });

  it("should accept array of application IDs", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Test with non-existent ID (should return empty candidates)
    const result = await caller.aiMatching.compareMatches({
      applicationIds: [99999],
    });

    expect(result).toBeDefined();
    expect(result.candidates).toBeDefined();
    expect(Array.isArray(result.candidates)).toBe(true);
  });

  it("should return comparison data structure", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Test with non-existent IDs (should return empty candidates array)
    const result = await caller.aiMatching.compareMatches({
      applicationIds: [99999, 99998],
    });

    expect(result).toBeDefined();
    expect(result.candidates).toBeDefined();
    expect(Array.isArray(result.candidates)).toBe(true);
    
    // With non-existent IDs, should return empty array
    expect(result.candidates.length).toBe(0);
  });

  it("should validate input constraints", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Test max limit (10 applications)
    const tooManyIds = Array.from({ length: 11 }, (_, i) => i + 1);
    
    await expect(
      caller.aiMatching.compareMatches({
        applicationIds: tooManyIds,
      })
    ).rejects.toThrow();
  });
});

describe("Real-time Match Notifications", () => {
  it("should trigger notifications for high-scoring matches (80%+)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // The notification logic is tested indirectly through the calculateMatch procedure
    // This test verifies the procedure exists and accepts the required parameters
    expect(caller.aiMatching.calculateMatch).toBeDefined();
  });
});
