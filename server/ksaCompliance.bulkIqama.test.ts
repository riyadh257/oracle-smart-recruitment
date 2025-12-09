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

describe("KSA Compliance - Bulk Iqama Validation", () => {
  it("should validate multiple Iqama numbers", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 45); // 45 days from now

    const result = await caller.ksaCompliance.workPermits.bulkValidateIqama({
      iqamaNumbers: [
        {
          iqamaNumber: "2123456789",
          employeeName: "Ahmed Ali",
          expiryDate: futureDate,
        },
        {
          iqamaNumber: "1987654321",
          employeeName: "Mohammed Hassan",
          expiryDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago (expired)
        },
      ],
    });

    expect(result.totalProcessed).toBe(2);
    expect(result.validCount).toBe(1); // First one is valid
    expect(result.invalidCount).toBe(1); // Second one is expired (invalid)
    expect(result.expiringCount).toBe(1); // First one expires within 90 days
    expect(result.expiredCount).toBe(1); // Second one is expired
    expect(result.results).toHaveLength(2);
    expect(result.results[0]?.employeeName).toBe("Ahmed Ali");
    expect(result.results[0]?.status).toBe("expiring_soon");
    expect(result.results[1]?.status).toBe("expired");
  });

  it("should process CSV content correctly", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const csvContent = `iqamaNumber,employeeName,expiryDate
2123456789,Ahmed Ali,2025-12-31
1987654321,Mohammed Hassan,2024-01-15`;

    const result = await caller.ksaCompliance.workPermits.processBulkIqamaCsv({
      csvContent,
    });

    expect(result.totalProcessed).toBe(2);
    expect(result.results).toHaveLength(2);
    expect(result.results[0]?.iqamaNumber).toBe("2123456789");
    expect(result.results[0]?.employeeName).toBe("Ahmed Ali");
    expect(result.results[1]?.iqamaNumber).toBe("1987654321");
    expect(result.results[1]?.employeeName).toBe("Mohammed Hassan");
  });

  it("should handle CSV without header row", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const csvContent = `2123456789,Ahmed Ali,2025-12-31
1987654321,Mohammed Hassan,2025-06-15`;

    const result = await caller.ksaCompliance.workPermits.processBulkIqamaCsv({
      csvContent,
    });

    expect(result.totalProcessed).toBe(2);
    expect(result.results[0]?.iqamaNumber).toBe("2123456789");
  });

  it("should detect critical expiry (≤30 days)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const criticalDate = new Date();
    criticalDate.setDate(criticalDate.getDate() + 25); // 25 days from now

    const result = await caller.ksaCompliance.workPermits.bulkValidateIqama({
      iqamaNumbers: [
        {
          iqamaNumber: "2123456789",
          employeeName: "Critical Case",
          expiryDate: criticalDate,
        },
      ],
    });

    expect(result.criticalCount).toBe(1);
    expect(result.results[0]?.status).toBe("expiring_soon");
    expect(result.results[0]?.daysUntilExpiry).toBeLessThanOrEqual(30);
  });

  it("should validate Iqama number format", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 100);

    const result = await caller.ksaCompliance.workPermits.bulkValidateIqama({
      iqamaNumbers: [
        {
          iqamaNumber: "invalid123", // Invalid format
          employeeName: "Invalid Format",
          expiryDate: futureDate,
        },
      ],
    });

    expect(result.invalidCount).toBe(1);
    expect(result.results[0]?.warnings).toContain("Invalid Iqama number format");
  });
});
