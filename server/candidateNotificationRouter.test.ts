import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
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

describe("candidateNotifications router", () => {
  it("returns default preferences when none exist", async () => {
    const { ctx } = createAuthContext(999999); // Use high ID unlikely to exist
    const caller = appRouter.createCaller(ctx);

    const result = await caller.candidateNotifications.getPreferences({
      candidateId: 999999,
    });

    expect(result).toBeDefined();
    expect(result.candidateId).toBe(999999);
    expect(result.jobAlertFrequency).toBe("daily_digest");
    expect(result.applicationStatusUpdates).toBe(true);
    expect(result.interviewReminders).toBe(true);
    expect(result.newJobMatches).toBe(true);
    expect(result.quietHoursEnabled).toBe(false);
    expect(result.quietHoursStart).toBe("22:00");
    expect(result.quietHoursEnd).toBe("08:00");
    expect(result.timezone).toBe("Asia/Riyadh");
  });
});
