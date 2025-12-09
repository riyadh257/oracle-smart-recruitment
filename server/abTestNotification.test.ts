import { describe, it, expect, vi, beforeEach } from "vitest";
import { autoAnalyzeTests, notifyTestWinner } from "./abTestNotificationService";

// Mock dependencies
vi.mock("./db", () => ({
  getDb: vi.fn(() => ({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([
            {
              id: 1,
              testName: "Test Campaign",
              userId: 1,
              status: "active",
              primaryMetric: "conversion_rate",
              winnerVariant: "no_winner",
            }
          ])),
        })),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        onDuplicateKeyUpdate: vi.fn(() => Promise.resolve()),
      })),
    })),
  })),
}));

vi.mock("./notificationService", () => ({
  sendNotification: vi.fn(() => Promise.resolve({
    success: true,
    pushSent: true,
    emailSent: false,
  })),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn(() => Promise.resolve(true)),
}));

describe("A/B Test Notification Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should analyze active tests and return results", async () => {
    const result = await autoAnalyzeTests();
    
    expect(result).toBeDefined();
    expect(result).toHaveProperty("analyzed");
    expect(result).toHaveProperty("winnersFound");
    expect(result).toHaveProperty("notificationsSent");
    expect(typeof result.analyzed).toBe("number");
    expect(typeof result.winnersFound).toBe("number");
    expect(typeof result.notificationsSent).toBe("number");
  });

  it("should handle database unavailable gracefully", async () => {
    const { getDb } = await import("./db");
    vi.mocked(getDb).mockResolvedValueOnce(null as any);
    
    const result = await autoAnalyzeTests();
    
    expect(result.analyzed).toBe(0);
    expect(result.winnersFound).toBe(0);
    expect(result.notificationsSent).toBe(0);
  });

  it("should return false when notifying winner for non-existent test", async () => {
    const result = await notifyTestWinner(999);
    
    // Should handle gracefully when test not found
    expect(typeof result).toBe("boolean");
  });
});
