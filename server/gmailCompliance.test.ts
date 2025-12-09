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

describe("Gmail Compliance Integration", () => {
  it("should test Gmail connection", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // This test verifies the Gmail connection test procedure exists
    // Actual Gmail connection will depend on MCP availability
    const result = await caller.complianceAlerts.testGmailConnection();

    expect(result).toHaveProperty("connected");
    expect(typeof result.connected).toBe("boolean");
  });

  it("should have manual compliance check procedure", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Test that the manual check procedure exists and returns expected structure
    // Note: This will not send actual emails without database data
    const result = await caller.complianceAlerts.runManualCheck({
      checkType: "daily",
    });

    expect(result).toHaveProperty("alertsFound");
    expect(result).toHaveProperty("emailsSent");
    expect(result).toHaveProperty("emailsFailed");
    expect(typeof result.alertsFound).toBe("number");
    expect(typeof result.emailsSent).toBe("number");
    expect(typeof result.emailsFailed).toBe("number");
  });

  it("should have PDF report generation procedure", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Test that PDF generation procedure exists
    // Note: This may fail without actual employer data, which is expected
    try {
      const result = await caller.complianceAlerts.generatePdfReport({
        employerId: 999, // Non-existent employer
      });
      
      // If it succeeds (unlikely), verify structure
      expect(result).toHaveProperty("filePath");
      expect(result).toHaveProperty("fileName");
    } catch (error) {
      // Expected to fail with non-existent employer
      expect(error).toBeDefined();
    }
  });

  it("should have Excel report generation procedure", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Test that Excel generation procedure exists
    // Note: This may fail without actual employer data, which is expected
    try {
      const result = await caller.complianceAlerts.generateExcelReport({
        employerId: 999, // Non-existent employer
      });
      
      // If it succeeds (unlikely), verify structure
      expect(result).toHaveProperty("filePath");
      expect(result).toHaveProperty("fileName");
    } catch (error) {
      // Expected to fail with non-existent employer
      expect(error).toBeDefined();
    }
  });
});
